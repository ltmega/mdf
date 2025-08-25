// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', function() {
    // Require authentication and admin role
    if (!requireAuth()) return;
    if (!requireRole('admin')) return;
    
    // Load profile data
    loadProfile();
    
    // Set up event listeners
    document.getElementById('edit-profile-btn').addEventListener('click', enableEditing);
    document.getElementById('cancel-edit-btn').addEventListener('click', cancelEditing);
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    document.getElementById('change-pic-btn').addEventListener('click', function() {
        document.getElementById('profile-pic-input').click();
    });
    document.getElementById('profile-pic-input').addEventListener('change', uploadProfilePicture);
});

// Load profile data
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        
        const profileData = await response.json();
        
        // Populate form fields
        document.getElementById('username').value = profileData.username || '';
        document.getElementById('email').value = profileData.email || '';
        document.getElementById('role').value = profileData.user_role || 'admin';
        document.getElementById('member-status').value = profileData.isMember ? 'Member' : 'Non-Member';
        
        // Update header info
        document.getElementById('profile-username').textContent = profileData.username;
        
        // Update profile pictures if changed
        if (profileData.profile_picture_url) {
            const profilePicUrl = `http://localhost:5000/uploads/${profileData.profile_picture_url}`;
            document.getElementById('profile-pic').src = profilePicUrl;
            document.getElementById('header-profile-pic').src = profilePicUrl;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again later.');
    }
}

// Enable editing
function enableEditing() {
    // Enable editable fields
    document.getElementById('email').disabled = false;
    
    // Show edit actions
    document.getElementById('edit-profile-btn').classList.add('hidden');
    document.getElementById('edit-actions').classList.remove('hidden');
}

// Cancel editing
function cancelEditing() {
    // Disable editable fields
    document.getElementById('email').disabled = true;
    
    // Hide edit actions
    document.getElementById('edit-profile-btn').classList.remove('hidden');
    document.getElementById('edit-actions').classList.add('hidden');
    
    // Reload profile to reset values
    loadProfile();
}

// Update profile
async function updateProfile(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:5000/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update profile');
        }
        
        // Disable editable fields
        document.getElementById('email').disabled = true;
        
        // Hide edit actions
        document.getElementById('edit-profile-btn').classList.remove('hidden');
        document.getElementById('edit-actions').classList.add('hidden');
        
        // Reload profile to show updated data
        await loadProfile();
        
        alert('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert(error.message || 'Error updating profile. Please try again later.');
    }
}

// Upload profile picture
async function uploadProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    try {
        const response = await fetch('http://localhost:5000/api/profile/picture', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload profile picture');
        }
        
        const data = await response.json();
        
        // Update profile pictures
        const profilePicUrl = `http://localhost:5000/uploads/${data.profilePicture}`;
        document.getElementById('profile-pic').src = profilePicUrl;
        document.getElementById('header-profile-pic').src = profilePicUrl;
        
        alert('Profile picture updated successfully!');
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert(error.message || 'Error uploading profile picture. Please try again later.');
    }
}