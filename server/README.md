# Stringlight 后端API服务器

## 功能特性

- ✅ 用户注册和登录（JWT认证）
- ✅ 文件上传
- ✅ 文件下载
- ✅ 文件列表查看
- ✅ 文件删除

## 技术栈

- Node.js + Express
- SQLite 数据库
- JWT 身份认证
- Multer 文件上传
- bcryptjs 密码加密

## 安装和运行

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改JWT密钥等配置。

### 3. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将运行在 `http://localhost:3000`

## API 接口文档

### 认证接口

#### 用户注册
- **URL**: `POST /api/auth/register`
- **请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名（可选）"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "token": "JWT令牌",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "用户名"
  }
}
```

#### 用户登录
- **URL**: `POST /api/auth/login`
- **请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "token": "JWT令牌",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "用户名"
  }
}
```

#### 获取当前用户信息
- **URL**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **响应**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "用户名",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### 文件接口

#### 上传文件
- **URL**: `POST /api/files/upload`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **请求体**: FormData，字段名：`file`
- **响应**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "file": {
    "id": 1,
    "filename": "1234567890-文件名.jpg",
    "original_filename": "文件名.jpg",
    "file_size": 102400,
    "mime_type": "image/jpeg",
    "uploaded_at": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 获取文件列表
- **URL**: `GET /api/files/list`
- **Headers**: `Authorization: Bearer <token>`
- **响应**:
```json
{
  "success": true,
  "files": [
    {
      "id": 1,
      "filename": "1234567890-文件名.jpg",
      "original_filename": "文件名.jpg",
      "file_size": 102400,
      "mime_type": "image/jpeg",
      "uploaded_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 下载文件
- **URL**: `GET /api/files/download/:fileId`
- **Headers**: `Authorization: Bearer <token>`
- **响应**: 文件流

#### 删除文件
- **URL**: `DELETE /api/files/delete/:fileId`
- **Headers**: `Authorization: Bearer <token>`
- **响应**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## 数据库结构

### users 表
- id: 主键
- email: 邮箱（唯一）
- password: 加密后的密码
- username: 用户名
- created_at: 创建时间
- updated_at: 更新时间

### files 表
- id: 主键
- user_id: 用户ID（外键）
- filename: 存储的文件名
- original_filename: 原始文件名
- file_path: 文件路径
- file_size: 文件大小（字节）
- mime_type: 文件MIME类型
- uploaded_at: 上传时间

## 安全注意事项

1. 生产环境请修改 `.env` 中的 `JWT_SECRET` 为强密钥
2. 建议添加HTTPS支持
3. 可以根据需要添加文件类型限制
4. 建议添加文件大小限制（已在配置中设置）
5. 建议添加速率限制（rate limiting）
