// API配置
const API_BASE_URL = 'http://localhost:3000/api';

// API请求工具函数
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('stringlight_token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 认证API
const authAPI = {
    // 用户注册（邮箱方式）
    register: async (email, password, username) => {
        return apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username })
        });
    },
    
    // 用户登录（仅邮箱）
    login: async (email, password) => {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    // 获取当前用户信息
    getCurrentUser: async () => {
        return apiRequest('/auth/me');
    }
};

// 文件API
const fileAPI = {
    // 上传文件
    upload: async (file) => {
        const token = localStorage.getItem('stringlight_token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '上传失败');
        }
        return data;
    },
    
    // 获取文件列表
    list: async () => {
        return apiRequest('/files/list');
    },
    
    // 下载文件
    download: async (fileId) => {
        const token = localStorage.getItem('stringlight_token');
        const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('下载失败');
        }

        // 获取文件名
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'download';
        if (contentDisposition) {
            const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (matches && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
                filename = decodeURIComponent(filename);
            }
        }

        // 创建下载链接
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },
    
    // 删除文件
    delete: async (fileId) => {
        return apiRequest(`/files/delete/${fileId}`, {
            method: 'DELETE'
        });
    }
};
