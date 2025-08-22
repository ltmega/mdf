// js/profile.js

document.addEventListener("DOMContentLoaded", async () => {
  // Require authentication
  if (!requireAuth()) return;

  const profileForm = document.getElementById("profile-form");
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const editActions = document.getElementById("edit-actions");
  const changePicBtn = document.getElementById("change-pic-btn");
  const profilePicInput = document.getElementById("profile-pic-input");
  const profilePic = document.getElementById("profile-pic");
  const headerProfilePic = document.getElementById("header-profile-pic");

  // Load user profile data
  await loadProfile();

  // Event listeners
  editProfileBtn.addEventListener("click", enableEditing);
  cancelEditBtn.addEventListener("click", cancelEditing);
  profileForm.addEventListener("submit", updateProfile);
  changePicBtn.addEventListener("click", () => profilePicInput.click());
  profilePicInput.addEventListener("change", uploadProfilePicture);

  async function loadProfile() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load profile");
      }

      const profileData = await res.json();
      
      // Populate form fields
      document.getElementById("username").value = profileData.username || "";
      document.getElementById("email").value = profileData.email || "";
      document.getElementById("role").value = profileData.role || "";
      document.getElementById("member-status").value = profileData.isMember ? "Member" : "Non-Member";
      
      // Update header info
      document.getElementById("profile-username").textContent = profileData.username;
      
      // Update profile pictures if changed
      if (profileData.profile_picture) {
        const profilePicUrl = `http://localhost:5000${profileData.profile_picture}`;
        profilePic.src = profilePicUrl;
        headerProfilePic.src = profilePicUrl;
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      alert("Failed to load profile. Please try again.");
    }
  }

  function enableEditing() {
    // Enable editable fields
    document.getElementById("email").disabled = false;
    
    // Show edit actions
    editProfileBtn.classList.add("hidden");
    editActions.classList.remove("hidden");
  }

  function cancelEditing() {
    // Disable editable fields
    document.getElementById("email").disabled = true;
    
    // Hide edit actions
    editProfileBtn.classList.remove("hidden");
    editActions.classList.add("hidden");
    
    // Reload profile to reset values
    loadProfile();
  }

  async function updateProfile(e) {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      // Disable editable fields
      document.getElementById("email").disabled = true;
      
      // Hide edit actions
      editProfileBtn.classList.remove("hidden");
      editActions.classList.add("hidden");
      
      // Reload profile to show updated data
      await loadProfile();
      
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err.message || "Failed to update profile. Please try again.");
    }
  }

  async function uploadProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const res = await fetch("http://localhost:5000/api/users/profile/picture", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload profile picture");
      }

      const data = await res.json();
      
      // Update profile pictures
      const profilePicUrl = `http://localhost:5000${data.profilePicture}`;
      profilePic.src = profilePicUrl;
      headerProfilePic.src = profilePicUrl;
      
      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      alert(err.message || "Failed to upload profile picture. Please try again.");
    }
  }
});