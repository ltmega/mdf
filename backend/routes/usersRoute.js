const express = require("express");
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For creating JSON Web Tokens
const db = require("../config/db"); // Database connection pool
const config = require("../config/config"); // Application configuration (JWT secret, frontend URL)
const emailService = require("../config/emailService"); // For sending password reset emails
const  verifyToken = require('../middleware/authMiddleware'); // Middleware for token verification
const multer = require('multer'); // For handling file uploads (profile pictures)
const path = require('path'); // Node.js path module for file paths

const router = express.Router(); // Create an Express router

// --- Multer Storage Configuration for Profile Pictures ---
const profilePictureStorage = multer.diskStorage({
    // Define the destination directory for uploaded files
    destination: (req, file, cb) => {
        // Ensure this path is relative to where server.js is run, or an absolute path
        // It's typically 'uploads/profiles/' relative to the backend directory
        cb(null, path.join(__dirname, '../uploads/profiles/'));
    },
    // Define the filename for uploaded files
    filename: (req, file, cb) => {
        // Create a unique filename: fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

// Create the Multer upload instance
const profilePictureUpload = multer({
    storage: profilePictureStorage,
    // Optional: File filter for image types
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, JPG, PNG, GIF) are allowed!'));
        }
    },
    // Optional: Limit file size (e.g., 5MB)
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('profilePicture'); // 'profilePicture' is the name of the input field in the form

// --- User Registration Route ---
router.post("/register", async (req, res) => {
    try {
        // Destructure required fields from request body
        const { email, password, username } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Username, email, and password are required." });
        }

        // Hash the password before storing it in the database for security
        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultRole = "customer"; // Default role for new registrations

        // Insert new user into the Users table
        db.query(
            "INSERT INTO users (username, email, password, user_role) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, defaultRole],
            (err, results) => {
                if (err) {
                    console.error("Error registering user:", err);
                    // Handle duplicate entry error (e.g., username or email already exists)
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: "Username or email already exists." });
                    }
                    // Generic server error
                    return res.status(500).json({ error: "Error registering user. Please try again." });
                }
                // Successful registration
                res.status(201).json({ message: "Registration successful! You can now log in." });
            }
        );
    } catch (error) {
        console.error("Server error during registration:", error);
        res.status(500).json({ error: "Server error during registration." });
    }
});

// --- User Login Route ---
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    // Query the database to find the user by username
    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
        if (err) {
            console.error("Error during login query:", err);
            return res.status(500).json({ error: "Error during login." });
        }
        // Check if user exists
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        const user = results[0]; // Get the first (and only) user found

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        // Create a JSON Web Token (JWT) for the verifyTokend user
        // IMPORTANT FIX: Ensure user_id is included in the token payload for protected routes
        const token = jwt.sign(
            {
                user_id: user.user_id, // Use user_id from database, crucial for authMiddleware
                email: user.email,
                role: user.user_role,
                isMember: user.isMember // Assuming 'isMember' field exists in your user table
            },
            config.jwtSecret, // Your secret key from config.js
            { expiresIn: "1h" } // Token expires in 1 hour
        );

        console.log(`User "${user.username}" logged in with role: ${user.user_role}`);

        // Send success response with token and user details
        res.json({
            success: true,
            token,
            user: {
                id: user.user_id, // Send user_id back to frontend for convenience
                username: user.username,
                role: user.user_role,
                isMember: user.isMember,
                email: user.email,
                profilePicture: user.profile_picture // Include profile picture path
            }
        });
    });
});

// --- Password Reset Request Route ---
router.post("/password-reset", async (req, res) => {
    const { email } = req.body;

    // Basic validation
    if (!email) {
        return res.status(400).json({ error: "Email is required for password reset." });
    }

    // Generate a unique token for password reset
    const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: "15m" }); // Token valid for 15 minutes

    // Store the token in the password_resets table
    db.query("INSERT INTO password_resets (email, token) VALUES (?, ?)", [email, token], async (err) => {
        if (err) {
            console.error("Error creating reset token:", err);
            return res.status(500).json({ error: "Error creating reset token." });
        }

        // Construct the reset link that the user will click
        const resetLink = `${config.frontendUrl}/reset-password.html?token=${token}`; // Assuming a reset-password.html page

        try {
            // Send the password reset email
            await emailService.sendPasswordResetEmail(email, resetLink);
            res.json({ message: "Password reset link sent to your email. Please check your inbox." });
        } catch (mailError) {
            console.error("Failed to send password reset email:", mailError);
            res.status(500).json({ error: "Failed to send password reset email. Please try again later." });
        }
    });
});

// --- Upload Profile Picture Route (Protected) ---
// Requires verifyToken middleware to ensure user is verifyTokend
router.post('/profile/picture', verifyToken, (req, res) => {
    // Use Multer's upload middleware
    profilePictureUpload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer error:', err);
            return res.status(400).json({ error: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Unknown upload error:', err);
            return res.status(500).json({ error: err.message || 'Error uploading file.' });
        }

        // If no file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded. Please select an image.' });
        }

        // Get user ID from the token (attached by verifyToken middleware)
        const userId = req.user.user_id;
        // Construct the path to store in the database (relative to the server's static files)
        const imagePath = `/uploads/profiles/${req.file.filename}`;

        // Update the user's profile_picture in the database
        db.query(
            'UPDATE users SET profile_picture = ? WHERE user_id = ?',
            [imagePath, userId],
            (dbErr, results) => {
                if (dbErr) {
                    console.error('Database error updating profile picture:', dbErr);
                    // Handle specific database errors
                    if (dbErr.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'Duplicate entry. A profile picture with that name already exists.' });
                    } else if (dbErr.code === 'ER_DATA_TOO_LONG') {
                        return res.status(413).json({ error: 'Data too long. The profile picture path is too long.' });
                    } else if (dbErr.code === 'ER_BAD_NULL_ERROR') {
                        return res.status(400).json({ error: "Bad request. A required field is missing or invalid." });
                    } else {
                        return res.status(500).json({ error: 'Internal server error. Database update failed.' });
                    }
                }
                // Check if any row was affected (user found and updated)
                if (results.affectedRows === 0) {
                    return res.status(404).json({ error: 'User not found or profile picture update failed.' });
                }
                // Success response
                res.json({ message: 'Profile picture updated successfully', profilePicture: imagePath });
            }
        );
    });
});

// --- Get User Profile Route (Protected) ---
// Requires verifyToken middleware to ensure user is verifyTokend
router.get('/profile', verifyToken, (req, res) => {
    // User information (including user_id and email) is available in req.user from verifyToken
    const userId = req.user.user_id;

    // Query the database to get user profile details
    db.query(
        'SELECT user_id, username, email, first_name, last_name, phone_number, profile_picture, user_role FROM users WHERE user_id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error('Database error fetching profile:', err);
                return res.status(500).json({ error: 'Internal server error.' });
            }
            // Check if user exists
            if (results.length === 0) {
                return res.status(404).json({ error: 'User profile not found.' });
            }
            // Send the user's profile data
            res.json(results[0]);
        }
    );
});

module.exports = router; // Export the router to be used in server.js
