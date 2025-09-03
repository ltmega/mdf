document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const profileLink = document.getElementById("profile-link");
  const profilePic = document.getElementById("header-profile-pic");
  const profileName = document.getElementById("profile-username");
  const logoutBtn = document.getElementById("logout-btn");
  const loginRegisterLink = document.getElementById("login-register-link");
  const ordersTab = document.getElementById("orders-tab");
  const nav = document.querySelector("nav");

  if (user && token) {
    // Only update elements that exist on the page
    if (profileLink) profileLink.classList.remove("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");
    if (loginRegisterLink) loginRegisterLink.classList.add("hidden");
    if (ordersTab) ordersTab.classList.remove("hidden");

    // Handle profile picture URL
    if (profilePic || profileName) {
      let imagePath = user.profile_picture_url || "/uploads/icon.png";
      if (!imagePath.startsWith("/uploads/")) {
        imagePath = `/uploads/${imagePath}`;
      }
      if (profilePic) profilePic.src = imagePath;
      if (profileName) profileName.textContent = user.username;
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../public/html/login.html";
      });
    }
  } else {
    if (profileLink) profileLink.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (loginRegisterLink) loginRegisterLink.classList.remove("hidden");
    if (ordersTab) ordersTab.classList.add("hidden");
  }
});