const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 静态文件服务（可选：如果需要直接提供上传的文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API文档:`);
    console.log(`  - 健康检查: GET /api/health`);
    console.log(`  - 用户注册: POST /api/auth/register`);
    console.log(`  - 用户登录: POST /api/auth/login`);
    console.log(`  - 获取用户信息: GET /api/auth/me`);
    console.log(`  - 上传文件: POST /api/files/upload`);
    console.log(`  - 文件列表: GET /api/files/list`);
    console.log(`  - 下载文件: GET /api/files/download/:fileId`);
    console.log(`  - 删除文件: DELETE /api/files/delete/:fileId`);
});
