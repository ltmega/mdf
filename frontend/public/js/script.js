document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const profileLink = document.getElementById("profile-link");
  const profilePic = document.getElementById("header-profile-pic");
  const profileName = document.getElementById("profile-username");
  const logoutBtn = document.getElementById("logout-btn");
  const loginRegisterLink = document.getElementById("login-register-link");
  const nav = document.querySelector("nav");

  if (user && token) {
    profileLink.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loginRegisterLink.classList.add("hidden");

    let imagePath = user.profile_picture_url || "icon.png";
    if (!imagePath.startsWith("/uploads/")) {
      imagePath = `/uploads/${imagePath}`;
    }
    profilePic.src = imagePath;
    profileName.textContent = user.username;

    if (user.user_role === "customer" && !document.getElementById("orders-tab")) {
      const ordersLink = document.createElement("a");
      ordersLink.href = "orders.html";
      ordersLink.textContent = "Orders";
      ordersLink.id = "orders-tab";
      ordersLink.className = "text-gray-800 hover:text-black";
      nav.insertBefore(ordersLink, profileLink);
    }

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  } else {
    profileLink.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    loginRegisterLink.classList.remove("hidden");

    const ordersTab = document.getElementById("orders-tab");
    if (ordersTab) ordersTab.remove();
  }
});