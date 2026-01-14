const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：时间戳-原始文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// 文件过滤器（可选：限制文件类型）
const fileFilter = (req, file, cb) => {
    // 允许所有文件类型，可以根据需要限制
    cb(null, true);
};

// 配置multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 默认10MB
    },
    fileFilter: fileFilter
});

// 上传文件（需要认证）
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的文件'
            });
        }

        const userId = req.user.userId;
        const { filename, originalname, path: filePath, size, mimetype } = req.file;

        // 保存文件信息到数据库
        db.run(
            `INSERT INTO files (user_id, filename, original_filename, file_path, file_size, mime_type) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, filename, originalname, filePath, size, mimetype],
            function(err) {
                if (err) {
                    // 如果数据库保存失败，删除已上传的文件
                    fs.unlinkSync(filePath);
                    return res.status(500).json({
                        success: false,
                        message: '文件上传失败'
                    });
                }

                res.json({
                    success: true,
                    message: '文件上传成功',
                    file: {
                        id: this.lastID,
                        filename: filename,
                        original_filename: originalname,
                        file_size: size,
                        mime_type: mimetype,
                        uploaded_at: new Date().toISOString()
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '文件上传失败'
        });
    }
});

// 获取用户的所有文件列表（需要认证）
router.get('/list', authenticateToken, (req, res) => {
    const userId = req.user.userId;

    db.all(
        'SELECT id, filename, original_filename, file_size, mime_type, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC',
        [userId],
        (err, files) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: '获取文件列表失败'
                });
            }

            res.json({
                success: true,
                files: files
            });
        }
    );
});

// 下载文件（需要认证）
router.get('/download/:fileId', authenticateToken, (req, res) => {
    const fileId = req.params.fileId;
    const userId = req.user.userId;

    // 查找文件信息
    db.get(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId],
        (err, file) => {
            if (err || !file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在或无权限访问'
                });
            }

            const filePath = file.file_path;

            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在'
                });
            }

            // 设置响应头并发送文件
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_filename)}"`);
            res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
            res.sendFile(path.resolve(filePath));
        }
    );
});

// 删除文件（需要认证）
router.delete('/delete/:fileId', authenticateToken, (req, res) => {
    const fileId = req.params.fileId;
    const userId = req.user.userId;

    // 查找文件信息
    db.get(
        'SELECT * FROM files WHERE id = ? AND user_id = ?',
        [fileId, userId],
        (err, file) => {
            if (err || !file) {
                return res.status(404).json({
                    success: false,
                    message: '文件不存在或无权限访问'
                });
            }

            const filePath = file.file_path;

            // 从数据库删除记录
            db.run('DELETE FROM files WHERE id = ?', [fileId], (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: '删除文件失败'
                    });
                }

                // 删除物理文件
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }

                res.json({
                    success: true,
                    message: '文件删除成功'
                });
            });
        }
    );
});

module.exports = router;
