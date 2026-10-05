// ════════════════════════════════════════════════
//  AMAZON CLONE — FRONTEND WITH BACKEND API
// ════════════════════════════════════════════════

const API = 'http://localhost:8000/api';

// ── STATE ─────────────────────────────────────
const state = {
    products: [],
    cart: [],
    wishlist: [],
    recentlyViewed: JSON.parse(localStorage.getItem('amz_recent') || '[]'),
    orders: [],
    user: JSON.parse(localStorage.getItem('amz_user') || 'null'),
    token: localStorage.getItem('amz_token') || null,
    currentFilter: 'all',
    currentSort: 'default',
    currentPage: 1,
    itemsPerPage: 8,
    searchQuery: '',
    location: localStorage.getItem('amz_location') || 'India',
};

// ── API HELPER ─────────────────────────────────
async function api(method, endpoint, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const res = await fetch(API + endpoint, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'API Error');
        return data;
    } catch (err) {
        console.error('API Error:', err.message);
        throw err;
    }
}

// ── TOAST ─────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ── STARS ─────────────────────────────────────
function starsHTML(rating) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += rating >= i ? '★' : rating >= i - 0.5 ? '⭐' : '☆';
    return s + ` <span style="font-size:0.75rem;color:var(--text2)">${rating}</span>`;
}

function discountPct(price, original) {
    return Math.round((1 - price / original) * 100);
}

// ── GREETING ──────────────────────────────────
function updateGreeting() {
    const el = document.getElementById('greeting-text');
    const logout = document.getElementById('logout-btn');
    const authSection = document.getElementById('dropdown-auth-section');
    if (state.user) {
        el.textContent = `Hello, ${state.user.name.split(' ')[0]}`;
        logout.style.display = 'flex';
        authSection.style.display = 'none';
    } else {
        el.textContent = 'Hello, sign in';
        logout.style.display = 'none';
        authSection.style.display = 'block';
    }
}

// ── LOAD PRODUCTS FROM BACKEND ─────────────────
async function loadProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = renderSkeletons();

    try {
        const params = new URLSearchParams();
        if (state.currentFilter !== 'all') params.append('category', state.currentFilter);
        if (state.searchQuery) params.append('search', state.searchQuery);
        if (state.currentSort !== 'default') params.append('sort', state.currentSort);

        const data = await api('GET', `/products?${params}`);
        state.products = data.products;
        renderProducts();
    } catch (err) {
        // Fallback to local data if backend not running
        console.warn('Backend not reachable, using local data');
        state.products = LOCAL_PRODUCTS;
        renderProducts();
    }
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    const pagination = document.getElementById('pagination');
    const title = document.getElementById('section-title');

    const total = state.products.length;
    const pages = Math.ceil(total / state.itemsPerPage);
    if (state.currentPage > pages) state.currentPage = 1;
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const paged = state.products.slice(start, start + state.itemsPerPage);

    title.textContent = state.currentFilter === 'all'
        ? 'Featured Products'
        : state.currentFilter.charAt(0).toUpperCase() + state.currentFilter.slice(1);

    if (paged.length === 0) {
        grid.innerHTML = '';
        noProducts.style.display = 'block';
    } else {
        noProducts.style.display = 'none';
        grid.innerHTML = paged.map(renderProductCard).join('');
    }

    // Pagination
    pagination.innerHTML = '';
    if (pages > 1) {
        for (let i = 1; i <= pages; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-btn' + (i === state.currentPage ? ' active' : '');
            btn.textContent = i;
            btn.addEventListener('click', () => {
                state.currentPage = i;
                renderProducts();
                window.scrollTo({ top: 400, behavior: 'smooth' });
            });
            pagination.appendChild(btn);
        }
    }
}

function renderProductCard(p) {
    const id = p._id || p.id;
    const inWish = state.wishlist.some(w => (w.productId || w.id) === String(id));
    const disc = discountPct(p.price, p.original);
    return `
    <div class="product-card" data-id="${id}">
        <span class="product-category-badge">${p.category}</span>
        <button class="product-wishlist-btn ${inWish ? 'active' : ''}" data-wish="${id}">
            <i class="fa-${inWish ? 'solid' : 'regular'} fa-heart"></i>
        </button>
        <div class="product-emoji">${p.emoji}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-stars">${starsHTML(p.rating)}</div>
        <div class="product-reviews">${p.reviews.toLocaleString()} ratings</div>
        <div class="product-price">₹${p.price.toLocaleString()}</div>
        <div>
            <span class="product-original">₹${p.original.toLocaleString()}</span>
            <span class="product-discount"> ${disc}% off</span>
        </div>
        <button class="add-to-cart-btn" data-cart="${id}">Add to Cart</button>
    </div>`;
}

function renderSkeletons(n = 8) {
    return Array(n).fill(0).map(() => `
    <div class="skeleton">
        <div class="skel-box" style="height:90px;margin-bottom:10px;"></div>
        <div class="skel-box" style="height:14px;margin-bottom:6px;width:80%;"></div>
        <div class="skel-box" style="height:12px;margin-bottom:6px;width:60%;"></div>
        <div class="skel-box" style="height:18px;margin-bottom:8px;width:40%;"></div>
        <div class="skel-box" style="height:34px;"></div>
    </div>`).join('');
}

// ── CART ──────────────────────────────────────
async function addToCart(productId) {
    const product = state.products.find(p => (p._id || p.id) == productId)
                  || LOCAL_PRODUCTS.find(p => p.id == productId);
    if (!product) return;

    if (state.user && state.token) {
        try {
            const data = await api('POST', '/cart', {
                productId: String(productId),
                name: product.name,
                price: product.price,
                emoji: product.emoji
            });
            state.cart = data.items;
        } catch (err) {
            showToast('❌ ' + err.message); return;
        }
    } else {
        // Guest cart (localStorage)
        const existing = state.cart.find(c => c.productId == productId);
        if (existing) existing.qty++;
        else state.cart.push({ productId: String(productId), name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
        localStorage.setItem('amz_guest_cart', JSON.stringify(state.cart));
    }

    updateCartCount();
    renderCartItems();
    showToast(`✅ ${product.name} added to cart!`);
}

async function removeFromCart(productId) {
    if (state.user && state.token) {
        try {
            const data = await api('DELETE', `/cart/${productId}`);
            state.cart = data.items;
        } catch (err) { showToast('❌ ' + err.message); return; }
    } else {
        state.cart = state.cart.filter(c => c.productId != productId);
        localStorage.setItem('amz_guest_cart', JSON.stringify(state.cart));
    }
    updateCartCount();
    renderCartItems();
}

async function changeQty(productId, delta) {
    const item = state.cart.find(c => c.productId == productId);
    if (!item) return;
    const newQty = item.qty + delta;

    if (state.user && state.token) {
        try {
            const data = await api('PUT', `/cart/${productId}`, { qty: newQty });
            state.cart = data.items;
        } catch (err) { showToast('❌ ' + err.message); return; }
    } else {
        if (newQty <= 0) state.cart = state.cart.filter(c => c.productId != productId);
        else item.qty = newQty;
        localStorage.setItem('amz_guest_cart', JSON.stringify(state.cart));
    }
    updateCartCount();
    renderCartItems();
}

async function loadCart() {
    if (state.user && state.token) {
        try {
            const data = await api('GET', '/cart');
            state.cart = data.items;
        } catch (e) {}
    } else {
        state.cart = JSON.parse(localStorage.getItem('amz_guest_cart') || '[]');
    }
    updateCartCount();
}

function updateCartCount() {
    const total = state.cart.reduce((s, c) => s + c.qty, 0);
    document.getElementById('cart-count').textContent = total;
}

function renderCartItems() {
    const list = document.getElementById('cart-items-list');
    const total = state.cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById('cart-total-price').textContent = '₹' + total.toLocaleString();

    if (state.cart.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>Your cart is empty</p></div>`;
        return;
    }
    list.innerHTML = state.cart.map(item => `
    <div class="cart-item">
        <div class="cart-item-img">${item.emoji}</div>
        <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString()}</div>
            <div class="cart-item-qty">
                <button class="qty-btn" data-qty-dec="${item.productId}">−</button>
                <span>${item.qty}</span>
                <button class="qty-btn" data-qty-inc="${item.productId}">+</button>
            </div>
            <button class="cart-item-remove" data-remove="${item.productId}">Remove</button>
        </div>
    </div>`).join('');
}

function openCart() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-backdrop').classList.add('show');
    renderCartItems();
}
function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-backdrop').classList.remove('show');
}

// ── WISHLIST ──────────────────────────────────
async function toggleWishlist(productId) {
    const product = state.products.find(p => (p._id || p.id) == productId)
                  || LOCAL_PRODUCTS.find(p => p.id == productId);
    if (!product) return;

    if (state.user && state.token) {
        try {
            const data = await api('POST', '/wishlist', {
                productId: String(productId),
                name: product.name,
                price: product.price,
                emoji: product.emoji
            });
            state.wishlist = data.items;
            showToast(data.action === 'added' ? `❤️ Added to wishlist!` : `💔 Removed from wishlist`);
        } catch (err) { showToast('❌ ' + err.message); return; }
    } else {
        const idx = state.wishlist.findIndex(w => w.productId == productId);
        if (idx >= 0) { state.wishlist.splice(idx, 1); showToast('💔 Removed from wishlist'); }
        else { state.wishlist.push({ productId: String(productId), name: product.name, price: product.price, emoji: product.emoji }); showToast('❤️ Added to wishlist!'); }
        localStorage.setItem('amz_guest_wishlist', JSON.stringify(state.wishlist));
    }
    updateWishlistCount();
    renderProducts();
    renderWishlistItems();
}

async function loadWishlist() {
    if (state.user && state.token) {
        try {
            const data = await api('GET', '/wishlist');
            state.wishlist = data.items;
        } catch (e) {}
    } else {
        state.wishlist = JSON.parse(localStorage.getItem('amz_guest_wishlist') || '[]');
    }
    updateWishlistCount();
}

function updateWishlistCount() {
    document.getElementById('wishlist-count').textContent = state.wishlist.length;
    document.getElementById('wishlist-badge-dd').textContent = state.wishlist.length;
}

function renderWishlistItems() {
    const list = document.getElementById('wishlist-items-list');
    if (state.wishlist.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-heart"></i><p>Your wishlist is empty</p></div>`;
        return;
    }
    list.innerHTML = state.wishlist.map(item => `
    <div class="cart-item">
        <div class="cart-item-img">${item.emoji}</div>
        <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
            <button class="add-to-cart-btn" style="margin-top:6px" data-cart="${item.productId}">Add to Cart</button>
        </div>
    </div>`).join('');
}

function openWishlist() {
    document.getElementById('wishlist-sidebar').classList.add('open');
    document.getElementById('wishlist-backdrop').classList.add('show');
    renderWishlistItems();
}
function closeWishlist() {
    document.getElementById('wishlist-sidebar').classList.remove('open');
    document.getElementById('wishlist-backdrop').classList.remove('show');
}

// ── PRODUCT DETAIL ────────────────────────────
function openProductDetail(id) {
    const p = state.products.find(x => (x._id || x.id) == id)
            || LOCAL_PRODUCTS.find(x => x.id == id);
    if (!p) return;

    state.recentlyViewed = [p, ...state.recentlyViewed.filter(r => (r._id || r.id) != id)].slice(0, 6);
    localStorage.setItem('amz_recent', JSON.stringify(state.recentlyViewed));
    renderRecentlyViewed();

    document.getElementById('popup-img').textContent = p.emoji;
    document.getElementById('popup-badge').textContent = discountPct(p.price, p.original) + '% OFF';
    document.getElementById('popup-name').textContent = p.name;
    document.getElementById('popup-stars').innerHTML = starsHTML(p.rating);
    document.getElementById('popup-reviews').textContent = p.reviews.toLocaleString() + ' customer ratings';
    document.getElementById('popup-price').textContent = '₹' + p.price.toLocaleString();
    document.getElementById('popup-desc').textContent = p.desc;

    const pid = p._id || p.id;
    document.getElementById('popup-add-cart').onclick = () => addToCart(pid);
    document.getElementById('popup-add-wishlist').onclick = () => toggleWishlist(pid);

    const inWish = state.wishlist.some(w => (w.productId || w.id) === String(pid));
    document.getElementById('popup-add-wishlist').className = 'btn-wishlist' + (inWish ? ' active' : '');

    document.getElementById('product-overlay').style.display = 'flex';
}

function renderRecentlyViewed() {
    const section = document.getElementById('recently-viewed-section');
    const grid = document.getElementById('recently-viewed-grid');
    if (state.recentlyViewed.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    grid.innerHTML = state.recentlyViewed.map(renderProductCard).join('');
}

// ── SEARCH ────────────────────────────────────
async function doSearch(query) {
    query = query || document.getElementById('search-input').value.trim();
    const resultsSection = document.getElementById('search-results-section');
    const productsSection = document.getElementById('products-section');
    document.getElementById('search-suggestions').style.display = 'none';

    if (!query) { resultsSection.style.display = 'none'; productsSection.style.display = 'block'; return; }

    state.searchQuery = query;
    resultsSection.style.display = 'block';
    productsSection.style.display = 'none';

    try {
        const data = await api('GET', `/products?search=${encodeURIComponent(query)}`);
        const results = data.products;
        document.getElementById('search-results-title').textContent =
            results.length > 0 ? `${results.length} results for "${query}"` : `No results for "${query}"`;
        document.getElementById('search-results-grid').innerHTML =
            results.length > 0
                ? results.map(renderProductCard).join('')
                : `<div class="no-products" style="grid-column:1/-1;"><i class="fa-solid fa-box-open"></i><p>No products found</p></div>`;
    } catch {
        // fallback local search
        const results = LOCAL_PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
        document.getElementById('search-results-grid').innerHTML = results.map(renderProductCard).join('');
    }
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    state.searchQuery = '';
    document.getElementById('search-results-section').style.display = 'none';
    document.getElementById('products-section').style.display = 'block';
}

function showSuggestions(q) {
    const box = document.getElementById('search-suggestions');
    if (!q) { box.style.display = 'none'; return; }
    const matches = (state.products.length ? state.products : LOCAL_PRODUCTS)
        .filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
    if (!matches.length) { box.style.display = 'none'; return; }
    box.innerHTML = matches.map(p => `
        <div class="suggestion-item" data-suggest="${p._id || p.id}">
            <span>${p.emoji}</span> ${p.name}
        </div>`).join('');
    box.style.display = 'block';
}

// ── AUTH ──────────────────────────────────────
async function doLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { showToast('⚠️ Please fill all fields'); return; }

    try {
        const data = await api('POST', '/auth/login', { email, password });
        state.user = data.user;
        state.token = data.token;
        localStorage.setItem('amz_user', JSON.stringify(data.user));
        localStorage.setItem('amz_token', data.token);
        document.getElementById('login-overlay').style.display = 'none';
        updateGreeting();
        await loadCart();
        await loadWishlist();
        showToast(`👋 Welcome back, ${data.user.name}!`);
    } catch (err) {
        showToast('❌ ' + err.message);
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!name || !email || !password) { showToast('⚠️ Please fill all fields'); return; }

    try {
        const data = await api('POST', '/auth/register', { name, email, password });
        state.user = data.user;
        state.token = data.token;
        localStorage.setItem('amz_user', JSON.stringify(data.user));
        localStorage.setItem('amz_token', data.token);
        document.getElementById('login-overlay').style.display = 'none';
        updateGreeting();
        showToast(`🎉 Welcome to Amazon, ${data.user.name}!`);
    } catch (err) {
        showToast('❌ ' + err.message);
    }
}

function doLogout() {
    state.user = null;
    state.token = null;
    state.cart = [];
    state.wishlist = [];
    localStorage.removeItem('amz_user');
    localStorage.removeItem('amz_token');
    updateGreeting();
    updateCartCount();
    updateWishlistCount();
    showToast('👋 You have been signed out');
}

function openLogin() {
    document.getElementById('welcome-overlay').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-form-section').style.display = 'block';
    document.getElementById('register-form-section').style.display = 'none';
}

// ── ORDERS ────────────────────────────────────
async function createOrder() {
    if (state.cart.length === 0) { showToast('⚠️ Your cart is empty!'); return; }

    if (state.user && state.token) {
        try {
            const data = await api('POST', '/orders');
            state.cart = [];
            updateCartCount();
            renderCartItems();
            closeCart();
            showToast(`🎉 Order placed! ID: ${data.order._id.slice(-8).toUpperCase()}`);
        } catch (err) { showToast('❌ ' + err.message); }
    } else {
        // Guest fake order
        const orderId = 'AMZ-' + Math.random().toString(36).substr(2, 8).toUpperCase();
        state.cart = [];
        localStorage.setItem('amz_guest_cart', '[]');
        updateCartCount();
        renderCartItems();
        closeCart();
        showToast(`🎉 Order ${orderId} placed!`);
    }
}

async function openOrders() {
    const list = document.getElementById('order-list');
    const steps = ['Ordered', 'Shipped', 'Out for Delivery', 'Delivered'];
    list.innerHTML = '<p style="padding:20px;color:var(--text2)">Loading orders...</p>';
    document.getElementById('order-overlay').style.display = 'flex';

    if (state.user && state.token) {
        try {
            const data = await api('GET', '/orders');
            state.orders = data.orders;
        } catch (e) { state.orders = []; }
    }

    if (state.orders.length === 0) {
        list.innerHTML = `<div class="empty-state" style="padding:30px;"><i class="fa-solid fa-box-open"></i><p>No orders yet!</p></div>`;
        return;
    }

    list.innerHTML = state.orders.map(order => `
    <div class="order-card">
        <h4>Order: ${(order._id || order.id || '').toString().slice(-8).toUpperCase()} | ₹${order.total.toLocaleString()}</h4>
        <div class="order-steps">
            ${steps.map((step, i) => `
            <div class="order-step ${i < order.status ? 'done' : ''} ${i === order.status ? 'active' : ''}">
                <div class="dot">${i < order.status ? '✓' : i + 1}</div>
                <span>${step}</span>
            </div>`).join('')}
        </div>
    </div>`).join('');
}

// ── HERO SLIDER ───────────────────────────────
let currentSlide = 0;
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dotsContainer = document.getElementById('slider-dots');

    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });
    setInterval(() => goToSlide(currentSlide + 1), 4500);
}

function goToSlide(n) {
    const slides = document.querySelectorAll('.slide');
    slides[currentSlide].classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

// ── DARK MODE ─────────────────────────────────
function toggleDark() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('amz_theme', isDark ? 'light' : 'dark');
    showToast(isDark ? '☀️ Light mode on' : '🌙 Dark mode on');
}

// ── TIMER ─────────────────────────────────────
function initTimer() {
    const end = new Date(); end.setHours(23, 59, 59, 0);
    function tick() {
        let diff = Math.max(0, end - new Date());
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0'); diff %= 3600000;
        const m = String(Math.floor(diff / 60000)).padStart(2, '0'); diff %= 60000;
        const s = String(Math.floor(diff / 1000)).padStart(2, '0');
        document.getElementById('timer-display').textContent = `${h}:${m}:${s}`;
    }
    tick(); setInterval(tick, 1000);
}

// ── VOICE SEARCH ──────────────────────────────
function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('❌ Voice search not supported in this browser'); return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.start();
    const btn = document.getElementById('voice-btn');
    btn.classList.add('listening');
    showToast('🎤 Listening...');
    recognition.onresult = e => {
        const text = e.results[0][0].transcript;
        document.getElementById('search-input').value = text;
        doSearch(text);
        btn.classList.remove('listening');
    };
    recognition.onerror = () => { btn.classList.remove('listening'); showToast('❌ Voice search failed'); };
    recognition.onend = () => btn.classList.remove('listening');
}

// ── LOCATION ──────────────────────────────────
function updateLocation(loc) {
    state.location = loc;
    localStorage.setItem('amz_location', loc);
    document.getElementById('current-location').textContent = loc;
    document.querySelectorAll('.location-item').forEach(el =>
        el.classList.toggle('active', el.dataset.location === loc));
}

// ── BACK TO TOP ───────────────────────────────
function initBackToTop() {
    const btn = document.getElementById('back-to-top-btn');
    const footer = document.getElementById('back-to-top');
    const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
    btn.addEventListener('click', scrollUp);
    footer.addEventListener('click', scrollUp);
}

// ── EVENT DELEGATION ──────────────────────────
function handleGridClick(e) {
    const wishBtn    = e.target.closest('[data-wish]');
    const cartBtn    = e.target.closest('[data-cart]');
    const removeBtn  = e.target.closest('[data-remove]');
    const qtyDec     = e.target.closest('[data-qty-dec]');
    const qtyInc     = e.target.closest('[data-qty-inc]');
    const suggestItem = e.target.closest('[data-suggest]');
    const card       = e.target.closest('.product-card');
    const box        = e.target.closest('.box');

    if (wishBtn)  { e.stopPropagation(); toggleWishlist(wishBtn.dataset.wish); return; }
    if (cartBtn)  { e.stopPropagation(); addToCart(cartBtn.dataset.cart); return; }
    if (removeBtn){ removeFromCart(removeBtn.dataset.remove); return; }
    if (qtyDec)   { changeQty(qtyDec.dataset.qtyDec, -1); return; }
    if (qtyInc)   { changeQty(qtyInc.dataset.qtyInc, 1); return; }
    if (suggestItem) {
        const p = (state.products.length ? state.products : LOCAL_PRODUCTS)
            .find(x => (x._id || x.id) == suggestItem.dataset.suggest);
        if (p) { document.getElementById('search-input').value = p.name; doSearch(p.name); }
        return;
    }
    if (card) { openProductDetail(card.dataset.id); return; }
    if (box && box.dataset.cat) {
        state.currentFilter = box.dataset.cat;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === box.dataset.cat));
        clearSearch();
        loadProducts();
        window.scrollTo({ top: 500, behavior: 'smooth' });
    }
}

// ── LOCAL FALLBACK PRODUCTS ───────────────────
const LOCAL_PRODUCTS = [
    { id:1,  name:"Samsung 4K Smart TV 55\"",     category:"electronics", price:42999, original:59999, rating:4.5, reviews:2341, emoji:"📺", desc:"Crystal clear 4K display with built-in streaming apps, voice control and HDR support." },
    { id:2,  name:"Apple AirPods Pro (2nd Gen)",   category:"electronics", price:24900, original:29900, rating:4.8, reviews:8721, emoji:"🎧", desc:"Active noise cancellation, transparency mode, and up to 6 hours of listening time." },
    { id:3,  name:"Sony PlayStation 5",             category:"gaming",      price:54990, original:59990, rating:4.9, reviews:5112, emoji:"🎮", desc:"Experience lightning-fast loading with 4K gaming." },
    { id:4,  name:"Xbox Series X",                 category:"gaming",      price:49990, original:54990, rating:4.7, reviews:3890, emoji:"🕹️", desc:"The most powerful Xbox ever." },
    { id:5,  name:"Nike Air Max 270",               category:"clothing",    price:10995, original:12995, rating:4.3, reviews:1423, emoji:"👟", desc:"Inspired by Air Max heritage, pure comfort." },
    { id:6,  name:"Levi's 511 Slim Fit Jeans",     category:"clothing",    price:2999,  original:4999,  rating:4.4, reviews:3201, emoji:"👖", desc:"Slim fit jeans for everyday wear." },
    { id:7,  name:"IKEA KALLAX Shelf Unit",         category:"furniture",   price:8499,  original:10999, rating:4.6, reviews:987,  emoji:"🗄️", desc:"Versatile shelving for storage and display." },
    { id:8,  name:"L-Shape Office Desk",            category:"furniture",   price:12999, original:18000, rating:4.2, reviews:654,  emoji:"🪑", desc:"Spacious L-shaped desk for dual monitors." },
    { id:9,  name:"Maybelline Fit Me Foundation",   category:"beauty",      price:449,   original:699,   rating:4.5, reviews:4521, emoji:"💄", desc:"Lightweight coverage with SPF 18." },
    { id:10, name:"The Ordinary Niacinamide Serum", category:"beauty",      price:599,   original:850,   rating:4.7, reviews:7812, emoji:"🧴", desc:"10% Niacinamide reduces blemishes." },
    { id:11, name:"Royal Canin Dog Food 10kg",      category:"pets",        price:3499,  original:4200,  rating:4.8, reviews:2109, emoji:"🐕", desc:"Complete nutrition for adult dogs." },
    { id:12, name:"Cat Scratching Tree Tower",      category:"pets",        price:2199,  original:3500,  rating:4.4, reviews:876,  emoji:"🐱", desc:"Multi-level cat tree with scratching posts." },
    { id:13, name:"Logitech MX Master 3 Mouse",     category:"electronics", price:8995,  original:10999, rating:4.8, reviews:6234, emoji:"🖱️", desc:"Advanced wireless mouse with ultra-fast scrolling." },
    { id:14, name:"Mechanical Gaming Keyboard",     category:"gaming",      price:5499,  original:7999,  rating:4.6, reviews:1876, emoji:"⌨️", desc:"RGB mechanical keyboard with anti-ghosting." },
    { id:15, name:"Men's Casual Shirt (Pack of 3)", category:"clothing",    price:1299,  original:2499,  rating:4.1, reviews:3456, emoji:"👔", desc:"Premium cotton shirts for everyday wear." },
    { id:16, name:"Wooden Coffee Table",            category:"furniture",   price:6999,  original:9500,  rating:4.3, reviews:432,  emoji:"🪵", desc:"Solid wood table for your living space." },
];

// ── INIT ──────────────────────────────────────
async function init() {
    // Apply saved theme
    document.documentElement.setAttribute('data-theme', localStorage.getItem('amz_theme') || 'light');

    updateGreeting();
    updateLocation(state.location);
    initSlider();
    initTimer();
    initBackToTop();

    await loadCart();
    await loadWishlist();
    await loadProducts();
    renderRecentlyViewed();

    // Welcome popup (once per session)
    if (!sessionStorage.getItem('amz_welcomed')) {
        document.getElementById('welcome-overlay').style.display = 'flex';
        sessionStorage.setItem('amz_welcomed', '1');
    } else {
        document.getElementById('welcome-overlay').style.display = 'none';
    }

    // ── LISTENERS ──
    document.getElementById('close-welcome').addEventListener('click', () => document.getElementById('welcome-overlay').style.display = 'none');
    document.getElementById('continue-guest').addEventListener('click', () => document.getElementById('welcome-overlay').style.display = 'none');
    document.getElementById('open-login-from-welcome').addEventListener('click', openLogin);

    document.getElementById('close-login').addEventListener('click', () => document.getElementById('login-overlay').style.display = 'none');
    document.getElementById('do-login').addEventListener('click', doLogin);
    document.getElementById('do-register').addEventListener('click', doRegister);
    document.getElementById('go-register').addEventListener('click', () => { document.getElementById('login-form-section').style.display = 'none'; document.getElementById('register-form-section').style.display = 'block'; });
    document.getElementById('go-login').addEventListener('click', () => { document.getElementById('login-form-section').style.display = 'block'; document.getElementById('register-form-section').style.display = 'none'; });
    document.getElementById('dropdown-signin').addEventListener('click', openLogin);
    document.getElementById('dropdown-register').addEventListener('click', () => { openLogin(); setTimeout(() => { document.getElementById('login-form-section').style.display = 'none'; document.getElementById('register-form-section').style.display = 'block'; }, 50); });
    document.getElementById('logout-btn').addEventListener('click', doLogout);

    document.getElementById('cart-btn').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    document.getElementById('cart-backdrop').addEventListener('click', closeCart);
    document.getElementById('checkout-btn').addEventListener('click', createOrder);
    document.getElementById('clear-cart-btn').addEventListener('click', async () => {
        if (state.user && state.token) { try { await api('DELETE', '/cart'); } catch(e){} }
        state.cart = []; localStorage.setItem('amz_guest_cart', '[]');
        updateCartCount(); renderCartItems(); showToast('🗑️ Cart cleared');
    });

    document.getElementById('wishlist-nav-btn').addEventListener('click', openWishlist);
    document.getElementById('close-wishlist').addEventListener('click', closeWishlist);
    document.getElementById('wishlist-backdrop').addEventListener('click', closeWishlist);
    document.getElementById('open-wishlist-dropdown').addEventListener('click', openWishlist);

    document.getElementById('close-product').addEventListener('click', () => document.getElementById('product-overlay').style.display = 'none');
    document.getElementById('product-overlay').addEventListener('click', e => { if (e.target === document.getElementById('product-overlay')) document.getElementById('product-overlay').style.display = 'none'; });

    document.getElementById('location-btn').addEventListener('click', () => document.getElementById('location-overlay').style.display = 'flex');
    document.getElementById('close-location').addEventListener('click', () => document.getElementById('location-overlay').style.display = 'none');
    document.querySelectorAll('.location-item').forEach(el => el.addEventListener('click', () => { updateLocation(el.dataset.location); document.getElementById('location-overlay').style.display = 'none'; showToast(`📍 Delivering to ${el.dataset.location}`); }));

    document.getElementById('orders-nav-btn').addEventListener('click', openOrders);
    document.getElementById('open-orders-dropdown').addEventListener('click', openOrders);
    document.getElementById('close-order').addEventListener('click', () => document.getElementById('order-overlay').style.display = 'none');

    document.getElementById('toggle-dark-dropdown').addEventListener('click', toggleDark);

    document.getElementById('search-btn').addEventListener('click', () => doSearch());
    document.getElementById('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    document.getElementById('search-input').addEventListener('input', e => showSuggestions(e.target.value));
    document.getElementById('clear-search-btn').addEventListener('click', clearSearch);
    document.addEventListener('click', e => { if (!e.target.closest('.search-wrapper')) document.getElementById('search-suggestions').style.display = 'none'; });

    document.getElementById('voice-btn').addEventListener('click', startVoice);

    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.dataset.cat;
        state.currentPage = 1;
        clearSearch();
        loadProducts();
    }));

    document.getElementById('sort-select').addEventListener('change', e => { state.currentSort = e.target.value; loadProducts(); });

    document.getElementById('slide-prev').addEventListener('click', () => goToSlide(currentSlide - 1));
    document.getElementById('slide-next').addEventListener('click', () => goToSlide(currentSlide + 1));
    document.querySelectorAll('.slide-btn').forEach(btn => btn.addEventListener('click', () => {
        state.currentFilter = btn.dataset.cat;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === btn.dataset.cat));
        clearSearch(); loadProducts();
        window.scrollTo({ top: 500, behavior: 'smooth' });
    }));

    document.addEventListener('click', handleGridClick);
}

document.addEventListener('DOMContentLoaded', init);
