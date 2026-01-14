const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { verifyCode } = require('./sms');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// 用户注册（支持手机号+验证码和邮箱两种方式）
router.post('/register', async (req, res) => {
    try {
        const { phone, code, password, passwordConfirm, email, username } = req.body;

        // 手机号注册方式
        if (phone) {
            // 验证输入
            if (!phone || !code || !password || !passwordConfirm) {
                return res.status(400).json({
                    success: false,
                    message: '请填写完整信息'
                });
            }

            // 验证手机号格式
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: '请输入正确的11位手机号码'
                });
            }

            // 验证验证码
            const codeVerification = verifyCode(phone, code);
            if (!codeVerification.valid) {
                return res.status(400).json({
                    success: false,
                    message: codeVerification.message
                });
            }

            // 验证密码
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: '密码长度至少为6位'
                });
            }

            // 验证两次密码是否一致
            if (password !== passwordConfirm) {
                return res.status(400).json({
                    success: false,
                    message: '两次输入的密码不一致'
                });
            }

            // 检查手机号是否已存在
            db.get('SELECT id FROM users WHERE phone = ?', [phone], async (err, user) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: '服务器错误'
                    });
                }

                if (user) {
                    return res.status(400).json({
                        success: false,
                        message: '该手机号已被注册'
                    });
                }

                // 加密密码
                const hashedPassword = await bcrypt.hash(password, 10);

                // 插入新用户
                db.run(
                    'INSERT INTO users (phone, password, username) VALUES (?, ?, ?)',
                    [phone, hashedPassword, username || `用户${phone.slice(-4)}`],
                    function(err) {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: '注册失败，请稍后重试'
                            });
                        }

                        // 生成JWT令牌
                        const token = jwt.sign(
                            { userId: this.lastID, phone: phone },
                            JWT_SECRET,
                            { expiresIn: '7d' }
                        );

                        res.status(201).json({
                            success: true,
                            message: '注册成功',
                            token: token,
                            user: {
                                id: this.lastID,
                                phone: phone,
                                username: username || `用户${phone.slice(-4)}`
                            }
                        });
                    }
                );
            });
        } 
        // 邮箱注册方式（保留原有功能）
        else if (email) {
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
        } else {
            return res.status(400).json({
                success: false,
                message: '请提供手机号或邮箱'
            });
        }
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 用户登录（支持手机号和邮箱）
router.post('/login', (req, res) => {
    try {
        const { email, phone, password } = req.body;

        // 验证输入
        if (!password || (!email && !phone)) {
            return res.status(400).json({
                success: false,
                message: '请提供邮箱/手机号和密码'
            });
        }

        // 构建查询条件
        const query = phone ? 'SELECT * FROM users WHERE phone = ?' : 'SELECT * FROM users WHERE email = ?';
        const identifier = phone || email;

        // 查找用户
        db.get(query, [identifier], async (err, user) => {
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
            const tokenPayload = phone 
                ? { userId: user.id, phone: user.phone }
                : { userId: user.id, email: user.email };
            
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                success: true,
                message: '登录成功',
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
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
    db.get('SELECT id, email, phone, username, created_at FROM users WHERE id = ?', [req.user.userId], (err, user) => {
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
