// js/auth.js
// 注意：此文件依赖于 js/api.js

// 1. 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// 检查登录状态
async function checkLoginStatus() {
    const token = localStorage.getItem('stringlight_token');
    const loginItem = document.getElementById('loginItem');
    const userProfile = document.getElementById('userProfile');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    // 确保页面上存在这些元素（防止报错）
    if (!loginItem || !userProfile) return;

    if (token) {
        try {
            // 验证token是否有效
            const response = await authAPI.getCurrentUser();
            if (response.success) {
                // 已登录状态
                loginItem.style.display = 'none';
                userProfile.style.display = 'flex';
                const email = response.user.email;
                if (userEmailDisplay) {
                    // 显示用户名的前两个字符
                    userEmailDisplay.innerText = email.substring(0, 2).toUpperCase();
                }
                // 保存用户信息
                localStorage.setItem('stringlight_user', email);
            } else {
                // token无效，清除
                localStorage.removeItem('stringlight_token');
                localStorage.removeItem('stringlight_user');
                loginItem.style.display = 'block';
                userProfile.style.display = 'none';
            }
        } catch (error) {
            // token无效或过期，清除
            console.error('验证登录状态失败:', error);
            localStorage.removeItem('stringlight_token');
            localStorage.removeItem('stringlight_user');
            loginItem.style.display = 'block';
            userProfile.style.display = 'none';
        }
    } else {
        // 未登录状态
        loginItem.style.display = 'block';
        userProfile.style.display = 'none';
    }
}

// 2. 处理登录提交
async function handleLogin(event) {
    event.preventDefault(); // 阻止表单跳转

    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value;

    if (!emailInput || !passwordInput) {
        alert('请输入邮箱和密码');
        return;
    }

    const btn = document.querySelector('#loginForm .submit-btn');
    const originalText = btn ? btn.innerText : '立即登录';
    
    if (btn) {
        btn.innerText = '登录中...';
        btn.disabled = true;
    }

    try {
        const response = await authAPI.login(emailInput, passwordInput);
        
        if (response.success) {
            // 保存token和用户信息
            localStorage.setItem('stringlight_token', response.token);
            localStorage.setItem('stringlight_user', response.user.email);
            
            alert('登录成功！欢迎回来，' + response.user.email);
            
            // 关闭弹窗
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
            
            // 刷新页面状态
            await checkLoginStatus();
            
            // 清空表单
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        }
    } catch (error) {
        alert(error.message || '登录失败，请检查邮箱和密码');
    } finally {
        if (btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

// 3. 处理登出
function handleLogout() {
    if(confirm("确定要退出登录吗？")) {
        // 清除缓存
        localStorage.removeItem('stringlight_token');
        localStorage.removeItem('stringlight_user');
        // 刷新状态
        checkLoginStatus();
    }
}

// 通用：打开弹窗
function openLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
}

// 通用：关闭弹窗
function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
}