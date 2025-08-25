// login.js - Handles login page specific functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize login page functionality
  console.log("Login page loaded");
  
  // Any login page specific initialization can go here
  // For now, we're relying on auth.js for the main authentication logic
  
  // If you need to add any login-specific functionality, add it here
  // For example, form validation, UI enhancements, etc.
  
  // Example: Add focus to the username field on page load
  const usernameInput = document.getElementById("name");
  if (usernameInput) {
    usernameInput.focus();
  }
});