document.addEventListener('DOMContentLoaded', async () => {
  const recipeList = document.getElementById('recipe-list');
  const API_BASE = "http://localhost:5000";

  try {
    const res = await fetch(`${API_BASE}/api/recipes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const recipes = await res.json();
    recipeList.innerHTML = '';

    recipes.forEach(recipe => {
      // Construct full image URL
      const imageUrl = `${API_BASE}${recipe.recipe_image_url}`;

      // Create image element with fallback
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = recipe.recipe_name;
      img.className = 'w-full h-48 object-cover';
      img.onerror = () => {
        if (!img.dataset.fallback) {
          img.src = `${API_BASE}/uploads/fallbacks/no-image.jpg`;
          img.dataset.fallback = true;
        }
      };

      // Create card container
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow-md overflow-hidden mb-6';

      // Create content section
      const content = document.createElement('div');
      content.className = 'p-4';
      content.innerHTML = `
        <h2 class="text-xl font-bold text-gray-800 mb-2">${recipe.recipe_name}</h2>
        <p class="text-sm text-gray-600 mb-2"><strong>Ingredients:</strong> ${recipe.ingredients}</p>
        <p class="text-sm text-gray-600"><strong>Instructions:</strong> ${recipe.instructions}</p>
      `;

      // Assemble card
      card.appendChild(img);
      card.appendChild(content);
      recipeList.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading recipes:', err);
    recipeList.innerHTML = `
      <div class="text-center text-red-600 mt-4">
        <p>⚠️ Failed to load recipes. Please check your backend and try again.</p>
      </div>
    `;
  }

  // Add order button to each recipe card
recipes.forEach(recipe => {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-lg shadow-md overflow-hidden mb-6';

  const content = document.createElement('div');
  content.className = 'p-4';
  content.innerHTML = `
    <h2 class="text-xl font-bold text-gray-800 mb-2">${recipe.recipe_name}</h2>
    <p class="text-sm text-gray-600 mb-2"><strong>Ingredients:</strong> ${recipe.ingredients}</p>
    <p class="text-sm text-gray-600"><strong>Instructions:</strong> ${recipe.instructions}</p>
    <button class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md mt-4" onclick="orderIngredients(${recipe.id})">
      Order Ingredients
    </button>
  `;

  card.appendChild(content);
  recipeList.appendChild(card);
});

// Function to order ingredients
async function orderIngredients(recipeId) {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || user.user_role !== 'buyer') {
    alert('You must be logged in as a buyer to order ingredients.');
    return;
  }

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    });

    if (!res.ok) throw new Error('Failed to place order.');

    alert('Order placed successfully!');
  } catch (error) {
    console.error('Error placing order:', error);
    alert('Failed to place order. Please try again.');
  }
}
});