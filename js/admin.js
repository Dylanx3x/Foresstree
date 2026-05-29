const API = 'https://foresstree.onrender.com';
let allProducts = [], allOrders = [], currentPage = 'dashboard';
let serverOnline = false;

async function checkLogin() {
  const password = document.getElementById('adminPassword').value;
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({password})
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('adminToken', data.token);
      document.getElementById('loginScreen').style.display = 'none';
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  } catch {
    document.getElementById('loginError').style.display = 'block';
  }
}

if (!sessionStorage.getItem('adminToken')) {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginScreen').style.display = 'flex';
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginScreen').style.display = 'none';
  });
}

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
  const menuEl = document.getElementById('menu-' + page);
  if (menuEl) menuEl.classList.add('active');
  const titles = { dashboard:'📊 Dashboard', products:'📦 Products', orders:'🛍️ Orders', customers:'👥 Customers', coupons:'🎟️ Coupons' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  const topbarBtns = {
    products: { text: '➕ Add Product', action: 'showAddProductForm()' },
    orders: { text: '🔄 Refresh', action: 'loadOrders()' },
    dashboard: { text: '🔄 Refresh', action: 'loadDashboard()' },
    customers: { text: '🔄 Refresh', action: 'loadCustomers()' },
    coupons: { text: '➕ Add Coupon', action: 'showAddCouponModal()' },
  };
  const btn = topbarBtns[page] || {text:'', action:''};
  const topBtn = document.getElementById('topbarBtn');
  topBtn.textContent = btn.text;
  topBtn.onclick = new Function(btn.action);
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'products': loadProducts(); break;
    case 'orders': loadOrders(); break;
    case 'customers': loadCustomers(); break;
    case 'coupons': loadCoupons(); break;
  }
  document.getElementById('sidebar').classList.remove('open');
}

async function checkServer() {
  try {
    const res = await fetch(`${API}/`);
    if (res.ok) {
      serverOnline = true;
      document.getElementById('topbarStatus').innerHTML = '<span style="color:#27ae60">● Online</span>';
    }
  } catch {
    serverOnline = false;
    document.getElementById('topbarStatus').innerHTML = '<span style="color:#e74c3c">● Offline</span>';
  }
}

async function loadDashboard() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading dashboard...</p></div>';
  let products = [], orders = [];
  try {
    const [pr, or] = await Promise.all([
      fetch(`${API}/api/products`).then(r => r.json()),
      fetch(`${API}/api/orders`).then(r => r.json()),
    ]);
    products = Array.isArray(pr) ? pr : [];
    orders = Array.isArray(or) ? or : [];
    allProducts = products;
    allOrders = orders;
  } catch(e) {
    products = allProducts;
    orders = allOrders;
  }
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const todayOrders = orders.filter(o => { const d = new Date(o.createdAt); const today = new Date(); return d.toDateString() === today.toDateString(); }).length;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartValues = months.map((_, i) => orders.filter(o => new Date(o.createdAt).getMonth() === i).reduce((s,o) => s + (o.total||0), 0));
  const maxVal = Math.max(...chartValues, 1000);
  const statusCounts = {Processing:0,Confirmed:0,Shipping:0,Delivered:0,Cancelled:0};
  orders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });
  content.innerHTML = `
    <div class="server-status ${serverOnline ? 'server-online' : 'server-offline'}">
      <span class="dot ${serverOnline ? 'dot-green' : 'dot-red'}"></span>
      ${serverOnline ? '✅ Server online — সব data database এ save হচ্ছে' : '❌ Server offline'}
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#e8f5e9">💰</div><div><div class="stat-value">৳${Math.round(totalRevenue * 110).toLocaleString()}</div><div class="stat-label">Total Revenue</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e3f2fd">🛍️</div><div><div class="stat-value">${orders.length}</div><div class="stat-label">Total Orders</div><div class="stat-change positive">Today: ${todayOrders}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fff3e0">📦</div><div><div class="stat-value">${products.length}</div><div class="stat-label">Products</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fce4ec">⏳</div><div><div class="stat-value">${statusCounts.Processing}</div><div class="stat-label">Pending Orders</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">📈 Monthly Revenue (2026)</div></div>
      <div class="chart-bars">
        ${months.map((m, i) => `<div class="chart-bar" style="height:${Math.max((chartValues[i]/maxVal)*100, 4)}%;background:${chartValues[i] > 0 ? '#1a6b2f' : '#e0e8e0'}">
          <span class="chart-bar-value">৳${chartValues[i] > 0 ? Math.round(chartValues[i]*110/1000)+'k' : '0'}</span>
          <span class="chart-bar-label">${m}</span>
        </div>`).join('')}
      </div>
      <div style="margin-top:32px"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">📊 Order Status</div>
        ${Object.entries(statusCounts).map(([status, count]) => {
          const colors = {Processing:'#f39c12',Confirmed:'#27ae60',Shipping:'#1976d2',Delivered:'#1a6b2f',Cancelled:'#e74c3c'};
          const pct = orders.length ? Math.round((count/orders.length)*100) : 0;
          return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="width:80px;font-size:.82rem;font-weight:600">${status}</span>
            <div style="flex:1;height:20px;background:#f0f7f0;border-radius:10px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${colors[status]||'#999'};border-radius:10px;transition:.5s"></div>
            </div>
            <span style="font-weight:800;font-size:.85rem;min-width:28px">${count}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🕐 Recent Orders</div><button class="btn-sm btn-info-sm" onclick="showPage('orders')">View All</button></div>
        ${orders.slice(0,5).map(o => {
          const statusColor = {Processing:'#f39c12',Confirmed:'#27ae60',Shipping:'#1976d2',Delivered:'#1a6b2f',Cancelled:'#e74c3c'};
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #edf2ed;font-size:.85rem">
            <div>
              <div style="font-weight:700">${o.customer?.firstName} ${o.customer?.lastName||''}</div>
              <div style="font-size:.75rem;color:#5a6a5a">${o.customer?.phone||''} — ${new Date(o.createdAt).toLocaleDateString('en-BD')}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:800;color:#1a6b2f">৳${Math.round((o.total||0)*110).toLocaleString()}</div>
              <span style="font-size:.72rem;font-weight:700;color:${statusColor[o.status]||'#666'}">${o.status}</span>
            </div>
          </div>`;
        }).join('') || '<div class="empty"><div class="icon" style="font-size:2rem">📋</div><p>No orders yet</p></div>'}
      </div>
    </div>
  `;
}

async function loadProducts() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading products...</p></div>';
  try {
    const res = await fetch(`${API}/api/products`);
    allProducts = await res.json();
  } catch(e) {
    content.innerHTML = `<div class="card"><div class="empty"><div class="icon">❌</div><p>Server connect হচ্ছে না।</p></div></div>`;
    return;
  }
  renderProductsPage();
}

// ✅ Product form HTML — Add ও Edit দুটোর জন্যই ব্যবহার হবে
function getProductFormHTML(p = null) {
  const isEdit = !!p;
  return `
    <div class="card" id="addProductCard">
      <div class="card-header">
        <div class="card-title">${isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</div>
        <button class="btn-sm btn-info-sm" onclick="document.getElementById('addProductCard').style.display='none'">Hide Form</button>
      </div>
      <form id="productForm">
        ${isEdit ? `<input type="hidden" id="p-edit-id" value="${p._id}">` : ''}
        <div class="form-grid">
          <div class="form-group"><label>Product Name *</label><input type="text" id="p-name" placeholder="e.g. Wireless Earbuds" required value="${isEdit ? p.name : ''}"></div>
          <div class="form-group"><label>Category *</label>
            <select id="p-category" required>
              <option value="">Select Category</option>
              ${['electronics','fashion','home','sports','books','beauty','toys','food','auto','health'].map(c =>
                `<option value="${c}" ${isEdit && p.category===c ? 'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group"><label>Sale Price (৳) *</label><input type="number" id="p-price" placeholder="1500" required min="0" value="${isEdit ? p.price : ''}"></div>
          <div class="form-group"><label>Original Price (৳)</label><input type="number" id="p-original" placeholder="2000" min="0" value="${isEdit ? (p.originalPrice||'') : ''}"></div>
          <div class="form-group"><label>Stock Quantity *</label><input type="number" id="p-stock" placeholder="50" required min="0" value="${isEdit ? p.stock : ''}"></div>
          <div class="form-group"><label>Emoji Icon</label><input type="text" id="p-icon" placeholder="📦" maxlength="4" value="${isEdit ? (p.icon||'📦') : ''}"></div>
          <div class="form-group full"><label>Description</label><textarea id="p-desc" rows="2" placeholder="Product description...">${isEdit ? (p.description||'') : ''}</textarea></div>
          <div class="form-group full" style="display:flex;gap:20px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:.87rem;font-weight:600;cursor:pointer"><input type="checkbox" id="p-featured" ${isEdit && (p.isFeatured===true||p.isFeatured==='true') ? 'checked':''}> ⭐ Featured</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:.87rem;font-weight:600;cursor:pointer"><input type="checkbox" id="p-new" ${isEdit && (p.isNew===true||p.isNew==='true') ? 'checked':''}> 🆕 New Arrival</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:.87rem;font-weight:600;cursor:pointer"><input type="checkbox" id="p-freeship" ${isEdit && (p.freeShipping===true||p.freeShipping==='true') ? 'checked':''}> 🚚 Free Shipping</label>
          </div>

          <!-- ✅ Multiple Images Upload -->
          <div class="form-group full">
            <label>📸 Product Images — সর্বোচ্চ ৫টা ছবি (JPG, PNG, WEBP)</label>
            ${isEdit && (p.images?.length || p.image) ? `
              <div id="existingImages" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
                ${(p.images?.length ? p.images : [{url:p.image}]).map((img,i) =>
                  `<div style="position:relative">
                    <img src="${img.url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #e0e8e0">
                    <span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:.7rem;cursor:pointer" onclick="this.parentElement.remove()">✕</span>
                  </div>`
                ).join('')}
                <div style="font-size:.78rem;color:#5a6a5a;align-self:center">নতুন ছবি দিলে পুরনোগুলো replace হবে</div>
              </div>
            ` : ''}
            <div class="upload-area" id="uploadArea" onclick="document.getElementById('p-images').click()" style="cursor:pointer">
              <input type="file" id="p-images" accept="image/*" multiple style="display:none" onchange="previewImages(this)">
              <div style="font-size:2rem;margin-bottom:6px">📸</div>
              <p style="color:#5a6a5a;font-size:.88rem">Click করো বা ছবি drag করো (একসাথে একাধিক সিলেক্ট করতে পারো)</p>
              <p style="color:#1a6b2f;font-weight:700;font-size:.82rem">JPG, PNG, WEBP — Max 5MB প্রতিটা</p>
            </div>
            <div id="imagesPreview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div>
          </div>

          <!-- ✅ Video Upload -->
          <div class="form-group full">
            <label>🎬 Product Video (optional — MP4, Max 100MB)</label>
            ${isEdit && p.video ? `
              <div style="margin-bottom:10px">
                <video src="${p.video}" controls style="width:100%;max-height:200px;border-radius:10px;border:2px solid #e0e8e0"></video>
                <div style="font-size:.78rem;color:#5a6a5a;margin-top:4px">নতুন video দিলে পুরনোটা replace হবে</div>
              </div>
            ` : ''}
            <div class="upload-area" id="videoUploadArea" onclick="document.getElementById('p-video').click()" style="cursor:pointer">
              <input type="file" id="p-video" accept="video/mp4,video/webm" style="display:none" onchange="previewVideo(this)">
              <div style="font-size:2rem;margin-bottom:6px">🎬</div>
              <p style="color:#5a6a5a;font-size:.88rem">Click করো বা video drag করো</p>
              <p style="color:#1a6b2f;font-weight:700;font-size:.82rem">MP4, WEBM — Max 100MB</p>
            </div>
            <div id="videoPreviewBox" style="display:none;margin-top:8px">
              <video id="videoPreview" controls style="width:100%;max-height:220px;border-radius:10px;border:2px solid #e0e8e0"></video>
              <button type="button" onclick="clearVideo()" style="display:block;margin-top:6px;background:none;border:none;color:#e74c3c;font-size:.82rem;font-weight:700;cursor:pointer">✕ Remove Video</button>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;gap:10px">
          <button type="submit" class="btn btn-primary" id="addProductBtn">
            ${isEdit ? '💾 Save Changes' : '➕ Add Product'}
          </button>
          <button type="button" class="btn" style="background:#f0f4f0;color:#5a6a5a" onclick="${isEdit ? 'loadProducts()' : 'resetProductForm()'}">
            ${isEdit ? '❌ Cancel' : '🔄 Reset'}
          </button>
        </div>
      </form>
    </div>
  `;
}

function renderProductsPage() {
  const content = document.getElementById('pageContent');
  window._productMap = {};
  allProducts.forEach(p => { window._productMap[p._id] = p; });
  content.innerHTML = `
    ${getProductFormHTML()}
    <div class="card">
      <div class="card-header">
        <div class="card-title">📦 All Products (${allProducts.length})</div>
        <button class="btn-sm btn-success-sm" onclick="loadProducts()">🔄 Refresh</button>
      </div>
      <div class="search-row">
        <input type="text" id="prodSearch" placeholder="🔍 Search products..." oninput="filterProds()">
        <select id="prodCatFilter" onchange="filterProds()">
          <option value="">All Categories</option>
          ${['electronics','fashion','home','sports','books','beauty','toys','food','auto','health'].map(c =>
            `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Image</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="productsBody">${renderProductRows(allProducts)}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('productForm').addEventListener('submit', submitProduct);
}

function renderProductRows(products) {
  if (!products.length) return `<tr><td colspan="7"><div class="empty"><div class="icon">📦</div><p>No products found</p></div></td></tr>`;
  return products.map(p => {
    // প্রথম image দেখাও (images array থেকে অথবা পুরনো image field থেকে)
    const firstImg = p.images?.[0]?.url || p.image;
    return `
    <tr>
      <td>
        ${firstImg
          ? `<img src="${firstImg}" class="product-img" alt="${p.name}">`
          : `<div class="product-emoji">${p.icon||'📦'}</div>`}
        ${p.images?.length > 1 ? `<div style="font-size:.7rem;color:#5a6a5a;text-align:center">${p.images.length} ছবি</div>` : ''}
        ${p.video ? `<div style="font-size:.7rem;color:#1976d2;text-align:center">🎬 Video</div>` : ''}
      </td>
      <td>
        <div style="font-weight:700">${p.name}</div>
        <div style="font-size:.75rem;color:#5a6a5a">ID: ${p._id?.slice(-8)}</div>
        ${p.isFeatured==='true'||p.isFeatured===true ? '<span class="badge badge-green" style="margin-top:3px">⭐ Featured</span>' : ''}
        ${p.isNew==='true'||p.isNew===true ? '<span class="badge badge-yellow" style="margin-left:4px">🆕 New</span>' : ''}
      </td>
      <td><span class="badge badge-green" style="text-transform:capitalize">${p.category}</span></td>
      <td>
        <div style="font-weight:700;color:#1a6b2f">৳${Number(p.price).toLocaleString()}</div>
        ${p.originalPrice > p.price ? `<div style="font-size:.75rem;color:#999;text-decoration:line-through">৳${Number(p.originalPrice).toLocaleString()}</div>` : ''}
      </td>
      <td><span style="font-weight:700;color:${p.stock==0?'#e74c3c':p.stock<=5?'#f39c12':'#27ae60'}">${p.stock}</span></td>
      <td><span class="badge ${p.stock==0?'badge-red':p.stock<=5?'badge-yellow':'badge-green'}">${p.stock==0?'❌ Out':p.stock<=5?'⚠️ Low':'✅ In Stock'}</span></td>
      <td>
        <button class="btn-sm btn-info-sm" onclick="viewProduct(window._productMap['${p._id}'])" style="margin-right:4px">👁️</button>
        <button class="btn-sm btn-warning-sm" onclick="editProduct('${p._id}')" style="margin-right:4px">✏️ Edit</button>
        <button class="btn-sm btn-danger-sm" onclick="deleteProduct('${p._id}','${p.name.replace(/'/g,"\\'")}')">🗑️</button>
      </td>
    </tr>
  `}).join('');
}

// ✅ Edit বাটন click করলে form fill হয়ে যাবে
function editProduct(id) {
  const p = window._productMap[id];
  if (!p) return;

  const content = document.getElementById('pageContent');
  // Page এর শুরুতে edit form বসাও
  const editCard = document.createElement('div');
  editCard.id = 'editFormWrapper';
  editCard.innerHTML = getProductFormHTML(p);
  content.insertBefore(editCard, content.firstChild);
  content.scrollTop = 0;
  window.scrollTo(0, 0);

  document.getElementById('productForm').addEventListener('submit', submitProduct);
}

function filterProds() {
  const q = document.getElementById('prodSearch').value.toLowerCase();
  const cat = document.getElementById('prodCatFilter').value;
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q) && (!cat || p.category === cat));
  document.getElementById('productsBody').innerHTML = renderProductRows(filtered);
}

// ✅ Multiple images preview
function previewImages(input) {
  const preview = document.getElementById('imagesPreview');
  preview.innerHTML = '';
  const files = Array.from(input.files).slice(0, 5);
  files.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML += `
        <div style="position:relative">
          <img src="${e.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #1a6b2f">
          ${i === 0 ? '<span style="position:absolute;bottom:2px;left:2px;background:#1a6b2f;color:#fff;font-size:.6rem;padding:1px 4px;border-radius:4px">Main</span>' : ''}
        </div>`;
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('uploadArea').style.borderColor = '#1a6b2f';
}

// ✅ Video preview
function previewVideo(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 100 * 1024 * 1024) {
      showToast('Video 100MB এর বেশি হতে পারবে না!', 'error');
      input.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    document.getElementById('videoPreview').src = url;
    document.getElementById('videoPreviewBox').style.display = 'block';
    document.getElementById('videoUploadArea').style.borderColor = '#1976d2';
  }
}

function clearVideo() {
  document.getElementById('p-video').value = '';
  document.getElementById('videoPreviewBox').style.display = 'none';
  document.getElementById('videoUploadArea').style.borderColor = '#b0d0b0';
}

// ✅ Product submit — Add ও Edit দুটো handle করে
async function submitProduct(e) {
  e.preventDefault();
  const editId = document.getElementById('p-edit-id')?.value;
  const isEdit = !!editId;

  const btn = document.getElementById('addProductBtn');
  btn.innerHTML = isEdit ? '⏳ Saving...' : '⏳ Adding...';
  btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('name', document.getElementById('p-name').value);
    formData.append('category', document.getElementById('p-category').value);
    formData.append('price', document.getElementById('p-price').value);
    formData.append('originalPrice', document.getElementById('p-original').value || document.getElementById('p-price').value);
    formData.append('stock', document.getElementById('p-stock').value);
    formData.append('icon', document.getElementById('p-icon').value || '📦');
    formData.append('description', document.getElementById('p-desc').value);
    formData.append('isFeatured', document.getElementById('p-featured').checked);
    formData.append('isNew', document.getElementById('p-new').checked);
    formData.append('freeShipping', document.getElementById('p-freeship').checked);

    // ✅ Multiple images
    const imgs = document.getElementById('p-images').files;
    for (const img of imgs) {
      formData.append('images', img);
    }

    // ✅ Video
    const vid = document.getElementById('p-video').files[0];
    if (vid) formData.append('video', vid);

    const url = isEdit ? `${API}/api/products/${editId}` : `${API}/api/products`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();

    if (data.success) {
      showToast(isEdit ? 'Product updated! ✅' : 'Product added! ✅');
      loadProducts();
    } else {
      showToast('Error: ' + data.error, 'error');
      btn.innerHTML = isEdit ? '💾 Save Changes' : '➕ Add Product';
      btn.disabled = false;
    }
  } catch(err) {
    showToast('Server error!', 'error');
    btn.innerHTML = isEdit ? '💾 Save Changes' : '➕ Add Product';
    btn.disabled = false;
  }
}

function resetProductForm() {
  document.getElementById('productForm').reset();
  document.getElementById('imagesPreview').innerHTML = '';
  document.getElementById('videoPreviewBox').style.display = 'none';
  document.getElementById('uploadArea').style.borderColor = '#b0d0b0';
}

function showAddProductForm() {
  const card = document.getElementById('addProductCard');
  if (card) {
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`"${name}" delete করবে?`)) return;
  try {
    const res = await fetch(`${API}/api/products/${id}`, {method:'DELETE'});
    const data = await res.json();
    if (data.success) { showToast(`"${name}" deleted!`, 'warning'); loadProducts(); }
    else { showToast('Delete failed', 'error'); }
  } catch { showToast('Server error!', 'error'); }
}

function viewProduct(p) {
  if (!p) return;
  const discount = p.originalPrice > p.price ? Math.round((1 - p.price/p.originalPrice)*100) : 0;
  const allImgs = p.images?.length ? p.images : (p.image ? [{url:p.image}] : []);
  document.getElementById('modalContent').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>

    <!-- Images gallery -->
    ${allImgs.length ? `
      <div style="display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;padding-bottom:6px">
        ${allImgs.map((img,i) =>
          `<img src="${img.url}" style="width:${allImgs.length===1?'100%':'120px'};height:${allImgs.length===1?'220px':'90px'};object-fit:cover;border-radius:10px;border:2px solid #e0e8e0;flex-shrink:0">`
        ).join('')}
      </div>
    ` : `<div style="height:180px;background:#f0f7f0;display:flex;align-items:center;justify-content:center;font-size:7rem;border-radius:12px;margin-bottom:14px">${p.icon||'📦'}</div>`}

    <!-- Video -->
    ${p.video ? `
      <div style="margin-bottom:14px">
        <video src="${p.video}" controls style="width:100%;max-height:200px;border-radius:10px;border:2px solid #e0e8e0"></video>
      </div>
    ` : ''}

    <div style="font-size:.72rem;color:#1a6b2f;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${p.category}</div>
    <h2 style="font-size:1.25rem;font-weight:800;margin:6px 0">${p.name}</h2>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <span style="font-size:1.7rem;font-weight:800;color:#1a6b2f">৳${Number(p.price).toLocaleString()}</span>
      ${p.originalPrice > p.price ? `<span style="color:#999;text-decoration:line-through">৳${Number(p.originalPrice).toLocaleString()}</span><span style="background:#e74c3c;color:#fff;padding:2px 8px;border-radius:5px;font-size:.75rem;font-weight:700">-${discount}%</span>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div style="background:#f8faf8;border-radius:9px;padding:10px 14px;border:1px solid #e0e8e0"><div style="font-size:.72rem;font-weight:700;color:#5a6a5a;margin-bottom:3px">STOCK</div><div style="font-weight:700;color:${p.stock==0?'#e74c3c':p.stock<=5?'#f39c12':'#27ae60'}">${p.stock} units</div></div>
      <div style="background:#f8faf8;border-radius:9px;padding:10px 14px;border:1px solid #e0e8e0"><div style="font-size:.72rem;font-weight:700;color:#5a6a5a;margin-bottom:3px">SOLD</div><div style="font-weight:700">${p.sold||0} units</div></div>
    </div>
    ${p.description ? `<p style="font-size:.88rem;color:#5a6a5a;line-height:1.7;background:#f8faf8;padding:12px;border-radius:9px;margin-bottom:14px">${p.description}</p>` : ''}
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1" onclick="closeModal();editProduct('${p._id}')">✏️ Edit</button>
      <button class="btn" style="background:#fde8e8;color:#e74c3c;font-weight:700" onclick="if(confirm('Delete?')){deleteProduct('${p._id}','${p.name.replace(/'/g,"\\'")}');closeModal()}">🗑️</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('show');
}

async function loadOrders() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading orders...</p></div>';
  try {
    const res = await fetch(`${API}/api/orders`);
    allOrders = await res.json();
  } catch(e) {
    content.innerHTML = `<div class="card"><div class="empty"><div class="icon">❌</div><p>Server offline।</p></div></div>`;
    return;
  }
  renderOrdersPage();
}

function renderOrdersPage() {
  const content = document.getElementById('pageContent');
  window._orderMap = {};
  allOrders.forEach(o => { window._orderMap[o._id] = o; });
  content.innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(6,1fr)">
      ${['Processing','Confirmed','Shipping','Delivered','Cancelled','Returned'].map(s => {
        const count = allOrders.filter(o => o.status === s).length;
        return `<div class="stat-card" style="padding:14px"><div><div class="stat-value" style="font-size:1.4rem">${count}</div><div class="stat-label">${s}</div></div></div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">🛍️ All Orders (${allOrders.length})</div>
        <button class="btn-sm btn-success-sm" onclick="loadOrders()">🔄 Refresh</button>
      </div>
      <div class="search-row">
        <input type="text" id="orderSearch" placeholder="🔍 Search by name, phone, order ID..." oninput="filterOrders()">
        <select id="orderStatusFilter" onchange="filterOrders()">
          <option value="">All Status</option>
          <option value="Processing">Processing</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Shipping">Shipping</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select id="orderPaymentFilter" onchange="filterOrders()">
          <option value="">All Payments</option>
          <option value="bKash">bKash</option>
          <option value="Nagad">Nagad</option>
          <option value="Cash on Delivery">Cash on Delivery</option>
          <option value="Credit/Debit Card">Card</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="ordersBody">${renderOrderRows(allOrders)}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderOrderRows(orders) {
  if (!orders.length) return `<tr><td colspan="8"><div class="empty"><div class="icon">🛍️</div><p>No orders yet</p></div></td></tr>`;
  return orders.map(o => {
    const statusColors = {Processing:'badge-yellow',Confirmed:'badge-green',Shipping:'badge-blue',Delivered:'badge-green',Cancelled:'badge-red',Returned:'badge-purple'};
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-BD') : 'N/A';
    const itemCount = o.items?.length || 0;
    return `<tr>
      <td style="font-family:monospace;font-size:.8rem;color:#1a6b2f;font-weight:700">${o._id?.slice(-8)||'—'}</td>
      <td>
        <div style="font-weight:700">${o.customer?.firstName||'—'} ${o.customer?.lastName||''}</div>
        <div style="font-size:.78rem;color:#5a6a5a">${o.customer?.phone||''}</div>
        <div style="font-size:.76rem;color:#5a6a5a">${o.address?.district||''}, ${o.address?.division||''}</div>
      </td>
      <td>
        <div style="font-size:.82rem">${o.items?.slice(0,2).map(i=>`${i.icon||'📦'} ${i.name}`).join('<br>')||'—'}</div>
        ${itemCount > 2 ? `<div style="font-size:.75rem;color:#5a6a5a">+${itemCount-2} more</div>` : ''}
      </td>
      <td style="font-weight:800;color:#1a6b2f">৳${Math.round((o.total||0)*110).toLocaleString()}</td>
      <td><span style="font-size:.82rem">${o.paymentMethod||'—'}</span></td>
      <td style="font-size:.82rem;white-space:nowrap">${date}</td>
      <td>
        <select class="badge ${statusColors[o.status]||'badge-gray'}" style="border:none;font-weight:700;cursor:pointer;font-size:.74rem;padding:3px 8px;border-radius:20px"
          onchange="updateOrderStatus('${o._id}', this.value, this)">
          ${['Processing','Confirmed','Shipping','Delivered','Cancelled','Returned'].map(s => `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn-sm btn-info-sm" onclick="viewOrder(window._orderMap['${o._id}'])">👁️ View</button></td>
    </tr>`;
  }).join('');
}

function filterOrders() {
  const q = document.getElementById('orderSearch').value.toLowerCase();
  const status = document.getElementById('orderStatusFilter').value;
  const payment = document.getElementById('orderPaymentFilter').value;
  const filtered = allOrders.filter(o => {
    const matchQ = !q || (o.customer?.firstName||'').toLowerCase().includes(q) || (o.customer?.phone||'').includes(q) || (o._id||'').toLowerCase().includes(q);
    const matchStatus = !status || o.status === status;
    const matchPayment = !payment || (o.paymentMethod||'').includes(payment);
    return matchQ && matchStatus && matchPayment;
  });
  document.getElementById('ordersBody').innerHTML = renderOrderRows(filtered);
}

async function updateOrderStatus(id, status, selectEl) {
  try {
    const res = await fetch(`${API}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({status}),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Status → ${status} ✅`);
      const order = allOrders.find(o => o._id === id);
      if (order) order.status = status;
      const statusColors = {Processing:'badge-yellow',Confirmed:'badge-green',Shipping:'badge-blue',Delivered:'badge-green',Cancelled:'badge-red',Returned:'badge-purple'};
      selectEl.className = `badge ${statusColors[status]||'badge-gray'}`;
      selectEl.style.cssText = 'border:none;font-weight:700;cursor:pointer;font-size:.74rem;padding:3px 8px;border-radius:20px';
    } else { showToast('Update failed', 'error'); }
  } catch { showToast('Server error!', 'error'); }
}

function viewOrder(o) {
  if (!o) return;
  const date = o.createdAt ? new Date(o.createdAt).toLocaleString('en-BD') : 'N/A';
  document.getElementById('modalContent').innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2 style="margin-bottom:4px">📦 Order Details</h2>
    <div style="font-family:monospace;font-size:.8rem;color:#5a6a5a;margin-bottom:16px">ID: ${o._id}</div>
    <div class="order-detail-grid">
      <div class="order-detail-box">
        <div class="order-detail-label">👤 Customer</div>
        <div style="font-weight:700;font-size:1rem">${o.customer?.firstName||''} ${o.customer?.lastName||''}</div>
        <div style="color:#5a6a5a;margin-top:4px">📞 ${o.customer?.phone||'—'}</div>
        ${o.customer?.altPhone ? `<div style="color:#5a6a5a">📞 ${o.customer.altPhone}</div>` : ''}
      </div>
      <div class="order-detail-box">
        <div class="order-detail-label">📍 Delivery Address</div>
        <div style="font-size:.9rem;line-height:1.6">
          ${o.address?.street||'—'}<br>
          ${o.address?.thana||''}, ${o.address?.district||''}<br>
          ${o.address?.division||''}
          ${o.address?.note ? `<br><em style="color:#5a6a5a">Note: ${o.address.note}</em>` : ''}
        </div>
      </div>
    </div>
    <div style="margin-bottom:14px">
      <div class="order-detail-label" style="margin-bottom:8px">🛍️ Ordered Items</div>
      ${o.items?.map(item => `<div class="order-item-row">
        <span style="font-size:1.4rem">${item.image ? `<img src="${item.image}" style="width:36px;height:36px;object-fit:cover;border-radius:6px">` : item.icon||'📦'}</span>
        <div style="flex:1"><div style="font-weight:700">${item.name}</div><div style="font-size:.78rem;color:#5a6a5a">${item.category||''}</div></div>
        <div style="text-align:right">
          <div style="font-size:.82rem;color:#5a6a5a">৳${Math.round(item.price*110).toLocaleString()} × ${item.quantity}</div>
          <div style="font-weight:700;color:#1a6b2f">৳${Math.round(item.price*item.quantity*110).toLocaleString()}</div>
        </div>
      </div>`).join('') || '<p style="color:#5a6a5a">No items</p>'}
    </div>
    <div style="background:#f8faf8;border-radius:10px;padding:14px;margin-bottom:14px">
      <div class="order-summary-row"><span>Subtotal</span><span>৳${Math.round((o.subtotal||0)*110).toLocaleString()}</span></div>
      <div class="order-summary-row"><span>Shipping</span><span>${o.shipping===0?'<span style="color:#27ae60">FREE</span>':'৳'+Math.round((o.shipping||0)*110).toLocaleString()}</span></div>
      <div class="order-summary-row"><span>VAT (5%)</span><span>৳${Math.round((o.tax||0)*110).toLocaleString()}</span></div>
      <div class="order-summary-row total"><span>Total</span><span>৳${Math.round((o.total||0)*110).toLocaleString()}</span></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div class="order-detail-box">
        <div class="order-detail-label">💳 Payment</div>
        <div style="font-weight:700">${o.paymentMethod||'—'}</div>
        <div style="margin-top:4px"><span style="background:${o.paymentStatus==='Paid'?'#e8f5e9':'#fff8e1'};color:${o.paymentStatus==='Paid'?'#27ae60':'#f39c12'};padding:2px 8px;border-radius:5px;font-size:.75rem;font-weight:700">${o.paymentStatus||'Pending'}</span></div>
      </div>
      <div class="order-detail-box">
        <div class="order-detail-label">📅 Date & Status</div>
        <div style="font-size:.85rem">${date}</div>
        <div style="margin-top:6px">
          <select id="modalStatusSelect" style="border:1.5px solid #dce8dc;border-radius:8px;padding:5px 10px;font-size:.85rem;font-weight:700;background:#f8faf8">
            ${['Processing','Confirmed','Shipping','Delivered','Cancelled','Returned'].map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" style="flex:1" onclick="updateOrderStatus('${o._id}',document.getElementById('modalStatusSelect').value,{className:'',style:{cssText:''}});showToast('Status updated!');closeModal();loadOrders()">✅ Update Status</button>
      <button class="btn" style="background:#f0f4f0;color:#5a6a5a;font-weight:700" onclick="closeModal()">Close</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('show');
}

async function loadCustomers() {
  const content = document.getElementById('pageContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
  let orders = allOrders;
  try {
    if (!orders.length) {
      const res = await fetch(`${API}/api/orders`);
      orders = await res.json();
      allOrders = orders;
    }
  } catch {}
  const customerMap = {};
  orders.forEach(o => {
    const phone = o.customer?.phone || 'unknown';
    if (!customerMap[phone]) {
      customerMap[phone] = { name: `${o.customer?.firstName||''} ${o.customer?.lastName||''}`.trim(), phone, orders: 0, totalSpent: 0, lastOrder: o.createdAt, address: `${o.address?.district||''}, ${o.address?.division||''}` };
    }
    customerMap[phone].orders++;
    customerMap[phone].totalSpent += o.total || 0;
    if (new Date(o.createdAt) > new Date(customerMap[phone].lastOrder)) customerMap[phone].lastOrder = o.createdAt;
  });
  const customers = Object.values(customerMap).sort((a,b) => b.totalSpent - a.totalSpent);
  content.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#e3f2fd">👥</div><div><div class="stat-value">${customers.length}</div><div class="stat-label">Total Customers</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#e8f5e9">💰</div><div><div class="stat-value">৳${Math.round(customers.reduce((s,c)=>s+c.totalSpent,0)*110/1000)}k</div><div class="stat-label">Total Revenue</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fff3e0">🛍️</div><div><div class="stat-value">${orders.length}</div><div class="stat-label">Total Orders</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fce4ec">📊</div><div><div class="stat-value">৳${customers.length ? Math.round(customers.reduce((s,c)=>s+c.totalSpent,0)*110/customers.length).toLocaleString() : 0}</div><div class="stat-label">Avg. Spend</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">👥 All Customers (${customers.length})</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Phone</th><th>Address</th><th>Orders</th><th>Total Spent</th><th>Last Order</th></tr></thead>
          <tbody>
            ${customers.length ? customers.map((c,i) => `<tr>
              <td><div style="display:flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#1a6b2f,#2d9e4f);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.95rem;flex-shrink:0">${c.name[0]||'?'}</div>
                <div><div style="font-weight:700">${c.name||'Unknown'}</div><span class="badge badge-green" style="font-size:.7rem">#${i+1}</span></div>
              </div></td>
              <td style="font-weight:600">${c.phone}</td>
              <td style="font-size:.85rem;color:#5a6a5a">${c.address}</td>
              <td><span style="font-weight:800;font-size:1rem">${c.orders}</span></td>
              <td style="font-weight:800;color:#1a6b2f">৳${Math.round(c.totalSpent*110).toLocaleString()}</td>
              <td style="font-size:.82rem;color:#5a6a5a">${c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-BD') : 'N/A'}</td>
            </tr>`).join('') : '<tr><td colspan="6"><div class="empty"><div class="icon">👥</div><p>No customers yet</p></div></td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

const coupons = [
  {code:'SAVE10',discount:'10%',type:'Percentage',status:'Active'},
  {code:'FLAT500',discount:'৳500',type:'Fixed Amount',status:'Active'},
  {code:'WELCOME',discount:'15%',type:'Percentage',status:'Active'},
];

function loadCoupons() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">🎟️ Active Coupons</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Code</th><th>Discount</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${coupons.map(c => `<tr>
              <td style="font-family:monospace;font-size:1rem;font-weight:800;letter-spacing:.5px;color:#1a6b2f">${c.code}</td>
              <td style="font-size:1rem;font-weight:800;color:#e74c3c">${c.discount}</td>
              <td>${c.type}</td>
              <td><span class="badge badge-green">${c.status}</span></td>
              <td>
                <button class="btn-sm btn-info-sm" style="margin-right:4px">✏️ Edit</button>
                <button class="btn-sm btn-danger-sm" onclick="showToast('Coupon deleted','warning')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">➕ Add New Coupon</div>
      <div class="form-grid">
        <div class="form-group"><label>Coupon Code</label><input type="text" placeholder="e.g. SAVE20" style="text-transform:uppercase"></div>
        <div class="form-group"><label>Discount Type</label><select><option>Percentage (%)</option><option>Fixed Amount (৳)</option></select></div>
        <div class="form-group"><label>Discount Value</label><input type="number" placeholder="e.g. 10 or 500"></div>
        <div class="form-group"><label>Expiry Date</label><input type="date"></div>
      </div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="showToast('Coupon added! ✅')">➕ Add Coupon</button>
    </div>
  `;
}

function showAddCouponModal() { showPage('coupons'); }
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

function showToast(msg, type = 'success') {
  const container = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = (type==='success'?'✅':type==='error'?'❌':'⚠️') + ' ' + msg;
  container.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideIn .3s reverse forwards'; setTimeout(()=>t.remove(), 300); }, 3500);
}

window.onload = async () => {
  await checkServer();
  loadDashboard();
};