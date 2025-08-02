// js/recipes.js

document.addEventListener("DOMContentLoaded", async () => {
  const recipeList = document.getElementById("recipe-list");

  try {
    const res = await fetch("/api/recipes");
    const recipes = await res.json();

    if (recipes.length === 0) {
      recipeList.innerHTML = "<p class='text-gray-600'>No recipes available at the moment.</p>";
      return;
    }

    recipes.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover rounded-t-xl">
        <div class="p-4">
          <h2 class="card-title">${recipe.title}</h2>
          <p class="card-body">${recipe.description}</p>
        </div>
      `;
      recipeList.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading recipes:", err);
    recipeList.innerHTML = "<p class='text-red-600'>Failed to load recipes. Please try again later.</p>";
  }
});
