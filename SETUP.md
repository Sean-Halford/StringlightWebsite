# Stringlight 网站后端系统设置指南

## 快速开始

### ⚠️ 重要提示

**必须在 `server` 目录下运行 `npm start`**，不要在项目根目录或其他目录下运行。

如果看到错误：
```
npm error path /usr/share/nginx/package.json
npm error enoent Could not read package.json
```

说明您在错误的目录下运行了命令。请先切换到 `server` 目录。

### 1. 安装后端依赖

进入 `server` 目录并安装依赖：

```bash
# 首先确认当前目录
pwd  # 应该显示项目根目录路径

# 进入 server 目录
cd server

# 确认在正确目录（应该能看到 package.json）
ls   # 应该看到 package.json, server.js 等文件

# ⚠️ 重要：必须先安装依赖！
npm install

# 如果安装很慢，可以使用国内镜像：
# npm install --registry=https://registry.npmmirror.com

# 验证安装（应该能看到 node_modules 目录）
ls node_modules
```

**注意**：如果直接运行 `npm start` 报错 `Cannot find module 'express'`，说明依赖没有安装，必须先运行 `npm install`。

### 2. 配置环境变量

在 `server` 目录下创建 `.env` 文件（如果还没有）：

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

**重要提示**：生产环境请修改 `JWT_SECRET` 为一个强随机密钥。

### 3. 启动后端服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 4. 前端配置

前端代码已经配置为连接到 `http://localhost:3000/api`。如果需要修改API地址，请编辑 `js/api.js` 文件中的 `API_BASE_URL` 变量。

### 5. 测试API

可以使用以下工具测试API：

#### 使用 curl 测试注册：
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"测试用户"}'
```

#### 使用 curl 测试登录：
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 功能说明

### 用户认证
- ✅ 用户注册（邮箱、密码）
- ✅ 用户登录（JWT令牌认证）
- ✅ 获取当前用户信息

### 文件管理
- ✅ 上传文件（需要登录）
- ✅ 查看文件列表（需要登录）
- ✅ 下载文件（需要登录）
- ✅ 删除文件（需要登录）

## 数据库

系统使用 SQLite 数据库，数据库文件会自动创建在 `server/database.sqlite`。

数据库包含两个表：
- `users` - 用户信息
- `files` - 文件信息

## 文件存储

上传的文件存储在 `server/uploads` 目录中。

## 注意事项

1. **CORS配置**：后端已配置允许跨域请求，适用于开发环境
2. **文件大小限制**：默认最大文件大小为 10MB（可在 `.env` 中配置）
3. **安全性**：
   - 密码使用 bcrypt 加密存储
   - JWT令牌有效期7天
   - 文件只能被上传者访问和删除

## 故障排除

### 端口已被占用
如果端口3000已被占用，可以在 `.env` 文件中修改 `PORT` 变量。

### 数据库错误
如果遇到数据库错误，可以删除 `server/database.sqlite` 文件，服务器会在启动时重新创建数据库。

### 文件上传失败
- 检查 `server/uploads` 目录是否存在且有写入权限
- 检查文件大小是否超过限制（默认10MB）

## API文档

详细的API文档请参考 `server/README.md`。
