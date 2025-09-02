// js/profile.js

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  if (!user || !token) {
    window.location.href = "login.html";
    return;
  }

  // Load user profile
  await loadProfile();
  
  // Set up form submission
  document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
});

async function loadProfile() {
  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const profile = await response.json();
    displayProfile(profile, API_BASE);
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('profile-content').innerHTML = `
      <div class="text-center text-red-500">
        <p>Error loading profile. Please try again later.</p>
      </div>
    `;
  }
}

function displayProfile(profile, API_BASE) {
  const profileContent = document.getElementById('profile-content');
  
  // Handle profile picture URL
  const imageUrl = profile.profile_picture_url || "/uploads/icon.png";
  const fullImageUrl = imageUrl.startsWith("/uploads/") ? `${API_BASE}${imageUrl}` : `${API_BASE}/uploads/${imageUrl}`;

  profileContent.innerHTML = `
    <div class="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <img src="${fullImageUrl}" 
             alt="Profile Picture" 
             class="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
             onerror="this.src='${API_BASE}/uploads/icon.png'" />
        <h2 class="text-2xl font-bold text-gray-800">${profile.username}</h2>
        <p class="text-gray-600">${profile.email}</p>
        <span class="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full mt-2">
          ${profile.user_role}
        </span>
      </div>

      <form id="profile-form" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">Username</label>
          <input type="text" 
                 id="username" 
                 name="username" 
                 value="${profile.username}" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input type="email" 
                 id="email" 
                 name="email" 
                 value="${profile.email}" 
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <div>
          <label for="profile-pic" class="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
          <input type="file" 
                 id="profile-pic" 
                 name="profile-pic" 
                 accept="image/*"
                 class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>

        <button type="submit" 
                class="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
          Update Profile
        </button>
      </form>
    </div>
  `;
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  
  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");
    
    const formData = new FormData();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const profilePic = document.getElementById('profile-pic').files[0];

    if (username) formData.append('username', username);
    if (email) formData.append('email', email);
    if (profilePic) formData.append('profile_pic', profilePic);

    const response = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    alert('Profile updated successfully!');
    
    // Reload profile to show updated data
    await loadProfile();
    
    // Update localStorage user data
    const user = JSON.parse(localStorage.getItem("user"));
    if (username) user.username = username;
    if (email) user.email = email;
    localStorage.setItem("user", JSON.stringify(user));
    
  } catch (error) {
    console.error('Error updating profile:', error);
    alert(error.message || 'Error updating profile. Please try again.');
  }
}