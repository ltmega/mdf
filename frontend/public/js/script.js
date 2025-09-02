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
    profileLink.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loginRegisterLink.classList.add("hidden");
    ordersTab.classList.remove("hidden");

    // Handle profile picture URL
    let imagePath = user.profile_picture_url || "/uploads/icon.png";
    if (!imagePath.startsWith("/uploads/")) {
      imagePath = `/uploads/${imagePath}`;
    }
    profilePic.src = imagePath;
    profileName.textContent = user.username;

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  } else {
    profileLink.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    loginRegisterLink.classList.remove("hidden");
    ordersTab.classList.add("hidden");
  }
});