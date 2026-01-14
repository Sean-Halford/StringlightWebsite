const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT认证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: '访问被拒绝，未提供令牌' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: '令牌无效或已过期' 
            });
        }
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };
