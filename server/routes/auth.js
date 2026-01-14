const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// 用户注册（仅邮箱）
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供邮箱和密码'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: '邮箱格式不正确'
            });
        }

        // 验证密码长度
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少为6位'
            });
        }

        // 检查邮箱是否已存在
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '服务器错误'
                });
            }

            if (user) {
                return res.status(400).json({
                    success: false,
                    message: '该邮箱已被注册'
                });
            }

            // 加密密码
            const hashedPassword = await bcrypt.hash(password, 10);

            // 插入新用户
            db.run(
                'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
                [email, hashedPassword, username || email.split('@')[0]],
                function(err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: '注册失败，请稍后重试'
                        });
                    }

                    // 生成JWT令牌
                    const token = jwt.sign(
                        { userId: this.lastID, email: email },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    res.status(201).json({
                        success: true,
                        message: '注册成功',
                        token: token,
                        user: {
                            id: this.lastID,
                            email: email,
                            username: username || email.split('@')[0]
                        }
                    });
                }
            );
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 用户登录（仅邮箱）
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供邮箱和密码'
            });
        }

        // 查找用户
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '服务器错误'
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: '账号或密码错误'
                });
            }

            // 验证密码
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    message: '账号或密码错误'
                });
            }

            // 生成JWT令牌
            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                success: true,
                message: '登录成功',
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 获取当前用户信息（需要认证）
router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
    db.get('SELECT id, email, username, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            user: user
        });
    });
});

module.exports = router;
