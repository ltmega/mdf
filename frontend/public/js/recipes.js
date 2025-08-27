document.addEventListener("DOMContentLoaded", async () => {
  const recipeList = document.getElementById("recipe-list");
  recipeList.innerHTML = '<p class="text-gray-600 text-center">Loading recipes...</p>';

  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You must be logged in to view recipes.");
      window.location.href = "login.html";
      return;
    }

    const res = await fetch(`${API_BASE}/api/recipes`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to load recipes");

    const recipes = await res.json();
    if (recipes.length === 0) {
      recipeList.innerHTML = "<p class='text-gray-600 text-center'>No recipes available.</p>";
      return;
    }

    recipeList.innerHTML = recipes
      .map(
        (recipe) => `
        <div class="bg-white p-4 rounded-lg shadow">
          <img src="${API_BASE}${recipe.recipe_image_url}" 
               alt="${recipe.recipe_name}" 
               class="w-full h-48 object-cover rounded-md mb-4"
               onerror="this.src='${API_BASE}/uploads/recipes/default.jpg'" />
          <h2 class="text-lg font-bold text-gray-800">${recipe.recipe_name}</h2>
          <p class="text-sm text-gray-600">${recipe.ingredients || "No ingredients available."}</p>
          <button class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md mt-4" onclick="orderIngredients(${recipe.recipe_id})">
            Order Ingredients
          </button>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Error loading recipes:", err);
    recipeList.innerHTML = `<p class='text-red-600 text-center'>${err.message}</p>`;
  }
});

// Order ingredients for a recipe
async function orderIngredients(recipeId) {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You must be logged in as a buyer to order ingredients.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    });

    if (!res.ok) throw new Error("Failed to place order.");

    alert("Order placed successfully!");
  } catch (err) {
    console.error("Error placing order:", err);
    alert("Failed to place order. Please try again.");
  }
}