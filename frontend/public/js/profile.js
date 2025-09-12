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
  
  // Load user orders
  await loadUserOrders();
  
  // Set up form submission
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }
  
  // Set up edit button
  const editProfileBtn = document.getElementById('edit-profile-btn');
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', enableEditing);
  }
  
  // Set up cancel button
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', cancelEditing);
  }
  
  // Set up change picture button
  const changePicBtn = document.getElementById('change-pic-btn');
  const profilePicInput = document.getElementById('profile-pic-input');
  if (changePicBtn && profilePicInput) {
    changePicBtn.addEventListener('click', () => {
      profilePicInput.click();
    });
    profilePicInput.addEventListener('change', handleProfilePicChange);
  }
  
  // Set up logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

// Handle logout
function handleLogout(e) {
  e.preventDefault();
  
  if (confirm('Are you sure you want to logout?')) {
    // Clear all user data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear user-specific cart
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      const cartKey = `cart_${user.user_id}`;
      localStorage.removeItem(cartKey);
    }
    
    // Redirect to login page
    window.location.href = 'login.html';
  }
}

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
    // Update existing elements with error message
    const profilePic = document.getElementById('profile-pic');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const roleInput = document.getElementById('role');
    
    if (profilePic) profilePic.src = '/uploads/icon.png';
    if (usernameInput) usernameInput.value = 'Error loading profile';
    if (emailInput) emailInput.value = 'Error loading profile';
    if (roleInput) roleInput.value = 'Error loading profile';
  }
}

function displayProfile(profile, API_BASE) {
  // Update existing elements with profile data
  const profilePic = document.getElementById('profile-pic');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const roleInput = document.getElementById('role');
  const memberStatusInput = document.getElementById('member-status');
  
  // Handle profile picture URL
  if (profilePic) {
    const imageUrl = profile.profile_picture_url || "/uploads/icon.png";
    const fullImageUrl = imageUrl.startsWith("/uploads/") ? `${API_BASE}${imageUrl}` : `${API_BASE}/uploads/${imageUrl}`;
    profilePic.src = fullImageUrl;
    profilePic.onerror = function() {
      this.src = `${API_BASE}/uploads/icon.png`;
    };
  }
  
  // Update form fields
  if (usernameInput) usernameInput.value = profile.username || '';
  if (emailInput) emailInput.value = profile.email || '';
  if (roleInput) roleInput.value = profile.user_role || '';
  if (memberStatusInput) memberStatusInput.value = profile.membership_status || 'Active';
  
  // Update header username
  const headerUsername = document.getElementById('profile-username');
  if (headerUsername) {
    headerUsername.textContent = profile.username || 'User';
  }
}

// Load user orders for profile page
async function loadUserOrders() {
  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !token) return;

    // Get orders based on user role
    let endpoint;
    if (user.user_role === "admin") {
      endpoint = `${API_BASE}/api/orders/admin`;
    } else if (user.user_role === "seller") {
      endpoint = `${API_BASE}/api/orders/seller`;
    } else {
      endpoint = `${API_BASE}/api/orders/user`;
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await response.json();
    displayOrderHistory(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
    const orderHistory = document.getElementById('order-history');
    if (orderHistory) {
      orderHistory.innerHTML = '<p class="text-red-500 text-center">Error loading orders. Please try again later.</p>';
    }
  }
}

// Display order history in profile page
function displayOrderHistory(orders) {
  const orderHistory = document.getElementById('order-history');
  
  if (!orderHistory) return;
  
  if (orders.length === 0) {
    orderHistory.innerHTML = '<p class="text-gray-600 text-center">No orders found.</p>';
    return;
  }

  orderHistory.innerHTML = orders.map(order => `
    <div class="bg-gray-50 p-4 rounded-lg border">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h4 class="font-semibold text-gray-800">Order #${order.order_id}</h4>
          <p class="text-sm text-gray-600">Date: ${new Date(order.order_date).toLocaleDateString()}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-orange-600">UGX ${order.total_amount}</p>
          <p class="text-sm ${getStatusColor(order.status)}">${order.status}</p>
        </div>
      </div>
      <p class="text-sm text-gray-600">Delivery: ${order.delivery_address}</p>
    </div>
  `).join('');
}

function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'text-yellow-600';
    case 'confirmed': return 'text-blue-600';
    case 'delivered': return 'text-green-600';
    case 'cancelled': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

// Enable profile editing
function enableEditing() {
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  
  if (usernameInput) usernameInput.disabled = false;
  if (emailInput) emailInput.disabled = false;
  
  // Show edit actions
  const editActions = document.getElementById('edit-actions');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  
  if (editActions) editActions.classList.remove('hidden');
  if (editProfileBtn) editProfileBtn.classList.add('hidden');
}

// Cancel profile editing
function cancelEditing() {
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  
  if (usernameInput) usernameInput.disabled = true;
  if (emailInput) emailInput.disabled = true;
  
  // Hide edit actions
  const editActions = document.getElementById('edit-actions');
  const editProfileBtn = document.getElementById('edit-profile-btn');
  
  if (editActions) editActions.classList.add('hidden');
  if (editProfileBtn) editProfileBtn.classList.remove('hidden');
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  
  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");
    
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    
    const username = usernameInput ? usernameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, email })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update profile');
    }

    alert('Profile updated successfully!');
    
    // Disable fields after successful update
    if (usernameInput) usernameInput.disabled = true;
    if (emailInput) emailInput.disabled = true;
    
    // Hide edit actions
    const editActions = document.getElementById('edit-actions');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    
    if (editActions) editActions.classList.add('hidden');
    if (editProfileBtn) editProfileBtn.classList.remove('hidden');
    
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

// Handle profile picture change
async function handleProfilePicChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");
    
    const formData = new FormData();
    formData.append('profile_pic', file);
    
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = 'Failed to update profile picture';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the response text
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }
    
    // After successful upload, get updated user data
    const updatedUserResponse = await fetch(`${API_BASE}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!updatedUserResponse.ok) {
      throw new Error('Failed to fetch updated profile data');
    }
    
    const updatedUser = await updatedUserResponse.json();
    
    // Update local storage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update profile pictures
    const profilePic = document.getElementById('profile-pic');
    const headerProfilePic = document.getElementById('header-profile-pic');
    
    if (profilePic || headerProfilePic) {
      let imagePath = updatedUser.profile_picture_url || "/uploads/icon.png";
      if (!imagePath.startsWith("/uploads/")) {
        imagePath = `/uploads/${imagePath}`;
      }
      if (profilePic) profilePic.src = imagePath;
      if (headerProfilePic) headerProfilePic.src = imagePath;
    }
    
    alert('Profile picture updated successfully!');
  } catch (error) {
    console.error('Error updating profile picture:', error);
    alert(error.message || 'Error updating profile picture');
  }
}