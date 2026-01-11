// Frontend-only mock service using localStorage as storage.
const STORAGE_KEY = 'a24_store_v1';

function readDB() {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try { return JSON.parse(raw); } catch (e) { return null; }
}

function writeDB(data) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function ensureDB() {
	let db = readDB();
	if (!db) {
		db = {
			products: [],
			categories: [],
			orders: [],
			customers: [],
			admins: [{ id: 1, email: 'admin@a24.com', password: 'admin123', role: 'superadmin' }]
		};
		writeDB(db);
	}
	return db;
}

function genId() { return Date.now() + Math.floor(Math.random()*1000); }

export async function loginAdmin(email, password) {
	const db = ensureDB();
	const admin = db.admins.find(a => a.email === email && a.password === password);
	if (!admin) throw new Error('Invalid credentials');
	return { message: 'ok', role: admin.role };
}

export async function fetchProducts(q = '') {
	const db = ensureDB();
	let items = db.products || [];
	if (q) items = items.filter(p => (p.name||'').toLowerCase().includes(q.toLowerCase()) || (p.brand||'').toLowerCase().includes(q.toLowerCase()));
	return { total: items.length, data: items };
}

export async function createProduct(payload) {
	const db = ensureDB();
	const product = { id: genId(), ...payload };
	db.products.push(product);
	writeDB(db);
	return product;
}

export async function updateProduct(id, payload) {
	const db = ensureDB();
	const idx = db.products.findIndex(p => String(p.id) === String(id));
	if (idx === -1) throw new Error('Not found');
	db.products[idx] = { ...db.products[idx], ...payload };
	writeDB(db);
	return db.products[idx];
}

export async function deleteProduct(id) {
	const db = ensureDB();
	const idx = db.products.findIndex(p => String(p.id) === String(id));
	if (idx === -1) throw new Error('Not found');
	const removed = db.products.splice(idx,1)[0];
	writeDB(db);
	return removed;
}

export async function dashboardOverview() {
	const db = ensureDB();
	const products = db.products || [];
	const orders = db.orders || [];
	const customers = db.customers || [];
	const totalProducts = products.length;
	const totalOrders = orders.length;
	const totalCustomers = customers.length;
	const lowStock = products.filter(p => (p.stock||0) <= (p.lowStockThreshold||5));
	const outOfStock = products.filter(p => (p.stock||0) === 0);
	const totalSales = orders.reduce((s,o)=>s+(o.total||0),0);
	return { totalProducts, totalOrders, totalCustomers, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length, totalSales };
}

export async function fetchCategories() { const db = ensureDB(); return db.categories || []; }
export async function createCategory(payload) { const db = ensureDB(); const cat = { id: genId(), ...payload }; db.categories.push(cat); writeDB(db); return cat; }

export default { loginAdmin, fetchProducts, createProduct, updateProduct, deleteProduct, dashboardOverview, fetchCategories, createCategory };
