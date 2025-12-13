// js/auth.js

// 1. 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// 检查 localStorage 中是否有用户信息
function checkLoginStatus() {
    const currentUser = localStorage.getItem('stringlight_user');
    const loginItem = document.getElementById('loginItem');
    const userProfile = document.getElementById('userProfile');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    // 确保页面上存在这些元素（防止报错）
    if (!loginItem || !userProfile) return;

    if (currentUser) {
        // 已登录状态
        loginItem.style.display = 'none';
        userProfile.style.display = 'flex';
        if (userEmailDisplay) {
            // 显示用户名的前两个字符
            userEmailDisplay.innerText = currentUser.substring(0, 2).toUpperCase(); 
        }
    } else {
        // 未登录状态
        loginItem.style.display = 'block'; // 或者 'flex' 取决于你的CSS
        userProfile.style.display = 'none';
    }
}

// 2. 处理登录提交
function handleLogin(event) {
    event.preventDefault(); // 阻止表单跳转

    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    // 简单模拟验证 (实际项目中这里会请求后端接口)
    if (emailInput && passwordInput) {
        // 将用户信息存入浏览器缓存 (持久化)
        localStorage.setItem('stringlight_user', emailInput);

        // 模拟加载效果
        const btn = document.querySelector('.submit-btn');
        btn.innerText = '登录中...';

        setTimeout(() => {
            alert('登录成功！欢迎回来，' + emailInput);
            
            // 关闭弹窗
            document.getElementById('loginModal').style.display = 'none';
            
            // 刷新页面状态
            checkLoginStatus();
            
            // 还原按钮文字
            btn.innerText = '立即登录';
        }, 800);
    } else {
        alert('请输入账号和密码');
    }
}

// 3. 处理登出
function handleLogout() {
    if(confirm("确定要退出登录吗？")) {
        // 清除缓存
        localStorage.removeItem('stringlight_user');
        // 刷新状态
        checkLoginStatus();
        // 或者是 location.reload(); 来强制刷新页面
    }
}

// 通用：打开弹窗
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

// 通用：关闭弹窗
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}