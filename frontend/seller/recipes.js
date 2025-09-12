// recipes.js - Handles seller recipes page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and seller role
    if (!requireAuth()) return;
    if (!requireRole('seller')) return;

    // Load seller's recipes
    loadSellerRecipes();

    // Add event listeners
    document.getElementById('add-recipe-btn').addEventListener('click', showAddRecipeForm);
    document.getElementById('cancel-btn').addEventListener('click', hideAddRecipeForm);
    document.getElementById('recipe-form').addEventListener('submit', handleAddRecipe);
    
    // Mobile menu toggle
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburgerBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
});

// Check if user is logged in
function requireAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
        window.location.href = '../public/html/login.html';
        return false;
    }
    return true;
}

// Check if user is a seller
function requireRole(requiredRole) {
    const user = JSON.parse(localStorage.getItem('user'));

    if (user.user_role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        switch(user.user_role) {
            case 'admin':
                window.location.href = '../admin/html/admin-dashboard.html';
                break;
            case 'customer':
            default:
                window.location.href = '../public/html/recipes.html';
        }
        return false;
    }
    return true;
}

// Load seller's recipes
async function loadSellerRecipes() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        const response = await fetch('http://localhost:5000/api/recipes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const recipes = await response.json();
            // Filter recipes by current seller
            const sellerRecipes = recipes.filter(recipe => recipe.user_id === user.user_id);
            displayRecipes(sellerRecipes);
        } else {
            throw new Error('Failed to load recipes');
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        document.getElementById('recipes-list').innerHTML = '<p class="text-red-500 text-center col-span-full">Error loading recipes. Please try again later.</p>';
    }
}

// Display recipes
function displayRecipes(recipes) {
    const recipesContainer = document.getElementById('recipes-list');

    if (recipes.length === 0) {
        recipesContainer.innerHTML = '<p class="text-gray-500 text-center col-span-full">No recipes yet. Add your first recipe!</p>';
        return;
    }

    recipesContainer.innerHTML = recipes.map(recipe => {
        const imageUrl = recipe.recipe_image_url || "/uploads/icon.png";
        const fullImageUrl = imageUrl.startsWith("/uploads/") ? `http://localhost:5000${imageUrl}` : `http://localhost:5000/uploads/${imageUrl}`;

        return `
            <div class="bg-white p-4 rounded-lg shadow">
                <img src="${fullImageUrl}" alt="${recipe.recipe_name}" class="w-full h-32 object-cover rounded-md mb-3">
                <h3 class="font-semibold text-gray-800">${recipe.recipe_name}</h3>
                <p class="text-sm text-gray-600">${recipe.ingredients || 'No ingredients'}</p>
                <div class="mt-3 flex gap-2">
                    <button onclick="editRecipe(${recipe.recipe_id})" class="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    <button onclick="deleteRecipe(${recipe.recipe_id})" class="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Show add recipe form
function showAddRecipeForm() {
    document.getElementById('add-recipe-form').classList.remove('hidden');
    document.getElementById('add-recipe-btn').classList.add('hidden');
}

// Hide add recipe form
function hideAddRecipeForm() {
    document.getElementById('add-recipe-form').classList.add('hidden');
    document.getElementById('add-recipe-btn').classList.remove('hidden');
    document.getElementById('recipe-form').reset();
}

// Handle add recipe form submission
async function handleAddRecipe(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('recipe_name', document.getElementById('recipe-name').value);
    formData.append('ingredients', document.getElementById('ingredients').value);
    formData.append('instructions', document.getElementById('instructions').value);

    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/recipes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            alert('Recipe added successfully!');
            hideAddRecipeForm();
            loadSellerRecipes(); // Reload recipes to show the new one
        } else {
            const errorData = await response.json();
            alert(`Failed to add recipe: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error adding recipe:', error);
        alert('Error adding recipe. Please try again.');
    }
}

// Edit recipe function
function editRecipe(recipeId) {
    alert(`Editing recipe #${recipeId}. This would open an edit form.`);
}

// Delete recipe function
async function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Recipe deleted successfully!');
                loadSellerRecipes(); // Reload recipes
            } else {
                const errorData = await response.json();
                alert(`Failed to delete recipe: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            alert('Error deleting recipe. Please try again.');
        }
    }
}