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
                const identifier = response.user.email || '用户';
                if (userEmailDisplay) {
                    // 显示用户名的前两个字符
                    userEmailDisplay.innerText = identifier.substring(0, 2).toUpperCase();
                }
                // 保存用户信息
                localStorage.setItem('stringlight_user', identifier);
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
            const identifier = response.user.email || '用户';
            localStorage.setItem('stringlight_user', identifier);
            
            alert('登录成功！欢迎回来，' + identifier);
            
            // 关闭弹窗
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.style.display = 'none';
            }
            
            // 刷新页面状态
            await checkLoginStatus();
            
            // 清空表单
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
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

// 通用：打开登录弹窗
function openLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
}

// 通用：关闭登录弹窗
function closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'none';
    }
}

// 打开注册弹窗
function openRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.style.display = 'flex';
    }
}

// 关闭注册弹窗
function closeRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.style.display = 'none';
        // 清空表单
        const form = document.getElementById('registerForm');
        if (form) {
            form.reset();
        }
    }
}

// 处理注册提交
async function handleRegister(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const passwordConfirmInput = document.getElementById('registerPasswordConfirm');
    const submitBtn = document.querySelector('#registerForm .submit-btn');
    
    if (!emailInput || !passwordInput || !passwordConfirmInput) return;
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    
    // 验证输入
    if (!email || !password || !passwordConfirm) {
        alert('请填写完整信息');
        return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('请输入正确的邮箱地址');
        emailInput.focus();
        return;
    }
    
    // 验证密码
    if (password.length < 6) {
        alert('密码长度至少为6位');
        passwordInput.focus();
        return;
    }
    
    // 验证两次密码是否一致
    if (password !== passwordConfirm) {
        alert('两次输入的密码不一致');
        passwordConfirmInput.focus();
        return;
    }
    
    // 禁用提交按钮
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = '注册中...';
    }
    
    try {
        const response = await authAPI.register(email, password);
        
        if (response.success) {
            // 保存token和用户信息
            localStorage.setItem('stringlight_token', response.token);
            localStorage.setItem('stringlight_user', response.user.email || email);
            
            alert('注册成功！欢迎加入 Stringlight');
            
            // 关闭注册弹窗
            closeRegisterModal();
            
            // 刷新页面状态
            await checkLoginStatus();
        }
    } catch (error) {
        alert(error.message || '注册失败，请稍后重试');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = '立即注册';
        }
    }
}