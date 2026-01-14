const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('数据库连接错误:', err.message);
    } else {
        console.log('已连接到SQLite数据库');
        initializeDatabase();
    }
});

// 初始化数据库表
function initializeDatabase() {
    // 创建用户表（仅邮箱登录/注册）
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        password TEXT NOT NULL,
        username TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
    )`, (err) => {
        if (err) {
            console.error('创建用户表错误:', err.message);
        } else {
            console.log('用户表已就绪');
            // 注意：历史版本可能已存在 phone 字段，这里不再依赖它，也不再尝试迁移
        }
    });

    // 创建文件表
    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('创建文件表错误:', err.message);
        } else {
            console.log('文件表已就绪');
        }
    });
}

// 数据库操作的Promise包装
db.serialize = function(callback) {
    callback();
};

// 导出数据库连接
module.exports = db;
