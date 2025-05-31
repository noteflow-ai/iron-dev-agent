// 系统提示词设置功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    
    // 获取所有提示词文本区域
    const prdSystemPrompt = document.getElementById('prdSystemPrompt');
    const uiSystemPrompt = document.getElementById('uiSystemPrompt');
    const apiSystemPrompt = document.getElementById('apiSystemPrompt');
    const codeSystemPrompt = document.getElementById('codeSystemPrompt');
    const testSystemPrompt = document.getElementById('testSystemPrompt');
    const deploySystemPrompt = document.getElementById('deploySystemPrompt');
    
    // 默认提示词
    const defaultPrompts = {
        prd: "你是一位资深的产品经理，擅长将用户需求转化为清晰的PRD文档。请根据用户的描述，生成一份详细的产品需求文档(PRD)。",
        ui: "你是一位专业的UI设计师和前端开发者，擅长将PRD文档转化为可交互的UI原型。请根据用户的需求，生成一个完整的HTML界面原型。",
        api: "你是一位经验丰富的API设计师，擅长设计RESTful API和GraphQL API。请根据PRD文档，设计一套完整的API接口。",
        code: "你是一位全栈开发工程师，擅长前端和后端开发。请根据API文档和UI设计，实现相应的代码。",
        test: "你是一位测试专家，擅长编写各类测试用例。请根据代码实现和PRD文档，编写全面的测试计划。",
        deploy: "你是一位DevOps工程师，擅长设计部署方案。请根据代码实现和测试计划，设计一套完整的部署方案。"
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
            
            // 显示重置成功提示
            showToast('设置已重置为默认值');
        });
    }
    
    // 加载设置
    function loadSettings() {
        // 从localStorage获取设置，如果没有则使用默认值
        const settings = JSON.parse(localStorage.getItem('systemPrompts')) || {};
        
        // 填充表单
        if (prdSystemPrompt) prdSystemPrompt.value = settings.prd || defaultPrompts.prd;
        if (uiSystemPrompt) uiSystemPrompt.value = settings.ui || defaultPrompts.ui;
        if (apiSystemPrompt) apiSystemPrompt.value = settings.api || defaultPrompts.api;
        if (codeSystemPrompt) codeSystemPrompt.value = settings.code || defaultPrompts.code;
        if (testSystemPrompt) testSystemPrompt.value = settings.test || defaultPrompts.test;
        if (deploySystemPrompt) deploySystemPrompt.value = settings.deploy || defaultPrompts.deploy;
    }
    
    // 保存设置
    function saveSettings() {
        // 获取表单值
        const settings = {
            prd: prdSystemPrompt ? prdSystemPrompt.value : defaultPrompts.prd,
            ui: uiSystemPrompt ? uiSystemPrompt.value : defaultPrompts.ui,
            api: apiSystemPrompt ? apiSystemPrompt.value : defaultPrompts.api,
            code: codeSystemPrompt ? codeSystemPrompt.value : defaultPrompts.code,
            test: testSystemPrompt ? testSystemPrompt.value : defaultPrompts.test,
            deploy: deploySystemPrompt ? deploySystemPrompt.value : defaultPrompts.deploy
        };
        
        // 保存到localStorage
        localStorage.setItem('systemPrompts', JSON.stringify(settings));
    }
    
    // 重置设置
    function resetSettings() {
        // 填充默认值
        if (prdSystemPrompt) prdSystemPrompt.value = defaultPrompts.prd;
        if (uiSystemPrompt) uiSystemPrompt.value = defaultPrompts.ui;
        if (apiSystemPrompt) apiSystemPrompt.value = defaultPrompts.api;
        if (codeSystemPrompt) codeSystemPrompt.value = defaultPrompts.code;
        if (testSystemPrompt) testSystemPrompt.value = defaultPrompts.test;
        if (deploySystemPrompt) deploySystemPrompt.value = defaultPrompts.deploy;
        
        // 保存默认设置
        localStorage.setItem('systemPrompts', JSON.stringify(defaultPrompts));
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
        
        switch (type) {
            case 'prd':
                return settings.prd || defaultPrompts.prd;
            case 'ui':
                return settings.ui || defaultPrompts.ui;
            case 'api':
                return settings.api || defaultPrompts.api;
            case 'code':
                return settings.code || defaultPrompts.code;
            case 'test':
                return settings.test || defaultPrompts.test;
            case 'deploy':
                return settings.deploy || defaultPrompts.deploy;
            default:
                return null;
        }
    };
    
    // 导出保存、加载和重置函数，供其他模块使用
    window.saveSettings = saveSettings;
    window.loadSettings = loadSettings;
    window.resetSettings = resetSettings;
});
