document.addEventListener("DOMContentLoaded", () => {
  const formTitle = document.getElementById("form-title");
  const nameField = document.getElementById("name-field");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("submit-button");
  const toggleBtn = document.getElementById("toggle-button");
  const messageBox = document.getElementById("message");

  // Only validate elements that are required for the current page
  // Some elements may not exist on all pages, which is okay
  const requiredElements = [formTitle, nameInput, passwordInput, submitBtn, toggleBtn, messageBox];
  const missingElements = requiredElements.filter(element => !element);
  
  if (missingElements.length > 0) {
    // Only show error if we're on a page that should have these elements
    // Check if the auth form exists
    const authForm = document.getElementById("auth-form");
    if (authForm) {
      console.error("One or more required elements are missing in the DOM.");
      return;
    } else {
      // Not on an auth page, so it's okay that elements are missing
      return;
    }
  }

  let isLogin = true;

  // Function to display messages
  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `${type} mt-2 text-sm text-center`;
    messageBox.classList.remove("hidden");
  }

  // Toggle between Login and Register forms
  toggleBtn.addEventListener("click", () => {
    isLogin = !isLogin;
    formTitle.textContent = isLogin ? "Login" : "Register";
    nameField.classList.toggle("hidden", isLogin);
    emailInput.parentElement.classList.toggle("hidden", isLogin);
    submitBtn.textContent = isLogin ? "Login" : "Register";
    toggleBtn.textContent = isLogin ? "New user? Register" : "Already have an account? Login";
    messageBox.className = "hidden";
    messageBox.textContent = "";
  });

  // Handle form submission
  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    messageBox.className = "hidden";
    messageBox.textContent = "";

    const username = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validate input fields
    if (!username) return showMessage("Please enter your username", "error");
    if (!password) return showMessage("Please enter your password", "error");
    if (!isLogin && !email) return showMessage("Please enter your email", "error");

    const endpoint = isLogin
      ? "http://localhost:5000/api/users/login"
      : "http://localhost:5000/api/users/register";

    const payload = isLogin
      ? { username, password }
      : { username, email, password };

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = isLogin ? "Logging in..." : "Registering...";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return showMessage(data.error || data.message || "Something went wrong.", "error");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("Login successful! Redirecting...", "success");

      setTimeout(() => {
        const role = data.user.user_role;
        switch (role) {
          case "admin":
            window.location.href = "/frontend/admin/html/admin-dashboard.html";
            break;
          case "seller":
            window.location.href = "/frontend/seller/seller-dashboard.html";
            break;
          case "customer":
          default:
            window.location.href = "/frontend/public/html/index.html";
        }
      }, 1500);
    } catch (err) {
      console.error("Fetch error:", err);
      showMessage("Server error. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
});