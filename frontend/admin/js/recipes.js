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
        filterRecipes(e.target.value);
    });
});

// Load recipes data
async function loadRecipes() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch('http://localhost:5000/api/recipes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }
        
        const recipes = await response.json();
        displayRecipes(recipes);
    } catch (error) {
        console.error('Error loading recipes:', error);
        document.getElementById('recipes-list').innerHTML = `
            <div class="col-span-full text-center text-red-500">
                <p>Error loading recipes. Please try again later.</p>
            </div>
        `;
    }
}

// Display recipes in the grid
function displayRecipes(recipes) {
    const recipesContainer = document.getElementById('recipes-list');
    
    if (recipes.length === 0) {
        recipesContainer.innerHTML = `
            <div class="col-span-full text-center text-gray-500">
                <p>No recipes found.</p>
            </div>
        `;
        return;
    }
    
    recipesContainer.innerHTML = recipes.map(recipe => `
        <div class="border rounded-lg p-4 shadow-sm">
            <img src="${recipe.recipe_image_url ? (recipe.recipe_image_url.startsWith('http') ? recipe.recipe_image_url : 'http://localhost:5000' + (recipe.recipe_image_url.startsWith('/') ? recipe.recipe_image_url : '/' + recipe.recipe_image_url)) : 'http://localhost:5000/uploads/icon.png'}" alt="${recipe.recipe_name}" class="w-full h-48 object-cover rounded-md mb-4" onerror="this.src='http://localhost:5000/uploads/icon.png'">
            <h3 class="text-lg font-semibold mb-2">${recipe.recipe_name}</h3>
            <p class="text-gray-600 mb-2">${recipe.ingredients || 'No ingredients listed'}</p>
            <div class="mt-4 flex justify-between">
                <button class="text-indigo-600 hover:text-indigo-900" onclick="viewRecipe(${recipe.recipe_id})">View</button>
                <button class="text-red-600 hover:text-red-900" onclick="deleteRecipe(${recipe.recipe_id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Filter recipes based on search term
function filterRecipes(searchTerm) {
    const cards = document.querySelectorAll('#recipes-list > div');
    
    cards.forEach(card => {
        if (card.querySelector('p[colspan]') || card.querySelector('div[colspan]')) return; // Skip placeholder cards
        
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm.toLowerCase())) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Handle adding a new recipe
async function handleAddRecipe(e) {
    e.preventDefault();
    
    // Get form data
    const recipeName = document.getElementById('recipe-name').value;
    const recipeIngredients = document.getElementById('recipe-ingredients').value;
    const recipeInstructions = document.getElementById('recipe-instructions').value;
    const recipeImage = document.getElementById('recipe-image').files[0];
    
    // Validate required fields
    if (!recipeName || !recipeIngredients || !recipeInstructions) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        
        formData.append('name', recipeName);
        formData.append('ingredients', recipeIngredients);
        formData.append('instructions', recipeInstructions);
        if (recipeImage) {
            formData.append('image', recipeImage);
        }
        
        const response = await fetch('http://localhost:5000/api/recipes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add recipe');
        }
        
        alert('Recipe added successfully!');
        
        // Reset form
        document.getElementById('add-recipe-form').reset();
        
        // Reload recipes
        loadRecipes();
    } catch (error) {
        console.error('Error adding recipe:', error);
        alert(error.message || 'Error adding recipe. Please try again later.');
    }
}

// View recipe
function viewRecipe(recipeId) {
    alert(`Viewing recipe #${recipeId}. In a complete implementation, this would show the full recipe details.`);
}

// Delete recipe
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/recipes/${recipeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete recipe');
        }
        
        alert('Recipe deleted successfully!');
        loadRecipes(); // Reload recipes
    } catch (error) {
        console.error('Error deleting recipe:', error);
        alert(error.message || 'Error deleting recipe. Please try again later.');
    }
}