document.addEventListener("DOMContentLoaded", () => {
  const formTitle = document.getElementById("form-title");
  const nameField = document.getElementById("name-field");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("submit-button");
  const toggleBtn = document.getElementById("toggle-button");
  const messageBox = document.getElementById("message");

  let isLogin = true;

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `${type} mt-2 text-sm text-center`;
    messageBox.classList.remove("hidden");
  }

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

  document.getElementById("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    messageBox.className = "hidden";
    messageBox.textContent = "";

    const username = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username) return showMessage("Please enter your username", "error");
    if (!password) return showMessage("Please enter your password", "error");
    if (!isLogin && !email) return showMessage("Please enter your email", "error");

    const endpoint = isLogin
      ? "http://localhost:5000/api/users/login"
      : "http://localhost:5000/api/users/register";

    const payload = isLogin
      ? { username, password }
      : { username, email, password };

    console.log("🔄 Sending request to:", endpoint);
    console.log("📦 Payload:", payload);

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = isLogin ? "Logging in..." : "Registering...";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("📨 Raw response:", text);

      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error("❌ JSON parse error:", err);
        return showMessage("Invalid server response.", "error");
      }

      if (!res.ok) {
        return showMessage(data.error || data.message || "Something went wrong.", "error");
      }

      if (!data.user || !data.user.user_role) {
        console.warn("⚠️ Missing user role in response:", data.user);
        return showMessage("Login failed: Missing user role.", "error");
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("Login successful! Redirecting...", "success");

      // Redirect based on role
      setTimeout(() => {
        const role = data.user.user_role;
        console.log("🔍 Redirecting based on role:", role);

        switch (role) {
          case "admin":
            window.location.href = "/frontend/admin/html/admin-dashboard.html";
            break;
          case "seller":
            window.location.href = "/frontend/seller/seller-dashboard.html";
            break;
          case "buyer":
          default:
            window.location.href = "/frontend/public/html/index.html";
        }
      }, 1500);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      showMessage("Server error. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
});