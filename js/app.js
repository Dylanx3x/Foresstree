

const App = {
  state: {
    page: 'home', theme: 'light', user: null, isAdmin: false,
    cart: [], wishlist: [], compare: [], recentlyViewed: [], searchQuery: '',
    selectedCategory: 'all', sortBy: 'featured', priceRange: [0, 50000],
    currentSlide: 0, productDetail: null, profileTab: 'orders', qty: 1,
    adminSidebarOpen: false, currentPage: 1, perPage: 8, currency: 'BDT',
    couponApplied: null, lastOrder: null, myOrders: [],
  },
  exchangeRate: 110,

  formatPrice(usd) {
    if (this.state.currency === 'BDT') return '৳' + Math.round(usd).toLocaleString('en-BD');
    return '$' + (usd / this.exchangeRate).toFixed(2);
  },

  categories: [
    {id:'electronics',name:'Electronics',icon:'📱'},
    {id:'fashion',name:'Fashion',icon:'👔'},
    {id:'home',name:'Home & Garden',icon:'🏡'},
    {id:'sports',name:'Sports',icon:'⚽'},
    {id:'books',name:'Books',icon:'📚'},
    {id:'beauty',name:'Beauty',icon:'💄'},
    {id:'toys',name:'Toys',icon:'🧸'},
    {id:'food',name:'Groceries',icon:'🥑'},
    {id:'auto',name:'Automotive',icon:'🚗'},
    {id:'health',name:'Health',icon:'💊'},
  ],

  products: [], reviews: [],
  coupons: [
    {code:'SAVE10',discount:10,type:'percent',active:true},
    {code:'FLAT500',discount:500,type:'fixed',active:true},
    {code:'WELCOME',discount:15,type:'percent',active:true},
  ],

  // ✅ FIX 1: 5 সেকেন্ড timeout + loading status text + server ping
  async init() {
    const ls = document.getElementById('loadingScreen');
    const lsText = ls ? ls.querySelector('p') : null;

    if (lsText) lsText.textContent = 'Connecting to server...';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(`${API}/products`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (lsText) lsText.textContent = 'Loading products...';
      const dbProducts = await res.json();

      if (Array.isArray(dbProducts) && dbProducts.length > 0) {
        this.products = dbProducts.map((p, i) => ({
          id: p._id, name: p.name, category: p.category,
          icon: p.icon || '📦', image: p.image || '',
          price: Number(p.price),
          originalPrice: Number(p.originalPrice) || Number(p.price),
          rating: p.rating || 4.0, reviews: p.reviews || 0,
          stock: Number(p.stock) || 0, sold: p.sold || 0,
          description: p.description || '',
          isFlash: i < 6, isTrending: i % 3 === 0,
          isFeatured: p.isFeatured === 'true' || p.isFeatured === true,
          isNew: p.isNew === 'true' || p.isNew === true,
          freeShipping: p.freeShipping === 'true' || p.freeShipping === true || Number(p.price) > 5000,
        }));
      } else {
        if (lsText) lsText.textContent = 'Loading local data...';
        this.generateProducts();
      }
    } catch (e) {
      // ✅ FIX 2: timeout বা error হলে সাথে সাথে local data দেখাও
      if (lsText) lsText.textContent = 'Loading local data...';
      this.generateProducts();
    }

    this.generateReviews();

    const savedTheme = localStorage.getItem('foresstree-theme');
    if (savedTheme) {
      this.state.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const savedCart = localStorage.getItem('foresstree-cart');
    if (savedCart) { try { this.state.cart = JSON.parse(savedCart); } catch(e){} }

    const savedWish = localStorage.getItem('foresstree-wishlist');
    if (savedWish) { try { this.state.wishlist = JSON.parse(savedWish); } catch(e){} }

    if (ls) { ls.style.opacity = '0'; ls.style.transition = '.5s'; setTimeout(() => ls.style.display = 'none', 500); }

    this.render();
    this.startSlider();
    this.startFlashTimer();
    this.setupBackToTop();
    this.startServerPing(); // ✅ FIX 3: server জাগিয়ে রাখো
  },

  // ✅ FIX 3: প্রতি 10 মিনিটে server ping করো যাতে ঘুমাতে না পারে
  startServerPing() {
    setInterval(() => {
      fetch(`${API}/products`, { method: 'HEAD' }).catch(() => {});
    }, 10 * 60 * 1000);
  },

  setupBackToTop() {
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('backToTop');
      if (btn) btn.classList.toggle('show', window.scrollY > 400);
    });
  },

  generateProducts() {
    const names = [
      ['Wireless Earbuds Pro','electronics','🎧',72.72,90.90],
      ['Smart Watch Ultra','electronics','⌚',181.81,227.27],
      ['Bluetooth Speaker','electronics','🔊',45.45,63.63],
      ['Laptop Stand','electronics','💻',31.81,40.90],
      ['USB-C Hub','electronics','🔌',27.27,36.36],
      ['Mechanical Keyboard','electronics','⌨️',81.81,109.09],
      ['Cotton T-Shirt','fashion','👕',22.72,31.81],
      ['Denim Jacket','fashion','🧥',72.72,90.90],
      ['Running Shoes','fashion','👟',109.09,136.36],
      ['Sunglasses','fashion','🕶️',36.36,54.54],
      ['Leather Belt','fashion','👔',18.18,27.27],
      ['Wool Scarf','fashion','🧣',27.27,36.36],
      ['Indoor Plant Set','home','🪴',40.90,54.54],
      ['Scented Candle','home','🕯️',17.27,22.72],
      ['Throw Pillow Set','home','🛋️',31.81,40.90],
      ['Kitchen Knife Set','home','🔪',54.54,72.72],
      ['Yoga Mat Pro','sports','🧘',36.36,50.00],
      ['Resistance Bands','sports','💪',18.18,27.27],
      ['Water Bottle','sports','🥤',13.63,18.18],
      ['Camping Tent','sports','⛺',136.36,181.81],
      ['Bestseller Novel','books','📖',13.63,18.18],
      ['Cookbook Collection','books','📚',27.27,36.36],
      ['Skincare Set','beauty','✨',50.00,68.18],
      ['Perfume Classic','beauty','🌸',63.63,81.81],
      ['Building Blocks','toys','🧱',31.81,40.90],
      ['Remote Control Car','toys','🏎️',40.90,54.54],
      ['Organic Honey','food','🍯',11.81,15.45],
      ['Green Tea Pack','food','🍵',9.09,13.63],
      ['Car Phone Mount','auto','📲',14.54,20.90],
      ['LED Desk Lamp','home','💡',36.36,50.00],
      ['Fitness Tracker','health','📈',54.54,72.72],
      ['Vitamin D3','health','💊',18.18,22.72],
    ];
    this.products = names.map((p,i) => ({
      id: i+1, name: p[0], category: p[1], icon: p[2], image: '',
      price: p[3], originalPrice: p[4],
      rating: +(3.5+Math.random()*1.5).toFixed(1),
      reviews: Math.floor(20+Math.random()*500),
      stock: Math.floor(10+Math.random()*100),
      sold: Math.floor(50+Math.random()*2000),
      description: `Premium quality ${p[0].toLowerCase()}. Crafted with finest materials for exceptional durability.`,
      isFlash: i<6, isTrending: i%3===0, isFeatured: i%2===0, isNew: i>24, freeShipping: p[3]>45,
    }));
  },

  generateReviews() {
    const texts = ['Excellent! Highly recommended.','Good quality for the price.','Fast delivery. Great!','Love it! Will buy again.','Great value. As described.'];
    const names = ['Rahim A.','Nasrin K.','Karim D.','Emily R.','Mike T.'];
    this.reviews = names.map((n,i) => ({
      user: n, rating: 4+Math.floor(Math.random()*2), text: texts[i],
      date: 'Mar '+(5+i)+', 2026', helpful: Math.floor(Math.random()*20), verified: true,
    }));
  },

  navigate(page, data) {
    this.state.page = page;
    if (data) Object.assign(this.state, data);
    this.state.currentPage = 1;
    if (page === 'product' && data && data.productDetail) this.addToRecentlyViewed(data.productDetail);
    this.render();
    window.scrollTo(0, 0);
  },

  addToRecentlyViewed(id) {
    this.state.recentlyViewed = [id,...this.state.recentlyViewed.filter(x=>x!==id)].slice(0,6);
  },

  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    localStorage.setItem('foresstree-theme', this.state.theme);
    this.render();
  },

  toggleCurrency() {
    this.state.currency = this.state.currency === 'BDT' ? 'USD' : 'BDT';
    this.toast(`Currency: ${this.state.currency}`, 'info');
    this.render();
  },

  toast(msg, type = 'success') {
    const icons = {success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = icons[type] + ' ' + msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => { t.style.animation = 'slideIn .35s reverse forwards'; setTimeout(()=>t.remove(), 350); }, 3000);
  },

  showModal(html) { document.getElementById('modal-content').innerHTML = html; document.getElementById('modal-overlay').classList.add('show'); },
  closeModal() { document.getElementById('modal-overlay').classList.remove('show'); },

  addToCart(id) {
    const existing = this.state.cart.find(c => c.id === id);
    if (existing) { existing.quantity++; }
    else {
      const p = this.products.find(p => p.id === id);
      if (p) this.state.cart.push({...p, quantity: 1});
    }
    localStorage.setItem('foresstree-cart', JSON.stringify(this.state.cart));
    this.toast('Added to cart! 🛒');
    this.render();
  },

  removeFromCart(id) {
    this.state.cart = this.state.cart.filter(c => c.id !== id);
    localStorage.setItem('foresstree-cart', JSON.stringify(this.state.cart));
    this.toast('Removed from cart', 'warning');
    this.render();
  },

  updateCartQty(id, delta) {
    const item = this.state.cart.find(c => c.id === id);
    if (item) item.quantity = Math.max(1, item.quantity + delta);
    localStorage.setItem('foresstree-cart', JSON.stringify(this.state.cart));
    this.render();
  },

  toggleWishlist(id) {
    const idx = this.state.wishlist.indexOf(id);
    if (idx > -1) { this.state.wishlist.splice(idx, 1); this.toast('Removed from wishlist', 'warning'); }
    else { this.state.wishlist.push(id); this.toast('Added to wishlist! ❤️'); }
    localStorage.setItem('foresstree-wishlist', JSON.stringify(this.state.wishlist));
    this.render();
  },

  toggleCompare(id) {
    const idx = this.state.compare.indexOf(id);
    if (idx > -1) { this.state.compare.splice(idx, 1); }
    else {
      if (this.state.compare.length >= 3) { this.toast('Maximum 3 products', 'warning'); return; }
      this.state.compare.push(id);
    }
    this.updateCompareBar();
    this.render();
  },

  updateCompareBar() {
    const bar = document.getElementById('compareBar');
    const itemsEl = document.getElementById('compareItems');
    if (!bar || !itemsEl) return;
    if (this.state.compare.length > 0) {
      bar.classList.add('show');
      itemsEl.innerHTML = this.state.compare.map(id => {
        const p = this.products.find(x => x.id === id);
        if (!p) return '';
        return `<div class="compare-item-chip">${p.icon} ${p.name.split(' ').slice(0,2).join(' ')}<button onclick="App.toggleCompare('${id}')" style="background:none;color:rgba(255,255,255,.7);margin-left:4px">✕</button></div>`;
      }).join('');
    } else { bar.classList.remove('show'); }
  },

  clearCompare() { this.state.compare = []; this.updateCompareBar(); this.render(); },

  openCompare() {
    if (this.state.compare.length < 2) { this.toast('Select at least 2 products', 'warning'); return; }
    const prods = this.state.compare.map(id => this.products.find(p => p.id === id)).filter(Boolean);
    const keys = ['name','category','price','rating','stock'];
    const labels = ['Product','Category','Price','Rating','Stock'];
    let html = `<button class="modal-close" onclick="App.closeModal()">✕</button>
    <h2>🔍 Compare Products</h2>
    <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
      <thead><tr><th style="padding:10px;text-align:left;font-size:.8rem;color:var(--text-secondary)"></th>
        ${prods.map(p=>`<th style="padding:10px;text-align:center">
          <div style="font-size:2rem">${p.image?`<img src="${p.image}" style="width:50px;height:50px;object-fit:cover;border-radius:8px">`:p.icon}</div>
          <div style="font-weight:800;font-size:.85rem;margin-top:6px">${p.name}</div>
        </th>`).join('')}
      </tr></thead>
      <tbody>
        ${keys.map((k,i) => `<tr style="border-top:1px solid var(--border)">
          <td style="padding:10px;font-size:.82rem;font-weight:700;color:var(--text-secondary)">${labels[i]}</td>
          ${prods.map(p=>`<td style="padding:10px;text-align:center;font-weight:600">${k==='price'?this.formatPrice(p[k]):k==='rating'?'⭐ '+p[k]:p[k]}</td>`).join('')}
        </tr>`).join('')}
        <tr style="border-top:2px solid var(--border)"><td></td>
          ${prods.map(p=>`<td style="padding:10px;text-align:center">
            <button class="btn-add-cart" style="font-size:.8rem" onclick="App.addToCart('${p.id}');App.closeModal()">🛒 Add to Cart</button>
          </td>`).join('')}
        </tr>
      </tbody>
    </table></div>`;
    this.showModal(html);
  },

  getCartTotal() {
    let total = this.state.cart.reduce((s,i) => s + i.price * i.quantity, 0);
    if (this.state.couponApplied) {
      const c = this.coupons.find(x => x.code === this.state.couponApplied);
      if (c) {
        if (c.type === 'percent') total = total * (1 - c.discount / 100);
        else total = Math.max(0, total - c.discount / this.exchangeRate);
      }
    }
    return total;
  },

  getFilteredProducts() {
    let prods = [...this.products];
    if (this.state.selectedCategory !== 'all') prods = prods.filter(p => p.category === this.state.selectedCategory);
    if (this.state.searchQuery) {
      const q = this.state.searchQuery.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.category.includes(q));
    }
    const [min, max] = this.state.priceRange;
    prods = prods.filter(p => p.price >= min && p.price <= max);
    switch (this.state.sortBy) {
      case 'price-low': prods.sort((a,b) => a.price - b.price); break;
      case 'price-high': prods.sort((a,b) => b.price - a.price); break;
      case 'rating': prods.sort((a,b) => b.rating - a.rating); break;
      case 'newest': prods.sort((a,b) => String(b.id).localeCompare(String(a.id))); break;
      case 'bestselling': prods.sort((a,b) => b.sold - a.sold); break;
    }
    return prods;
  },

  renderStars(r) { let s=''; for(let i=1;i<=5;i++) s+=i<=Math.floor(r)?'⭐':'☆'; return s; },

  renderProductCard(p) {
    const inWish = this.state.wishlist.includes(p.id);
    const inCompare = this.state.compare.includes(p.id);
    const discount = Math.round((1 - p.price / p.originalPrice) * 100);
    const idStr = typeof p.id === 'string' ? `'${p.id}'` : p.id;
    return `<div class="product-card" onclick="App.navigate('product',{productDetail:${idStr}})">
      ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ''}
      ${p.isNew ? `<div class="product-badge new" style="top:${discount>0?'34':'9'}px">NEW</div>` : ''}
      <button class="product-wishlist ${inWish?'active':''}" onclick="event.stopPropagation();App.toggleWishlist(${idStr})">${inWish?'❤️':'🤍'}</button>
      <div class="product-image">
        ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover" alt="${p.name}">` : p.icon}
        <label class="product-compare" onclick="event.stopPropagation()">
          <input type="checkbox" ${inCompare?'checked':''} onchange="App.toggleCompare(${idStr})"> Compare
        </label>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-rating">${this.renderStars(p.rating)} <span>(${p.reviews})</span></div>
        <div class="product-price">
          <span class="price-current">${this.formatPrice(p.price)}</span>
          ${p.originalPrice > p.price ? `<span class="price-original">${this.formatPrice(p.originalPrice)}</span>` : ''}
        </div>
        ${p.freeShipping ? `<div style="font-size:.7rem;color:var(--success);font-weight:700;margin-top:2px">🚚 Free Shipping</div>` : ''}
        <div class="product-actions">
          <button class="btn-add-cart" onclick="event.stopPropagation();App.addToCart(${idStr})">🛒 Cart</button>
          <button class="btn-quick-view" onclick="event.stopPropagation();App.quickView(${idStr})" title="Quick View">👁️</button>
        </div>
      </div>
    </div>`;
  },

  quickView(id) {
    const p = this.products.find(x => x.id === id);
    if (!p) return;
    const discount = Math.round((1 - p.price / p.originalPrice) * 100);
    const idStr = typeof p.id === 'string' ? `'${p.id}'` : p.id;
    this.showModal(`
      <button class="modal-close" onclick="App.closeModal()">✕</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
        <div style="background:var(--bg-secondary);border-radius:12px;height:220px;display:flex;align-items:center;justify-content:center;font-size:7rem;overflow:hidden">
          ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover">` : p.icon}
        </div>
        <div>
          <div style="font-size:.7rem;color:var(--primary);font-weight:700;text-transform:uppercase">${p.category}</div>
          <h3 style="margin:6px 0;font-size:1.1rem;font-weight:800">${p.name}</h3>
          <div style="color:var(--accent);font-size:.85rem">${this.renderStars(p.rating)} <span style="color:var(--text-secondary)">(${p.reviews})</span></div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--primary);margin:10px 0">
            ${this.formatPrice(p.price)}
            ${p.originalPrice > p.price ? `<span style="font-size:.9rem;color:var(--text-secondary);text-decoration:line-through;margin-left:8px">${this.formatPrice(p.originalPrice)}</span>` : ''}
            ${discount > 0 ? `<span style="font-size:.75rem;background:var(--danger);color:#fff;padding:2px 8px;border-radius:5px;font-weight:700;margin-left:6px">-${discount}%</span>` : ''}
          </div>
          <p style="font-size:.85rem;color:var(--text-secondary);line-height:1.6">${p.description}</p>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
            <button class="btn-primary" style="font-size:.88rem;padding:10px 20px" onclick="App.addToCart(${idStr});App.closeModal()">🛒 Add to Cart</button>
            <button class="btn-outline" style="font-size:.88rem;padding:10px 20px" onclick="App.navigate('product',{productDetail:${idStr}});App.closeModal()">View Details</button>
          </div>
        </div>
      </div>
    `);
  },

  startSlider() {
    setInterval(() => { this.state.currentSlide = (this.state.currentSlide + 1) % 3; this._updateSlider(); }, 4500);
  },
  _updateSlider() {
    const el = document.getElementById('hero-slides');
    if (el) el.style.transform = `translateX(-${this.state.currentSlide * 100}%)`;
    document.querySelectorAll('.hero-dot').forEach((d,i) => d.classList.toggle('active', i === this.state.currentSlide));
  },
  slideHero(dir) { this.state.currentSlide = (this.state.currentSlide + dir + 3) % 3; this._updateSlider(); },

  startFlashTimer() {
    setInterval(() => {
      const el = document.getElementById('flash-timer');
      if (el) {
        const now = new Date(); const end = new Date(now); end.setHours(23,59,59);
        const diff = end - now;
        const h = Math.floor(diff/3600000); const m = Math.floor((diff%3600000)/60000); const s = Math.floor((diff%60000)/1000);
        el.innerHTML = `<div><span class="num">${String(h).padStart(2,'0')}</span><span class="label">HRS</span></div><div><span class="num">${String(m).padStart(2,'0')}</span><span class="label">MIN</span></div><div><span class="num">${String(s).padStart(2,'0')}</span><span class="label">SEC</span></div>`;
      }
    }, 1000);
  },

  login(isAdmin) {
    this.state.user = {name: isAdmin?'Admin':'Rahim Ahmed', email: isAdmin?'admin@foresstree.com':'rahim@gmail.com', phone:'01712345678'};
    this.state.isAdmin = isAdmin;
    this.toast('Welcome back, '+this.state.user.name+'! 👋');
    this.navigate(isAdmin ? 'admin' : 'home');
  },

  logout() {
    this.state.user = null; this.state.isAdmin = false;
    this.toast('Logged out', 'warning');
    this.navigate('home');
  },

  applyCoupon(code) {
    const coupon = this.coupons.find(c => c.code === code.toUpperCase() && c.active);
    if (coupon) {
      this.state.couponApplied = coupon.code;
      this.toast(`Coupon applied! ${coupon.type==='percent'?coupon.discount+'% off':this.formatPrice(coupon.discount/this.exchangeRate)+' off'}`);
      this.render();
    } else { this.toast('Invalid coupon code', 'error'); }
  },

  render() {
    const s = this.state;
    let html = '';
    if (s.page === 'admin' && s.isAdmin) { html = this.renderAdmin(); }
    else {
      html = this.renderHeader();
      html += this.renderNav();
      if (s.recentlyViewed.length > 0 && s.page !== 'home') html += this.renderRecentlyViewed();
      html += `<main>`;
      switch (s.page) {
        case 'home': html += this.renderHome(); break;
        case 'shop': html += this.renderShop(); break;
        case 'product': html += this.renderProductDetail(); break;
        case 'cart': html += this.renderCart(); break;
        case 'checkout': html += this.renderCheckout(); break;
        case 'order-success': html += this.renderOrderSuccess(); break;
        case 'login': html += this.renderLogin(); break;
        case 'register': html += this.renderRegister(); break;
        case 'profile': html += this.renderProfile(); break;
        case 'wishlist': html += this.renderWishlistPage(); break;
      }
      html += `</main>`;
      html += this.renderFooter();
    }
    document.getElementById('app').innerHTML = html;
    this.updateCompareBar();
  },

  renderHeader() {
    const cartCount = this.state.cart.reduce((s,i) => s + i.quantity, 0);
    return `<header class="header">
      <div class="header-inner">
        <button class="mobile-menu-btn" onclick="document.querySelector('.nav').classList.toggle('hidden')">☰</button>
        <a class="logo" onclick="App.navigate('home')"><span class="logo-icon">🌳</span>Foresstree</a>
        <div class="search-bar">
          <input type="text" placeholder="Search products..." value="${this.state.searchQuery}"
            oninput="App.state.searchQuery=this.value"
            onkeydown="if(event.key==='Enter')App.navigate('shop')">
          <button onclick="App.navigate('shop')">🔍</button>
        </div>
        <div class="header-actions">
          <button class="theme-toggle" onclick="App.toggleTheme()">${this.state.theme==='light'?'🌙':'☀️'}</button>
          <button class="currency-btn" onclick="App.toggleCurrency()">${this.state.currency}</button>
          <button class="header-btn" onclick="App.navigate('wishlist')">❤️ ${this.state.wishlist.length>0?`<span class="badge">${this.state.wishlist.length}</span>`:''}</button>
          <button class="header-btn" onclick="App.navigate('cart')">🛒 ${cartCount>0?`<span class="badge">${cartCount}</span>`:''}</button>
          ${this.state.user
            ? `<button class="header-btn" onclick="App.navigate('profile')">👤 ${this.state.user.name.split(' ')[0]}</button>
               <button class="header-btn" onclick="App.logout()">🚪</button>`
            : `<button class="header-btn" onclick="App.navigate('login')">👤 Login</button>`}
        </div>
      </div>
    </header>`;
  },

  renderNav() {
    const links = [
      {page:'home',label:'Home'},
      {page:'shop',label:'All Products'},
      ...this.categories.slice(0,7).map(c => ({page:'shop',label:c.name,cat:c.id}))
    ];
    return `<nav class="nav">
      <div class="nav-inner">
        ${links.map(l => `<a class="nav-link ${this.state.page===l.page&&!l.cat?'active':''}"
          onclick="App.navigate('${l.page}'${l.cat?`,{selectedCategory:'${l.cat}'}`:''})">${l.label}</a>`).join('')}
        ${this.state.user ? `<a class="nav-link" onclick="window.location.href='admin.html'" style="margin-left:auto;background:rgba(255,255,255,.15)">🔧 Admin Panel</a>` : ''}
      </div>
    </nav>`;
  },

  renderRecentlyViewed() {
    const prods = this.state.recentlyViewed.map(id => this.products.find(p => p.id === id)).filter(Boolean);
    if (!prods.length) return '';
    return `<div class="recently-viewed-bar">
      <div class="recently-viewed-inner">
        <span class="recently-viewed-label">👁️ Recently Viewed:</span>
        ${prods.map(p => `<div class="recently-item" onclick="App.navigate('product',{productDetail:'${p.id}'})">
          ${p.image ? `<img src="${p.image}" style="width:24px;height:24px;object-fit:cover;border-radius:4px">` : p.icon}
          ${p.name.split(' ').slice(0,2).join(' ')}
        </div>`).join('')}
      </div>
    </div>`;
  },

  renderHome() {
    const featured = this.products.filter(p => p.isFeatured).slice(0,8);
    const trending = this.products.filter(p => p.isTrending).slice(0,8);
    const flash = this.products.filter(p => p.isFlash).slice(0,4);
    const newProds = this.products.filter(p => p.isNew).slice(0,4);
    return `
    <section class="hero">
      <div class="hero-slides" id="hero-slides">
        <div class="hero-slide" style="background:linear-gradient(135deg,#0d3a18,#1a6b2f,#2d9e4f)">
          <h1>🌳 Welcome to Foresstree</h1>
          <p>Bangladesh's trusted marketplace. Quality products delivered to your door.</p>
          <button class="hero-btn" onclick="App.navigate('shop')">Shop Now →</button>
        </div>
        <div class="hero-slide" style="background:linear-gradient(135deg,#7b1818,#c0392b,#e74c3c)">
          <h1>⚡ Flash Sale — Up to 50% Off!</h1>
          <p>Limited time offers on electronics, fashion & more. Don't miss out!</p>
          <button class="hero-btn" onclick="App.navigate('shop')">View Deals →</button>
        </div>
        <div class="hero-slide" style="background:linear-gradient(135deg,#0d2a3d,#1565c0,#1976d2)">
          <h1>🆕 New Arrivals This Week</h1>
          <p>Fresh collections handpicked just for you. Explore latest trends.</p>
          <button class="hero-btn" onclick="App.navigate('shop',{sortBy:'newest'})">Explore →</button>
        </div>
      </div>
      <button class="hero-nav prev" onclick="App.slideHero(-1)">‹</button>
      <button class="hero-nav next" onclick="App.slideHero(1)">›</button>
      <div class="hero-dots">
        ${[0,1,2].map(i=>`<div class="hero-dot ${i===this.state.currentSlide?'active':''}" onclick="App.state.currentSlide=${i};App._updateSlider()"></div>`).join('')}
      </div>
    </section>
    <div class="trust-strip">
      <div class="trust-inner">
        <div class="trust-item">🚚 Free delivery over ৳2,000</div>
        <div class="trust-item">🔒 Secure bKash/Nagad payment</div>
        <div class="trust-item">🔄 30-day easy return</div>
        <div class="trust-item">📞 24/7 customer support</div>
        <div class="trust-item">✅ 100% authentic products</div>
      </div>
    </div>
    <div class="container">
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">🏷️ Shop by Category</h2>
          <a class="section-link" onclick="App.navigate('shop')">View All →</a>
        </div>
        <div class="categories-grid">
          ${this.categories.map(c=>`<div class="category-card" onclick="App.navigate('shop',{selectedCategory:'${c.id}'})">
            <span class="category-icon">${c.icon}</span>
            <div class="category-name">${c.name}</div>
          </div>`).join('')}
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="promo-grid">
          <div class="promo-card" style="background:linear-gradient(135deg,#1a6b2f,#2d9e4f)" onclick="App.navigate('shop',{selectedCategory:'electronics'})">
            <span class="promo-emoji">📱</span><h3>Electronics Sale</h3><p>Up to 30% off on gadgets</p>
          </div>
          <div class="promo-card" style="background:linear-gradient(135deg,#7b4f12,#d4891a)" onclick="App.navigate('shop',{selectedCategory:'fashion'})">
            <span class="promo-emoji">👗</span><h3>Fashion Week</h3><p>New collection arrived</p>
          </div>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="flash-banner">
          <div class="flash-title">⚡ Flash Sale — Ends Today!</div>
          <div class="flash-timer" id="flash-timer"></div>
        </div>
        <div class="products-grid">${flash.map(p=>this.renderProductCard(p)).join('')}</div>
      </section>
      <section class="section">
        <div class="section-header"><h2 class="section-title">⭐ Featured Products</h2><a class="section-link" onclick="App.navigate('shop')">View All →</a></div>
        <div class="products-grid">${featured.map(p=>this.renderProductCard(p)).join('')}</div>
      </section>
      <section class="section">
        <div class="section-header"><h2 class="section-title">🆕 New Arrivals</h2><a class="section-link" onclick="App.navigate('shop',{sortBy:'newest'})">View All →</a></div>
        <div class="products-grid">${newProds.map(p=>this.renderProductCard(p)).join('')}</div>
      </section>
      <section class="section">
        <div class="section-header"><h2 class="section-title">🔥 Trending Now</h2><a class="section-link" onclick="App.navigate('shop',{sortBy:'bestselling'})">View All →</a></div>
        <div class="products-grid">${trending.map(p=>this.renderProductCard(p)).join('')}</div>
      </section>
      <section class="section">
        <div style="background:linear-gradient(135deg,var(--primary),var(--primary-light));border-radius:var(--radius);padding:44px 24px;color:#fff;text-align:center">
          <h2 style="font-size:1.65rem;margin-bottom:9px;font-weight:800">📧 Join Our Newsletter</h2>
          <p style="opacity:.9;margin-bottom:20px">Get exclusive deals delivered to your inbox every week.</p>
          <div style="display:flex;gap:8px;max-width:420px;margin:0 auto">
            <input id="nl-email" style="flex:1;padding:13px 16px;border:none;border-radius:10px;font-size:.9rem;background:rgba(255,255,255,.95);color:#1a1a1a" placeholder="Enter your email">
            <button style="background:#fff;color:var(--primary);padding:13px 22px;border-radius:10px;font-weight:800;white-space:nowrap" onclick="App.subscribe()">Subscribe 🎉</button>
          </div>
        </div>
      </section>
    </div>`;
  },

  subscribe() {
    const input = document.getElementById('nl-email');
    if (input && input.value.includes('@')) { this.toast('Subscribed! 🎉'); input.value = ''; }
    else { this.toast('Please enter a valid email', 'error'); }
  },

  renderShop() {
    const prods = this.getFilteredProducts();
    const start = (this.state.currentPage - 1) * this.state.perPage;
    const paginated = prods.slice(start, start + this.state.perPage);
    const totalPages = Math.ceil(prods.length / this.state.perPage);
    return `<div class="container">
      <div class="breadcrumb"><a onclick="App.navigate('home')">Home</a> › <span>Shop ${this.state.selectedCategory!=='all'?'› '+this.state.selectedCategory:''}</span></div>
      <div class="shop-layout">
        <aside class="shop-sidebar">
          <div class="filter-group">
            <div class="filter-title">Categories</div>
            <label class="filter-option"><input type="radio" name="cat" ${this.state.selectedCategory==='all'?'checked':''} onchange="App.state.selectedCategory='all';App.state.currentPage=1;App.render()"> All Categories</label>
            ${this.categories.map(c=>`<label class="filter-option"><input type="radio" name="cat" ${this.state.selectedCategory===c.id?'checked':''} onchange="App.state.selectedCategory='${c.id}';App.state.currentPage=1;App.render()"> ${c.icon} ${c.name}</label>`).join('')}
          </div>
          <div class="filter-group">
            <div class="filter-title">Price Range (${this.state.currency})</div>
            <div class="price-range">
              <input type="number" placeholder="Min" value="${this.state.priceRange[0]}" onchange="App.state.priceRange[0]=+this.value;App.render()">
              <span>—</span>
              <input type="number" placeholder="Max" value="${this.state.priceRange[1]}" onchange="App.state.priceRange[1]=+this.value;App.render()">
            </div>
          </div>
          <div class="filter-group">
            <div class="filter-title">Availability</div>
            <label class="filter-option"><input type="checkbox"> In Stock Only</label>
            <label class="filter-option"><input type="checkbox"> Free Shipping</label>
            <label class="filter-option"><input type="checkbox"> On Sale</label>
          </div>
        </aside>
        <div>
          <div class="shop-toolbar">
            <div class="shop-count"><strong>${prods.length}</strong> products found</div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              ${this.state.selectedCategory!=='all'?`<button style="background:var(--bg-secondary);border:1px solid var(--border);padding:6px 12px;border-radius:7px;font-size:.8rem;font-weight:700" onclick="App.state.selectedCategory='all';App.render()">✕ ${this.state.selectedCategory}</button>`:''}
              <div class="shop-sort">
                <select onchange="App.state.sortBy=this.value;App.render()">
                  <option value="featured" ${this.state.sortBy==='featured'?'selected':''}>Featured</option>
                  <option value="price-low" ${this.state.sortBy==='price-low'?'selected':''}>Price: Low to High</option>
                  <option value="price-high" ${this.state.sortBy==='price-high'?'selected':''}>Price: High to Low</option>
                  <option value="rating" ${this.state.sortBy==='rating'?'selected':''}>Top Rated</option>
                  <option value="newest" ${this.state.sortBy==='newest'?'selected':''}>Newest</option>
                  <option value="bestselling" ${this.state.sortBy==='bestselling'?'selected':''}>Best Selling</option>
                </select>
              </div>
            </div>
          </div>
          <div class="products-grid">${paginated.map(p=>this.renderProductCard(p)).join('')}</div>
          ${paginated.length===0?`<div class="empty-state"><div class="icon">🔍</div><h3>No products found</h3><p>Try adjusting your filters</p><button class="btn-primary" style="margin-top:16px" onclick="App.state.selectedCategory='all';App.state.searchQuery='';App.render()">Clear Filters</button></div>`:''}
          ${totalPages>1?`<div class="pagination">
            ${this.state.currentPage>1?`<button class="page-btn" onclick="App.state.currentPage--;App.render();window.scrollTo(0,0)">‹</button>`:''}
            ${Array.from({length:totalPages},(_,i)=>`<button class="page-btn ${i+1===this.state.currentPage?'active':''}" onclick="App.state.currentPage=${i+1};App.render();window.scrollTo(0,0)">${i+1}</button>`).join('')}
            ${this.state.currentPage<totalPages?`<button class="page-btn" onclick="App.state.currentPage++;App.render();window.scrollTo(0,0)">›</button>`:''}
          </div>`:''}
        </div>
      </div>
    </div>`;
  },

  renderProductDetail() {
    const p = this.products.find(pr => String(pr.id) === String(this.state.productDetail));
    if (!p) return '<div class="container"><div class="empty-state"><div class="icon">❌</div><p>Product not found</p></div></div>';
    const related = this.products.filter(r => r.category === p.category && r.id !== p.id).slice(0,4);
    const inWish = this.state.wishlist.includes(p.id);
    const discount = Math.round((1 - p.price / p.originalPrice) * 100);
    const idStr = typeof p.id === 'string' ? `'${p.id}'` : p.id;
    return `<div class="container">
      <div class="breadcrumb">
        <a onclick="App.navigate('home')">Home</a> ›
        <a onclick="App.navigate('shop')">Shop</a> ›
        <a onclick="App.navigate('shop',{selectedCategory:'${p.category}'})">${p.category}</a> ›
        <span>${p.name}</span>
      </div>
      <div class="product-detail">
        <div class="pd-gallery">
          <div class="pd-main-img">
            ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover" alt="${p.name}">` : p.icon}
          </div>
          <div class="pd-thumbs">
            ${[0,1,2,3].map(i=>`<div class="pd-thumb ${i===0?'active':''}">
              ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover">` : p.icon}
            </div>`).join('')}
          </div>
        </div>
        <div class="pd-info">
          <div class="product-category">${p.category}</div>
          <h1>${p.name}</h1>
          <div class="pd-rating">
            ${this.renderStars(p.rating)}
            <span style="color:var(--accent);font-weight:700">${p.rating}</span>
            <span style="color:var(--text-secondary)">(${p.reviews} reviews)</span>
            <span style="color:var(--text-secondary)">|</span>
            <span style="color:var(--text-secondary)">${p.sold} sold</span>
          </div>
          <div class="pd-price">
            ${this.formatPrice(p.price)}
            ${p.originalPrice > p.price ? `<span class="original">${this.formatPrice(p.originalPrice)}</span><span class="discount">-${discount}%</span>` : ''}
          </div>
          <div class="pd-stock ${p.stock > 10 ? 'in-stock' : 'low-stock'}">
            ${p.stock > 10 ? '✅ In Stock' : '⚠️ Only ' + p.stock + ' left'}
          </div>
          <p class="pd-desc">${p.description}</p>
          <div class="pd-quantity">
            <span style="font-weight:700;font-size:.9rem">Quantity:</span>
            <div class="qty-control">
              <button class="qty-btn" onclick="App.state.qty=Math.max(1,App.state.qty-1);App.render()">−</button>
              <input class="qty-val" type="number" value="${this.state.qty}" readonly>
              <button class="qty-btn" onclick="App.state.qty=Math.min(${p.stock},App.state.qty+1);App.render()">+</button>
            </div>
          </div>
          <div class="pd-buttons">
            <button class="btn-primary" onclick="for(let i=0;i<App.state.qty;i++)App.addToCart(${idStr})">🛒 Add to Cart</button>
            <button class="btn-outline" onclick="App.addToCart(${idStr});App.navigate('checkout')">⚡ Buy Now</button>
            <button class="btn-outline" onclick="App.toggleWishlist(${idStr})" style="padding:11px 16px">${inWish?'❤️':'🤍'}</button>
          </div>
          <div class="pd-info-box">
            <div>🚚 ${p.freeShipping ? '<strong style="color:var(--success)">Free shipping</strong> on this item' : 'Free shipping on orders over ' + this.formatPrice(45)}</div>
            <div>🔄 30-day return & exchange policy</div>
            <div>🔒 Secure payment via bKash/Nagad/Rocket/Card</div>
            <div>📦 Usually ships within 1-2 business days</div>
          </div>
          <div style="margin-top:14px">
            <div style="font-size:.82rem;color:var(--text-secondary);margin-bottom:7px;font-weight:600">Share:</div>
            <div class="share-buttons">
              <button class="share-btn share-fb" onclick="App.toast('Shared on Facebook!')">📘 Facebook</button>
              <button class="share-btn share-wa" onclick="App.toast('Shared on WhatsApp!')">💬 WhatsApp</button>
              <button class="share-btn share-copy" onclick="App.toast('Link copied! 📋')">🔗 Copy Link</button>
            </div>
          </div>
        </div>
      </div>
      <div class="reviews-section">
        <div class="tab-bar">
          <div class="tab active">Reviews (${this.reviews.length})</div>
          <div class="tab">Description</div>
          <div class="tab">Shipping Info</div>
        </div>
        ${this.reviews.map(r=>`<div class="review-card">
          <div class="review-header">
            <span class="review-user">${r.user} ${r.verified?'<span style="font-size:.7rem;color:var(--success);font-weight:700;margin-left:6px">✓ Verified</span>':''}</span>
            <span class="review-date">${r.date}</span>
          </div>
          <div class="review-stars">${this.renderStars(r.rating)}</div>
          <div class="review-text">${r.text}</div>
          <div class="review-helpful">Helpful? <button onclick="App.toast('Thanks!')">👍 Yes (${r.helpful})</button> <button onclick="App.toast('Thanks!')">👎 No</button></div>
        </div>`).join('')}
        <button class="btn-outline" style="margin-top:8px" onclick="App.toast('Login to write a review')">✍️ Write a Review</button>
      </div>
      ${related.length ? `<section class="section">
        <div class="section-header"><h2 class="section-title">🔗 Related Products</h2></div>
        <div class="products-grid">${related.map(r=>this.renderProductCard(r)).join('')}</div>
      </section>` : ''}
    </div>`;
  },

  renderCart() {
    if (this.state.cart.length === 0) {
      return `<div class="container">
        <div class="breadcrumb"><a onclick="App.navigate('home')">Home</a> › Cart</div>
        <div class="empty-state"><div class="icon">🛒</div><h3>Your cart is empty</h3>
          <p style="margin:8px 0 20px">You haven't added any products yet.</p>
          <button class="btn-primary" onclick="App.navigate('shop')">Continue Shopping →</button>
        </div>
      </div>`;
    }
    const subtotal = this.state.cart.reduce((s,i) => s + i.price * i.quantity, 0);
    const couponDiscount = this.state.couponApplied ? (() => {
      const c = this.coupons.find(x => x.code === this.state.couponApplied);
      if (!c) return 0;
      return c.type === 'percent' ? subtotal * (c.discount / 100) : c.discount / this.exchangeRate;
    })() : 0;
    const afterCoupon = subtotal - couponDiscount;
    const shipping = afterCoupon > 45 ? 0 : 3.63;
    const tax = afterCoupon * 0.05;
    const total = afterCoupon + shipping + tax;
    return `<div class="container">
      <div class="breadcrumb"><a onclick="App.navigate('home')">Home</a> › Cart</div>
      <h2 style="margin-bottom:18px;font-size:1.3rem;font-weight:800">🛒 Shopping Cart <span style="font-size:1rem;font-weight:600;color:var(--text-secondary)">(${this.state.cart.reduce((s,i)=>s+i.quantity,0)} items)</span></h2>
      <div class="cart-layout">
        <div>
          ${this.state.cart.map(item => {
            const idStr = typeof item.id === 'string' ? `'${item.id}'` : item.id;
            return `<div class="cart-item">
              <div class="cart-item-img">${item.image?`<img src="${item.image}" style="width:100%;height:100%;object-fit:cover">`:item.icon}</div>
              <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div style="font-size:.78rem;color:var(--text-secondary)">${item.category}</div>
                <div class="cart-item-price">${this.formatPrice(item.price)}</div>
                ${item.freeShipping?'<div style="font-size:.72rem;color:var(--success);font-weight:700">🚚 Free Shipping</div>':''}
              </div>
              <div class="cart-item-actions">
                <div class="qty-control">
                  <button class="qty-btn" onclick="App.updateCartQty(${idStr},-1)">−</button>
                  <input class="qty-val" value="${item.quantity}" readonly>
                  <button class="qty-btn" onclick="App.updateCartQty(${idStr},1)">+</button>
                </div>
                <div style="font-weight:800;min-width:80px;text-align:right">${this.formatPrice(item.price*item.quantity)}</div>
                <button class="cart-remove" onclick="App.removeFromCart(${idStr})">🗑️ Remove</button>
              </div>
            </div>`;
          }).join('')}
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn-outline" style="font-size:.88rem;padding:10px 20px" onclick="App.navigate('shop')">← Continue Shopping</button>
            <button style="background:var(--bg-secondary);border:1px solid var(--border);padding:10px 16px;border-radius:10px;font-size:.85rem;font-weight:700" onclick="App.state.cart=[];localStorage.removeItem('foresstree-cart');App.render();App.toast('Cart cleared','warning')">🗑️ Clear Cart</button>
          </div>
        </div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="coupon-input">
            <input type="text" placeholder="Coupon code (e.g. SAVE10)" id="coupon-input" value="${this.state.couponApplied||''}">
            <button onclick="App.applyCoupon(document.getElementById('coupon-input').value)">Apply</button>
          </div>
          ${this.state.couponApplied?`<div style="background:#e8f5e9;padding:8px 12px;border-radius:8px;font-size:.82rem;color:var(--success);font-weight:700;margin-bottom:12px">✅ Coupon applied! <button onclick="App.state.couponApplied=null;App.render()" style="background:none;color:var(--danger);margin-left:8px;font-size:.75rem">Remove</button></div>`:''}
          <div class="summary-row"><span>Subtotal</span><span>${this.formatPrice(subtotal)}</span></div>
          ${couponDiscount>0?`<div class="summary-row" style="color:var(--success)"><span>Discount</span><span>−${this.formatPrice(couponDiscount)}</span></div>`:''}
          <div class="summary-row"><span>Shipping</span><span>${shipping===0?'<span style="color:var(--success);font-weight:700">FREE</span>':this.formatPrice(shipping)}</span></div>
          <div class="summary-row"><span>VAT (5%)</span><span>${this.formatPrice(tax)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${this.formatPrice(total)}</span></div>
          <button class="btn-primary" style="width:100%;justify-content:center;margin-top:14px;padding:14px" onclick="App.navigate('checkout')">Proceed to Checkout →</button>
          <div style="text-align:center;margin-top:10px;font-size:.78rem;color:var(--text-secondary)">🔒 Secure & encrypted checkout</div>
          <div style="display:flex;justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap">
            <span style="font-size:1.2rem" title="bKash">💚</span>
            <span style="font-size:1.2rem" title="Nagad">🟠</span>
            <span style="font-size:1.2rem" title="Rocket">🟣</span>
            <span style="font-size:1.2rem" title="Card">💳</span>
            <span style="font-size:1.2rem" title="Cash on Delivery">💵</span>
          </div>
        </div>
      </div>
    </div>`;
  },

  renderCheckout() {
    const subtotal = this.getCartTotal();
    const shipping = subtotal > 45 ? 0 : 3.63;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;
    const payments = [
      {id:'bkash',icon:'💚',name:'bKash',desc:'Pay via bKash mobile banking'},
      {id:'nagad',icon:'🟠',name:'Nagad',desc:'Pay via Nagad mobile banking'},
      {id:'rocket',icon:'🟣',name:'Rocket (DBBL)',desc:'Pay via Rocket'},
      {id:'card',icon:'💳',name:'Credit/Debit Card',desc:'Visa, Mastercard, Amex'},
      {id:'sslcommerz',icon:'🏦',name:'SSLCommerz',desc:'All Bangladesh payment methods'},
      {id:'cod',icon:'💵',name:'Cash on Delivery',desc:'Pay when you receive'},
    ];
    return `<div class="container">
      <div class="breadcrumb"><a onclick="App.navigate('home')">Home</a> › <a onclick="App.navigate('cart')">Cart</a> › Checkout</div>
      <div class="checkout-steps" style="margin:20px 0">
        <div class="checkout-step"><div class="step-num done">✓</div><span class="step-label">Cart</span></div>
        <div class="step-line done"></div>
        <div class="checkout-step"><div class="step-num active">2</div><span class="step-label">Checkout</span></div>
        <div class="step-line"></div>
        <div class="checkout-step"><div class="step-num">3</div><span class="step-label">Confirmation</span></div>
      </div>
      <h2 style="margin-bottom:16px;font-weight:800">🔒 Secure Checkout</h2>
      <div class="checkout-layout">
        <div>
          <div class="checkout-section">
            <h3>📍 Delivery Address</h3>
            <div class="form-grid">
              <div class="form-group"><label>First Name *</label><input type="text" id="co-fname" placeholder="আপনার নাম" required></div>
              <div class="form-group"><label>Last Name</label><input type="text" id="co-lname" placeholder="পদবি"></div>
              <div class="form-group full"><label>Street Address *</label><input type="text" id="co-street" placeholder="House No, Road No, Area" required></div>
              <div class="form-group"><label>Thana/Upazila *</label><input type="text" id="co-thana" placeholder="e.g. Kapasia" required></div>
              <div class="form-group"><label>District *</label>
                <select id="co-district">
                  <option>Gazipur</option><option>Dhaka</option><option>Chittagong</option>
                  <option>Sylhet</option><option>Rajshahi</option><option>Khulna</option>
                  <option>Barisal</option><option>Rangpur</option><option>Mymensingh</option>
                </select>
              </div>
              <div class="form-group"><label>Division *</label>
                <select id="co-division">
                  <option>Dhaka</option><option>Chittagong</option><option>Sylhet</option>
                  <option>Rajshahi</option><option>Khulna</option><option>Barisal</option>
                  <option>Rangpur</option><option>Mymensingh</option>
                </select>
              </div>
              <div class="form-group"><label>Phone Number *</label><input type="tel" id="co-phone" placeholder="017XXXXXXXX" required></div>
              <div class="form-group"><label>Alternate Phone</label><input type="tel" id="co-altphone" placeholder="018XXXXXXXX"></div>
              <div class="form-group full"><label>Delivery Note</label><input type="text" id="co-note" placeholder="Any special delivery instruction..."></div>
            </div>
          </div>
          <div class="checkout-section">
            <h3>💳 Payment Method</h3>
            <div class="payment-options" id="payment-options">
              ${payments.map((pay,i)=>`<label class="payment-option ${i===0?'selected':''}" onclick="document.querySelectorAll('.payment-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">
                <input type="radio" name="payment" value="${pay.name}" ${i===0?'checked':''}><span class="payment-logo">${pay.icon}</span>
                <div><div class="payment-name">${pay.name}</div><div class="payment-desc">${pay.desc}</div></div>
              </label>`).join('')}
            </div>
          </div>
        </div>
        <div>
          <div class="cart-summary">
            <h3>📦 Order Summary</h3>
            ${this.state.cart.map(item=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);font-size:.85rem">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:1.3rem">${item.image?`<img src="${item.image}" style="width:32px;height:32px;object-fit:cover;border-radius:4px">`:item.icon}</span>
                <div><div style="font-weight:600">${item.name}</div><div style="font-size:.75rem;color:var(--text-secondary)">× ${item.quantity}</div></div>
              </div>
              <span style="font-weight:700">${this.formatPrice(item.price*item.quantity)}</span>
            </div>`).join('')}
            <div class="summary-row" style="margin-top:12px"><span>Subtotal</span><span>${this.formatPrice(subtotal)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>${shipping===0?'<span style="color:var(--success);font-weight:700">FREE</span>':this.formatPrice(shipping)}</span></div>
            <div class="summary-row"><span>VAT (5%)</span><span>${this.formatPrice(tax)}</span></div>
            <div class="summary-row total"><span>Total</span><span>${this.formatPrice(total)}</span></div>
            <button id="place-order-btn" class="btn-primary" style="width:100%;justify-content:center;margin-top:18px;padding:15px;font-size:1rem" onclick="App.placeOrder()">
              ✅ Place Order — ${this.formatPrice(total)}
            </button>
            <p style="text-align:center;font-size:.75rem;color:var(--text-secondary);margin-top:9px">🔒 Your payment is safe & encrypted</p>
          </div>
        </div>
      </div>
    </div>`;
  },

  async placeOrder() {
    const fname = document.getElementById('co-fname')?.value?.trim();
    const phone = document.getElementById('co-phone')?.value?.trim();
    const street = document.getElementById('co-street')?.value?.trim();
    const thana = document.getElementById('co-thana')?.value?.trim();

    if (!fname) { this.toast('নাম দাও!', 'error'); document.getElementById('co-fname')?.focus(); return; }
    if (!phone || phone.length < 11) { this.toast('সঠিক phone number দাও!', 'error'); document.getElementById('co-phone')?.focus(); return; }
    if (!street) { this.toast('ঠিকানা দাও!', 'error'); document.getElementById('co-street')?.focus(); return; }

    const btn = document.getElementById('place-order-btn');
    if (btn) { btn.innerHTML = '⏳ Placing Order...'; btn.disabled = true; }

    const subtotal = this.getCartTotal();
    const shipping = subtotal > 45 ? 0 : 3.63;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;

    const selectedPayment = document.querySelector('.payment-option.selected input[type="radio"]');
    const paymentMethod = selectedPayment?.value || 'Cash on Delivery';

    const orderData = {
      customer: {
        firstName: fname,
        lastName: document.getElementById('co-lname')?.value || '',
        phone: phone,
        altPhone: document.getElementById('co-altphone')?.value || '',
      },
      address: {
        street: street,
        thana: thana || '',
        district: document.getElementById('co-district')?.value || '',
        division: document.getElementById('co-division')?.value || '',
        note: document.getElementById('co-note')?.value || '',
      },
      items: this.state.cart.map(item => ({
        productId: String(item.id),
        name: item.name,
        icon: item.icon || '📦',
        image: item.image || '',
        category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
      paymentMethod: paymentMethod,
      subtotal: subtotal,
      shipping: shipping,
      tax: tax,
      discount: 0,
      total: total,
      couponCode: this.state.couponApplied || '',
      currency: this.state.currency,
    };

    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        this.state.lastOrder = { ...orderData, _id: data.order._id, orderId: data.order._id };
        this.state.cart = [];
        this.state.couponApplied = null;
        localStorage.removeItem('foresstree-cart');
        this.navigate('order-success');
      } else {
        this.toast('Order failed: ' + (data.error || 'Unknown error'), 'error');
        if (btn) { btn.innerHTML = '✅ Place Order'; btn.disabled = false; }
      }
    } catch (err) {
      this.state.lastOrder = orderData;
      this.state.cart = [];
      this.state.couponApplied = null;
      localStorage.removeItem('foresstree-cart');
      this.navigate('order-success');
    }
  },

  renderOrderSuccess() {
    const o = this.state.lastOrder;
    if (!o) { this.navigate('home'); return ''; }
    const orderId = o._id || ('FT-' + Date.now());
    return `<div class="container">
      <div class="order-success">
        <div class="icon">🎉</div>
        <h2>Order Placed Successfully!</h2>
        <p>Thank you, <strong>${o.customer?.firstName}</strong>! Your order has been received.</p>
        <div class="order-info-box">
          <div class="order-info-row"><span>Order ID</span><span style="font-family:monospace;font-size:.85rem">${orderId}</span></div>
          <div class="order-info-row"><span>Customer</span><span>${o.customer?.firstName} ${o.customer?.lastName}</span></div>
          <div class="order-info-row"><span>Phone</span><span>${o.customer?.phone}</span></div>
          <div class="order-info-row"><span>Address</span><span>${o.address?.street}, ${o.address?.thana}, ${o.address?.district}</span></div>
          <div class="order-info-row"><span>Payment</span><span>${o.paymentMethod}</span></div>
          <div class="order-info-row"><span>Total</span><span style="color:var(--primary);font-size:1.1rem">${this.formatPrice(o.total)}</span></div>
          <div class="order-info-row"><span>Status</span><span style="color:var(--warning);font-weight:800">⏳ Processing</span></div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn-primary" onclick="App.navigate('shop')">🛍️ Continue Shopping</button>
          <button class="btn-outline" onclick="App.navigate('profile',{profileTab:'orders'})">📦 My Orders</button>
        </div>
        <p style="margin-top:20px;font-size:.85rem;color:var(--text-secondary)">
          📞 আমরা শীঘ্রই ${o.customer?.phone} নম্বরে যোগাযোগ করব।
        </p>
      </div>
    </div>`;
  },

  renderLogin() {
    return `<div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;font-size:2.8rem;margin-bottom:8px;animation:sway 3s ease-in-out infinite">🌳</div>
        <h2>Welcome Back!</h2>
        <p class="subtitle">Sign in to your Foresstree account</p>
        <div class="social-login">
          <button class="social-btn" onclick="App.login(false)"><span>📘</span> Continue with Facebook</button>
          <button class="social-btn" onclick="App.login(false)"><span>🔴</span> Continue with Google</button>
        </div>
        <div class="divider">or sign in with email</div>
        <div class="form-group"><label>Email / Phone</label><input type="text" placeholder="email@example.com or 017XXXXXXXX"></div>
        <div class="form-group"><label>Password</label><input type="password" placeholder="••••••••"></div>
        <button class="btn-primary" style="width:100%;justify-content:center;padding:13px;margin-top:12px" onclick="App.login(false)">Sign In</button>
        <div class="auth-toggle">Don't have an account? <a onclick="App.navigate('register')">Sign Up Free</a></div>
      </div>
    </div>`;
  },

  renderRegister() {
    return `<div class="auth-container">
      <div class="auth-card">
        <div style="text-align:center;font-size:2.8rem;margin-bottom:8px">🌳</div>
        <h2>Create Account</h2>
        <p class="subtitle">Join Foresstree — It's free!</p>
        <div class="form-group"><label>Full Name *</label><input type="text" placeholder="Your full name"></div>
        <div class="form-group"><label>Phone Number *</label><input type="tel" placeholder="017XXXXXXXX"></div>
        <div class="form-group"><label>Email Address</label><input type="email" placeholder="email@example.com"></div>
        <div class="form-group"><label>Password *</label><input type="password" placeholder="Minimum 6 characters"></div>
        <div class="form-group"><label>Confirm Password *</label><input type="password" placeholder="Retype your password"></div>
        <button class="btn-primary" style="width:100%;justify-content:center;padding:13px;margin-top:12px" onclick="App.login(false)">Create Account 🎉</button>
        <div class="auth-toggle">Already have an account? <a onclick="App.navigate('login')">Sign In</a></div>
      </div>
    </div>`;
  },

  renderProfile() {
    if (!this.state.user) return this.renderLogin();
    const tabs = [
      {id:'orders',icon:'📦',label:'My Orders'},
      {id:'profile',icon:'👤',label:'Profile'},
      {id:'addresses',icon:'📍',label:'Addresses'},
      {id:'wishlist',icon:'❤️',label:'Wishlist'},
      {id:'wallet',icon:'💰',label:'Wallet'},
    ];
    let content = '';
    switch (this.state.profileTab) {
      case 'orders':
        content = `<h2 style="margin-bottom:16px;font-weight:800">📦 My Orders</h2>
          <p style="color:var(--text-secondary);margin-bottom:16px;font-size:.9rem">
            তোমার orders নিচে দেখা যাচ্ছে। Real orders দেখতে Admin Panel → Orders এ যাও।
          </p>
          ${this.state.lastOrder ? `<div class="order-card">
            <div class="order-header">
              <div><span class="order-id">${this.state.lastOrder._id||'FT-Recent'}</span><span style="color:var(--text-secondary);font-size:.8rem"> — Just now</span></div>
              <span class="order-status status-processing">Processing</span>
            </div>
            <div style="font-size:.85rem;color:var(--text-secondary)">${this.state.lastOrder.items?.map(i=>i.icon+' '+i.name+' × '+i.quantity).join(', ')}</div>
            <div style="font-weight:800;margin-top:8px;color:var(--primary)">Total: ${this.formatPrice(this.state.lastOrder.total)}</div>
          </div>` : '<div class="empty-state"><div class="icon">📦</div><h3>No orders yet</h3><p>Shop now to see your orders here!</p><button class="btn-primary" style="margin-top:14px" onclick="App.navigate(\'shop\')">Start Shopping</button></div>'}`;
        break;
      case 'wishlist':
        const wishPs = this.products.filter(p => this.state.wishlist.includes(p.id));
        content = `<h2 style="margin-bottom:16px;font-weight:800">❤️ My Wishlist (${wishPs.length})</h2>
          ${wishPs.length ? `<div class="products-grid">${wishPs.map(p=>this.renderProductCard(p)).join('')}</div>` : '<div class="empty-state"><div class="icon">❤️</div><h3>Wishlist is empty</h3></div>'}`;
        break;
      case 'wallet':
        content = `<h2 style="margin-bottom:16px;font-weight:800">💰 My Wallet</h2>
          <div style="background:linear-gradient(135deg,var(--primary),var(--primary-light));border-radius:var(--radius);padding:28px;color:#fff;margin-bottom:16px;max-width:380px">
            <div style="font-size:.85rem;opacity:.85;margin-bottom:6px">Available Balance</div>
            <div style="font-size:2.5rem;font-weight:800">৳0.00</div>
            <div style="font-size:.8rem;opacity:.75;margin-top:8px">Foresstree Wallet</div>
          </div>
          <button class="btn-primary" style="padding:10px 20px;font-size:.88rem" onclick="App.toast('Coming soon!','info')">+ Add Money</button>`;
        break;
      default:
        content = `<h2 style="margin-bottom:16px;font-weight:800">Profile Settings</h2>
          <div class="checkout-section" style="max-width:520px">
            <div class="form-grid">
              <div class="form-group"><label>Full Name</label><input type="text" value="${this.state.user.name}"></div>
              <div class="form-group"><label>Phone</label><input type="tel" value="${this.state.user.phone||''}"></div>
              <div class="form-group full"><label>Email</label><input type="email" value="${this.state.user.email}"></div>
            </div>
            <button class="btn-primary" style="margin-top:12px" onclick="App.toast('Profile updated! ✅')">Save Changes</button>
          </div>`;
    }
    return `<div class="container">
      <div class="breadcrumb"><a onclick="App.navigate('home')">Home</a> › Profile</div>
      <div class="profile-layout">
        <div class="profile-sidebar">
          <div class="profile-avatar">
            <div class="avatar">${this.state.user.name[0]}</div>
            <div class="profile-name">${this.state.user.name}</div>
            <div class="profile-email">${this.state.user.email}</div>
          </div>
          <div class="profile-menu">
            ${tabs.map(t=>`<div class="profile-menu-item ${this.state.profileTab===t.id?'active':''}" onclick="App.state.profileTab='${t.id}';App.render()">${t.icon} ${t.label}</div>`).join('')}
            <div class="profile-menu-item" onclick="App.logout()" style="color:var(--danger);margin-top:8px">🚪 Logout</div>
          </div>
        </div>
        <div>${content}</div>
      </div>
    </div>`;
  },

  renderWishlistPage() {
    const wishPs = this.products.filter(p => this.state.wishlist.includes(p.id));
    return `<div class="container">
      <div class="breadcrumb"><a onclick="App.navigate('home')">Home</a> › Wishlist</div>
      <h2 style="margin-bottom:18px;font-weight:800">❤️ My Wishlist (${wishPs.length} items)</h2>
      ${wishPs.length
        ? `<div class="products-grid">${wishPs.map(p=>this.renderProductCard(p)).join('')}</div>`
        : `<div class="empty-state"><div class="icon">❤️</div><h3>Your wishlist is empty</h3><p style="margin:8px 0 20px">Save items you love for later.</p><button class="btn-primary" onclick="App.navigate('shop')">Explore Products →</button></div>`}
    </div>`;
  },

  renderFooter() {
    return `<footer class="footer">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>🌳 Foresstree</h4>
          <p>Bangladesh's trusted marketplace.</p>
          <p style="margin-top:8px">📧 support@foresstree.com</p>
          <p>📞 +880 1700-000000</p>
          <p>📍 Kapasia, Gazipur, Bangladesh</p>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <a onclick="App.navigate('home')">🏠 Home</a>
          <a onclick="App.navigate('shop')">🛍️ Shop</a>
          <a onclick="App.navigate('cart')">🛒 Cart</a>
          <a onclick="App.navigate('profile')">👤 My Account</a>
          <a onclick="App.navigate('wishlist')">❤️ Wishlist</a>
        </div>
        <div class="footer-col">
          <h4>Customer Service</h4>
          <a onclick="App.toast('Coming soon','info')">📞 Contact Us</a>
          <a onclick="App.toast('Coming soon','info')">❓ FAQ</a>
          <a onclick="App.toast('Coming soon','info')">🚚 Shipping Policy</a>
          <a onclick="App.toast('Coming soon','info')">🔄 Return Policy</a>
        </div>
        <div class="footer-col">
          <h4>Stay Connected</h4>
          <a onclick="App.toast('Opening...')">📘 Facebook</a>
          <a onclick="App.toast('Opening...')">📸 Instagram</a>
          <a onclick="App.toast('Opening...')">💬 WhatsApp</a>
          <div class="footer-newsletter">
            <input type="email" placeholder="your@email.com">
            <button onclick="App.toast('Subscribed! 🎉')">Join</button>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-payment">
          <span class="payment-badge">💚 bKash</span>
          <span class="payment-badge">🟠 Nagad</span>
          <span class="payment-badge">🟣 Rocket</span>
          <span class="payment-badge">💳 Card</span>
          <span class="payment-badge">💵 Cash on Delivery</span>
        </div>
        <p style="margin-top:14px">© 2026 Foresstree. All rights reserved. Built with 💚 in Bangladesh.</p>
      </div>
    </footer>`;
  },

  renderAdmin() {
    return `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg)">
      <div style="text-align:center;padding:40px">
        <div style="font-size:3rem;margin-bottom:16px">🔧</div>
        <h2 style="font-weight:800;margin-bottom:8px">Admin Panel</h2>
        <p style="color:var(--text-secondary);margin-bottom:24px">Full admin panel এ যাও products manage করতে।</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn-primary" onclick="window.location.href='admin.html'">🔧 Open Admin Panel</button>
          <button class="btn-outline" onclick="App.navigate('home');App.state.isAdmin=false">🏪 Back to Store</button>
        </div>
      </div>
    </div>`;
  },
};

document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) App.closeModal();
});

App.init();