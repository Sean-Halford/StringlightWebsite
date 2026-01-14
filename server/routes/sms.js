const express = require('express');
const router = express.Router();
const db = require('../config/database');
require('dotenv').config();

// 验证码存储（实际生产环境应使用Redis等）
const verificationCodes = new Map();

// 生成6位随机验证码
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码（支持模拟和真实短信服务）
router.post('/send-code', async (req, res) => {
    try {
        const { phone } = req.body;

        // 验证手机号格式（+86，11位数字）
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '请输入正确的11位手机号码'
            });
        }

        // 检查手机号是否已被注册
        db.get('SELECT id FROM users WHERE phone = ?', [phone], (err, user) => {
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

            // 检查是否在60秒内已发送过验证码
            const existingCode = verificationCodes.get(phone);
            if (existingCode && Date.now() - existingCode.timestamp < 60000) {
                const remainingSeconds = Math.ceil((60000 - (Date.now() - existingCode.timestamp)) / 1000);
                return res.status(400).json({
                    success: false,
                    message: `验证码已发送，请${remainingSeconds}秒后再试`
                });
            }

            // 生成验证码
            const code = generateCode();
            const timestamp = Date.now();

            // 存储验证码（5分钟有效期）
            verificationCodes.set(phone, {
                code: code,
                timestamp: timestamp,
                attempts: 0 // 验证尝试次数
            });

            // 5分钟后自动删除验证码
            setTimeout(() => {
                verificationCodes.delete(phone);
            }, 5 * 60 * 1000);

            // 发送验证码（开发环境使用模拟，生产环境可集成真实短信服务）
            const isProduction = process.env.NODE_ENV === 'production';
            const useRealSMS = process.env.USE_REAL_SMS === 'true';

            if (useRealSMS && isProduction) {
                // TODO: 集成真实的短信服务（如阿里云、腾讯云等）
                // 示例：await sendSMS(phone, code);
                console.log(`[生产环境] 发送验证码到 ${phone}: ${code}`);
            } else {
                // 开发环境：在控制台输出验证码（方便测试）
                console.log(`[开发环境] 验证码: ${code} (手机号: ${phone})`);
                console.log('提示：在生产环境中，验证码将通过短信发送');
            }

            res.json({
                success: true,
                message: '验证码已发送',
                // 开发环境返回验证码（仅用于测试）
                ...(process.env.NODE_ENV !== 'production' && { code: code })
            });
        });
    } catch (error) {
        console.error('发送验证码错误:', error);
        res.status(500).json({
            success: false,
            message: '发送验证码失败，请稍后重试'
        });
    }
});

// 验证验证码
function verifyCode(phone, code) {
    const stored = verificationCodes.get(phone);
    
    if (!stored) {
        return { valid: false, message: '验证码不存在或已过期' };
    }

    // 检查是否超过5分钟
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
        verificationCodes.delete(phone);
        return { valid: false, message: '验证码已过期，请重新获取' };
    }

    // 检查尝试次数（防止暴力破解）
    if (stored.attempts >= 5) {
        verificationCodes.delete(phone);
        return { valid: false, message: '验证码错误次数过多，请重新获取' };
    }

    // 验证验证码
    if (stored.code !== code) {
        stored.attempts++;
        return { valid: false, message: '验证码错误' };
    }

    // 验证成功，删除验证码（一次性使用）
    verificationCodes.delete(phone);
    return { valid: true };
}

module.exports = { router, verifyCode };
