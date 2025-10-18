const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, '..', 'public')));

// APIルート
app.use('/api/customers', customerRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// フロントエンドのルート
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// データベース初期化してからサーバー起動
async function startServer() {
    try {
        await db.initDatabase();

        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║   顧客管理システム - サーバー起動中       ║
╚════════════════════════════════════════════╝

🚀 Server is running on http://localhost:${PORT}
📊 Database: SQLite (customers.db)
🔗 API Endpoint: http://localhost:${PORT}/api/customers

ブラウザで http://localhost:${PORT} を開いてください
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
