
// 系统提示词设置功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const prdSystemPrompt = document.getElementById('prdSystemPrompt');
    const uiSystemPrompt = document.getElementById('uiSystemPrompt');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    
    // 默认提示词
    const defaultPrompts = {
        prd: "你是一位资深的产品经理。",
        ui: "你是一位专业的UI设计师。"
    };
    
    // 初始化设置按钮点击事件
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            // 显示模态框前加载当前设置
            loadSettings();
            
            // 显示模态框
            const modal = new bootstrap.Modal(settingsModal);
            modal.show();
        });
    }
    
    // 保存设置
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            saveSettings();
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(settingsModal);
            modal.hide();
            
            // 显示保存成功提示
            showToast('设置已保存');
        });
    }
    
    // 重置设置
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', function() {
            resetSettings();
        });
    }
    
    // 加载设置
    function loadSettings() {
        // 从localStorage获取设置，如果没有则使用默认值
        const settings = JSON.parse(localStorage.getItem('systemPrompts')) || defaultPrompts;
        
        // 填充表单
        prdSystemPrompt.value = settings.prd || defaultPrompts.prd;
        uiSystemPrompt.value = settings.ui || defaultPrompts.ui;
    }
    
    // 保存设置
    function saveSettings() {
        // 获取表单值
        const settings = {
            prd: prdSystemPrompt.value,
            ui: uiSystemPrompt.value
        };
        
        // 保存到localStorage
        localStorage.setItem('systemPrompts', JSON.stringify(settings));
    }
    
    // 重置设置
    function resetSettings() {
        // 填充默认值
        prdSystemPrompt.value = defaultPrompts.prd;
        uiSystemPrompt.value = defaultPrompts.ui;
        
        // 保存默认设置
        localStorage.setItem('systemPrompts', JSON.stringify(defaultPrompts));
        
        // 显示重置成功提示
        showToast('设置已重置为默认值');
    }
    
    // 显示提示消息
    function showToast(message) {
        // 创建toast元素
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.innerHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">系统提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        // 添加到文档
        document.body.appendChild(toastContainer);
        
        // 显示toast
        const toastElement = toastContainer.querySelector('.toast');
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // toast隐藏后移除元素
        toastElement.addEventListener('hidden.bs.toast', function() {
            document.body.removeChild(toastContainer);
        });
    }
    
    // 导出获取系统提示词的函数
    window.getSystemPrompt = function(type) {
        const settings = JSON.parse(localStorage.getItem('systemPrompts')) || defaultPrompts;
        return type === 'prd' ? settings.prd : settings.ui;
    };
});
