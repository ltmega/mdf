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
});