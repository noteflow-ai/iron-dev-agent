// 认证相关功能
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在登录页面
    const isLoginPage = window.location.pathname.includes('login.html');
    
    // 如果不是登录页面，检查登录状态
    if (!isLoginPage) {
        checkLoginStatus();
    }
    
    // 添加登出功能
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
});

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');
    
    if (!isLoggedIn) {
        // 未登录，重定向到登录页面
        window.location.href = 'login.html';
        return;
    }
    
    // 已登录，设置Authorization头部
    setupAuthHeader(username, 'chuyi.123456');
    
    // 显示用户信息
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement && username) {
        userInfoElement.textContent = username;
    }
}

// 设置API请求的Authorization头部
function setupAuthHeader(username, password) {
    // 拦截所有fetch请求，添加Authorization头
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // 只为API请求添加认证头
        if (url.includes('/api/')) {
            if (!options.headers) {
                options.headers = {};
            }
            
            // 添加Basic认证头
            const base64Credentials = btoa(`${username}:${password}`);
            options.headers['Authorization'] = `Basic ${base64Credentials}`;
        }
        
        return originalFetch(url, options);
    };
}

// 登出功能
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}
