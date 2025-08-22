// Check if user is logged in and is an admin
document.addEventListener('DOMContentLoaded', function() {
    // Require authentication and admin role
    if (!requireAuth()) return;
    if (!requireRole('admin')) return;
    
    // Load recipes data
    loadRecipes();
    
    // Set up form submission
    document.getElementById('add-recipe-form').addEventListener('submit', handleAddRecipe);
    
    // Set up search functionality
    document.getElementById('search-recipes').addEventListener('input', function(e) {
        // In a real implementation, this would filter the recipes
        console.log('Search term:', e.target.value);
    });
});

// Load recipes data
async function loadRecipes() {
    try {
        const token = localStorage.getItem('token');
        
        // In a real implementation, this would fetch recipes from the server
        // For now, we'll show a placeholder
        const recipesContainer = document.getElementById('recipes-list');
        recipesContainer.innerHTML = `
            <div class="col-span-full text-center text-gray-500">
                <p>No recipes found. When users add recipes, they will appear here.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading recipes:', error);
        document.getElementById('recipes-list').innerHTML = `
            <div class="col-span-full text-center text-red-500">
                <p>Error loading recipes. Please try again later.</p>
            </div>
        `;
    }
}

// Handle adding a new recipe
async function handleAddRecipe(e) {
    e.preventDefault();
    
    // Get form data
    const recipeName = document.getElementById('recipe-name').value;
    const recipeIngredients = document.getElementById('recipe-ingredients').value;
    const recipeInstructions = document.getElementById('recipe-instructions').value;
    const recipeImage = document.getElementById('recipe-image').files[0];
    
    // In a real implementation, this would send the data to the server
    alert(`Recipe "${recipeName}" would be added in a real implementation. In a complete system, this would connect to the backend API to save the recipe.`);
    
    // Reset form
    document.getElementById('add-recipe-form').reset();
}