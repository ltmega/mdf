document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");

  // Show loading
  productList.innerHTML = '<p class="text-gray-600 text-center">Loading products...</p>';

  try {
    const API_BASE = "http://localhost:5000";
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      alert("You must be logged in to view products.");
      window.location.href = "login.html";
      return;
    }

    console.log("Fetching products from the backend...");

    const res = await fetch(`${API_BASE}/api/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to load products.");
    }

    const products = await res.json();
    console.log("Products fetched successfully:", products);

    if (!products || products.length === 0) {
      productList.innerHTML = "<p class='text-gray-600 text-center'>No products available.</p>";
      return;
    }

    // Save products in memory for cart use
    window.productsCache = products;

    // Render products safely
    productList.innerHTML = "";
    products.forEach((product) => {
      const div = document.createElement("div");
      div.className = "bg-white p-4 rounded-lg shadow";

      div.innerHTML = `
        <img src="${API_BASE}${product.product_image_url}" 
             alt="${product.product_name}" 
             class="w-full h-48 object-cover rounded-md mb-4"
             onerror="this.src='${API_BASE}/uploads/products/default.jpg'" />
        <h2 class="text-lg font-bold text-gray-800">${product.product_name}</h2>
        <p class="text-sm text-gray-600">${product.description || "No description available."}</p>
        <p class="text-orange-600 font-bold mt-2">UGX ${product.price_per_unit}</p>
        <p class="text-sm text-gray-600">Unit: ${product.unit}</p>
        <p class="text-sm text-gray-600">Available: ${product.available_quantity}</p>
        <button 
          class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-md mt-4"
          data-id="${product.product_id}">
          Add to Cart
        </button>
      `;

      // Attach event handler to button
      const button = div.querySelector("button");
      button.addEventListener("click", () => addToCartById(product.product_id));

      productList.appendChild(div);
    });

    // Initialize cart count
    updateCartCount();
  } catch (err) {
    console.error("Error loading products:", err);
    productList.innerHTML = `<p class='text-red-600 text-center'>${err.message}</p>`;
  }
});

// ✅ Add product by ID safely
function addToCartById(productId) {
  const product = window.productsCache.find((p) => p.product_id == productId);
  if (product) {
    addToCart(product);
  } else {
    alert("Product not found.");
  }
}

// ✅ Add product to cart
function addToCart(product) {
  try {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Check if product exists
    const existing = cart.find((item) => item.product_id === product.product_id);
    if (existing) {
      alert(`${product.product_name} is already in your cart.`);
      return;
    }

    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.product_name} added to cart!`);
    updateCartCount();
  } catch (err) {
    console.error("Error adding to cart:", err);
  }
}

// ✅ Update cart count
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = cart.length;
}
