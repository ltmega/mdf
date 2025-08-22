document.addEventListener("DOMContentLoaded", async () => {
  const productList = document.getElementById("product-list");
  productList.innerHTML = '<p class="text-gray-600 text-center">Loading products...</p>';

  try {
    const API_BASE = "http://localhost:5000";
    const res = await fetch(`${API_BASE}/api/products`);
    console.log("📨 Fetching products from:", `${API_BASE}/api/products`);

    if (!res.ok) throw new Error("Failed to load products");

    const products = await res.json();
    console.log("✅ Products received:", products);

    if (products.length === 0) {
      productList.innerHTML = "<p class='text-gray-600 text-center'>No products available.</p>";
      return;
    }

    productList.innerHTML = `
      <table class="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
        <thead class="bg-yellow-400 text-gray-800">
          <tr>
            <th class="px-4 py-2">Image</th>
            <th class="px-4 py-2">Name</th>
            <th class="px-4 py-2">Description</th>
            <th class="px-4 py-2">Price</th>
            <th class="px-4 py-2">Unit</th>
            <th class="px-4 py-2">Available</th>
          </tr>
        </thead>
        <tbody id="product-table-body" class="divide-y divide-gray-200"></tbody>
      </table>
    `;

    const tbody = document.getElementById("product-table-body");

products.forEach(product => {
  const filename = product.product_image_url
    .replace(/^\/?uploads\/products\/|^\/+/, '')
    .trim();

  const imageUrl = `${API_BASE}/uploads/products/${filename}`;
  console.log(`🖼️ Product: "${product.product_name}", Image URL: ${imageUrl}`);

  const row = document.createElement("tr");

  row.innerHTML = `
    <td class="px-4 py-2">
      <img src="${imageUrl}" 
           alt="${product.product_name}" 
           class="w-16 h-16 object-cover rounded-md"
           onerror="handleImageError(this)" />
    </td>
    <td class="px-4 py-2 font-semibold text-gray-800">${product.product_name}</td>
    <td class="px-4 py-2 text-gray-600">${product.description || "No description"}</td>
    <td class="px-4 py-2 text-orange-600 font-bold">₵${product.price_per_unit}</td>
    <td class="px-4 py-2">${product.unit}</td>
    <td class="px-4 py-2">${product.available_quantity}</td>
  `;
  tbody.appendChild(row);
});

  } catch (err) {
    console.error("❌ Error loading products:", err);
    productList.innerHTML = `<p class='text-red-600 text-center'>${err.message}</p>`;
  }
});

// ✅ Prevent fallback loop and show placeholder
function handleImageError(img) {
  if (!img.dataset.fallback) {
    console.warn("⚠️ Image failed to load:", img.src);
    img.src = "http://localhost:5000/uploads/products/default.jpg";
    img.dataset.fallback = "true";
  } else {
    console.error("❌ Fallback image also failed:", img.src);
    img.src = "data:image/svg+xml;base64," + btoa(`
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>
        <rect width='100%' height='100%' fill='#f3f3f3'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#999' font-size='12'>No Image</text>
      </svg>
    `);
  }
}