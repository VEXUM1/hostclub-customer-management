const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// データベースファイルのパス
const dbPath = path.join(__dirname, '..', 'customers.db');

let db = null;
let SQL = null;

// データベースの初期化
async function initDatabase() {
    SQL = await initSqlJs();

    // 既存のデータベースファイルがあれば読み込む
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // テーブル作成
    db.run(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            id_number INTEGER,
            data TEXT NOT NULL,
            ai_insights TEXT,
            registered_at TEXT NOT NULL,
            updated_at TEXT,
            created_timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // データベースをファイルに保存
    saveDatabase();

    console.log('Database initialized successfully');
}

// データベースをファイルに保存
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// 顧客データの取得
function getAllCustomers() {
    const stmt = db.prepare('SELECT * FROM customers ORDER BY created_timestamp DESC');
    const customers = [];

    while (stmt.step()) {
        customers.push(stmt.getAsObject());
    }

    stmt.free();
    return customers;
}

// 顧客データの検索
function searchCustomers(searchTerm) {
    const stmt = db.prepare(`
        SELECT * FROM customers
        WHERE name LIKE ? OR data LIKE ?
        ORDER BY created_timestamp DESC
    `);

    const term = `%${searchTerm}%`;
    stmt.bind([term, term]);

    const customers = [];
    while (stmt.step()) {
        customers.push(stmt.getAsObject());
    }

    stmt.free();
    return customers;
}

// 顧客データの追加
function addCustomer(customer) {
    const stmt = db.prepare(`
        INSERT INTO customers (name, id_number, data, ai_insights, registered_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
        customer.name,
        customer.idNumber || null,
        JSON.stringify(customer.data),
        customer.aiInsights || null,
        customer.registeredAt,
        customer.updatedAt || null
    ]);

    stmt.free();

    // 最後に挿入されたIDを取得
    const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
    lastIdStmt.step();
    const result = lastIdStmt.getAsObject();
    lastIdStmt.free();

    saveDatabase();
    return result.id;
}

// 顧客データの更新
function updateCustomer(id, customer) {
    const stmt = db.prepare(`
        UPDATE customers
        SET name = ?, id_number = ?, data = ?, ai_insights = ?, updated_at = ?
        WHERE id = ?
    `);

    stmt.run([
        customer.name,
        customer.idNumber || null,
        JSON.stringify(customer.data),
        customer.aiInsights || null,
        customer.updatedAt,
        id
    ]);

    const changes = db.getRowsModified();
    stmt.free();

    saveDatabase();
    return changes > 0;
}

// 顧客データの削除
function deleteCustomer(id) {
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run([id]);

    const changes = db.getRowsModified();
    stmt.free();

    saveDatabase();
    return changes > 0;
}

// 同名の顧客を検索
function findCustomersByName(name) {
    const stmt = db.prepare('SELECT * FROM customers WHERE name = ?');
    stmt.bind([name]);

    const customers = [];
    while (stmt.step()) {
        customers.push(stmt.getAsObject());
    }

    stmt.free();
    return customers;
}

// 設定の保存
function saveSetting(key, value) {
    const now = new Date().toLocaleString('ja-JP');

    // まず既存のレコードを削除
    const deleteStmt = db.prepare('DELETE FROM settings WHERE key = ?');
    deleteStmt.run([key]);
    deleteStmt.free();

    // 新しいレコードを挿入
    const insertStmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, ?)
    `);

    insertStmt.run([key, value, now]);
    insertStmt.free();

    saveDatabase();
}

// 設定の取得
function getSetting(key) {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind([key]);

    let result = null;
    if (stmt.step()) {
        result = stmt.getAsObject().value;
    }

    stmt.free();
    return result;
}

module.exports = {
    initDatabase,
    getAllCustomers,
    searchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomersByName,
    saveSetting,
    getSetting
};
