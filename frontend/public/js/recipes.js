document.addEventListener("DOMContentLoaded", async () => {
  const recipesList = document.getElementById("recipe-list");
  const API_BASE = "http://localhost:5000";
  const token = localStorage.getItem("token");

  try {
    recipesList.innerHTML = '<p class="text-gray-600 text-center">Loading recipes...</p>';

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/api/recipes`, { headers });
    if (!response.ok) throw new Error('Failed to fetch recipes');

    const recipes = await response.json();
    displayRecipes(recipes, API_BASE);
  } catch (error) {
    console.error('Error loading recipes:', error);
    recipesList.innerHTML = `
      <div class="text-center text-red-500">
        <p>Error loading recipes. Please try again later.</p>
      </div>
    `;
  }
});

function displayRecipes(recipes, API_BASE) {
  const recipesList = document.getElementById("recipe-list");

  if (recipes.length === 0) {
    recipesList.innerHTML = `
      <div class="text-center text-gray-500">
        <p>No recipes available.</p>
      </div>
    `;
    return;
  }

  recipesList.innerHTML = recipes.map(recipe => {
    const imageUrl = recipe.recipe_image_url || "/uploads/icon.png";
    const fullImageUrl = imageUrl.startsWith("/uploads/")
      ? `${API_BASE}${imageUrl}`
      : `${API_BASE}/uploads/${imageUrl}`;

    return `
      <div class="bg-white p-6 rounded-lg shadow-md">
        <img src="${fullImageUrl}" alt="${recipe.recipe_name}"
             class="w-full h-48 object-cover rounded-md mb-4"
             onerror="this.src='${API_BASE}/uploads/icon.png'" />

        <h3 class="text-xl font-semibold text-gray-800 mb-3">${recipe.recipe_name}</h3>

        <div class="mb-4">
          <h4 class="font-medium text-gray-700 mb-2">Ingredients:</h4>
          <p class="text-gray-600 text-sm">${recipe.ingredients || 'No ingredients listed'}</p>
        </div>

        <div class="mb-4">
          <h4 class="font-medium text-gray-700 mb-2">Instructions:</h4>
          <p class="text-gray-600 text-sm">${recipe.instructions || 'No instructions available'}</p>
        </div>

        <div class="text-sm text-gray-500 mb-4">
          <p>Created by: ${recipe.username || 'Unknown'}</p>
        </div>

        <button 
          class="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          onclick="orderIngredients(${recipe.recipe_id})">
          Order Ingredients
        </button>
      </div>
    `;
  }).join('');
}

async function orderIngredients(recipeId) {
  try {
    const API_BASE = "http://localhost:5000";
    const res = await fetch(`${API_BASE}/api/recipes/${recipeId}/ingredients`);
    if (!res.ok) throw new Error('Failed to fetch ingredients');

    const data = await res.json();
    const ingredientsArray = data.ingredients.split(',').map(i => ({
      name: i.trim(),
      quantity: 1,
      unit: '', // optional for now
      price: 0, // default price
      description: '' // optional
    }));

    // Use the new cart function
    addRecipeIngredientsToCart(ingredientsArray);

    // Redirect to cart
    window.location.href = '/frontend/public/html/cart.html';
  } catch (err) {
    console.error('Error ordering ingredients:', err);
    alert('Could not add ingredients to cart.');
  }
}