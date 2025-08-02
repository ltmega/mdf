const formTitle = document.getElementById("form-title");
const nameField = document.getElementById("name-field");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-button");
const toggleBtn = document.getElementById("toggle-button");
const messageBox = document.getElementById("message");

let isLogin = true;

toggleBtn.addEventListener("click", () => {
  isLogin = !isLogin;
  if (isLogin) {
    formTitle.textContent = "Login";
    nameField.classList.add("hidden");
    submitBtn.textContent = "Login";
    toggleBtn.textContent = "New user? Register";
  } else {
    formTitle.textContent = "Register";
    nameField.classList.remove("hidden");
    submitBtn.textContent = "Register";
    toggleBtn.textContent = "Already have an account? Login";
  }
});

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  messageBox.className = "hidden";
  messageBox.textContent = "";

  let endpoint, payload;
  if (isLogin) {
    endpoint = "http://localhost:5000/api/users/login";
    payload = {
      username: nameInput.value,
      password: passwordInput.value,
    };
  } else {
    endpoint = "http://localhost:5000/api/users/register";
    payload = {
      username: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }

    if (!res.ok) {
      messageBox.textContent = data.error || data.message || "Something went wrong.";
      messageBox.className = "error";
      messageBox.classList.remove("hidden");
      return;
    }

    // Registration success
    if (!isLogin) {
      messageBox.textContent = data.message || "Registration successful! You can now log in.";
      messageBox.className = "success";
      messageBox.classList.remove("hidden");
      setTimeout(() => {
        toggleBtn.click();
        messageBox.textContent = "Please login with your new account.";
        messageBox.className = "success";
        messageBox.classList.remove("hidden");
      }, 1500);
      return;
    }

    // Login success: Show message, then redirect
    messageBox.textContent = "Login successful! Redirecting...";
    messageBox.className = "success";
    messageBox.classList.remove("hidden");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setTimeout(() => {
      window.location.href = "products.html";
    }, 1200);
  } catch (err) {
    console.error(err);
    messageBox.textContent = "Server error.";
    messageBox.className = "error";
    messageBox.classList.remove("hidden");
  }
});
