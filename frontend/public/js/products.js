// js/products.js

document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");

  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    if (products.length === 0) {
      productList.innerHTML = "<p class='text-gray-600'>No products available at the moment.</p>";
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-t-xl">
        <div class="p-4">
          <h2 class="card-title">${product.name}</h2>
          <p class="card-body">UGX ${product.price.toLocaleString()}</p>
        </div>
      `;
      productList.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading products:", err);
    productList.innerHTML = "<p class='text-red-600'>Failed to load products. Please try again later.</p>";
  }
});
