// recipes.js - Handles seller recipes page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and seller role
    if (!requireAuth()) return;
    if (!requireRole('seller')) return;
    
    // Load seller's recipes
    loadSellerRecipes();
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

// Edit recipe function
function editRecipe(recipeId) {
    alert(`Editing recipe #${recipeId}. This would open an edit form.`);
}

// Delete recipe function
function deleteRecipe(recipeId) {
    if (confirm('Are you sure you want to delete this recipe?')) {
        // Implement delete functionality
        alert('Delete functionality would be implemented here');
    }
}