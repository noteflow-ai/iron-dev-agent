// 确保页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化应用...');
    
    // 获取DOM元素
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const prdContent = document.getElementById('prdContent');
    const uiPreview = document.getElementById('uiPreview');
    const downloadPRD = document.getElementById('downloadPRD');
    const downloadUI = document.getElementById('downloadUI');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const chatSidebar = document.getElementById('chatSidebar');

    // 存储当前的PRD和UI内容以及项目ID
    window.currentPRD = '';
    window.currentUI = '';
    window.currentProjectId = '';
    
    console.log('初始化UI组件...');
    
    // 初始化滚动到底部按钮
    initScrollToBottomButton();
    
    // 初始化侧边栏切换按钮
    initToggleSidebarButton();
    
    // 不需要在这里调用loadProjects，因为在外部已经调用了

    // 注意：非流式API函数已移除，所有功能通过流式API函数提供

    // 发送消息
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // 添加用户消息到聊天区域
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = message;
        chatMessages.appendChild(userMessage);
        
        // 确保滚动到最新消息
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 清空输入框
        userInput.value = '';
        
        // 禁用发送按钮，防止重复提交
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
        
        // 使用流式API生成PRD
        callClaudeAPIStream(message, 'prd');
    }

    // 点击发送按钮
    sendBtn.addEventListener('click', sendMessage);
    
    // 按Enter键发送消息
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 下载PRD文档
    downloadPRD.addEventListener('click', function() {
        if (!currentPRD) return;
        downloadFile('PRD.md', currentPRD);
    });
    
    // 下载UI代码
    downloadUI.addEventListener('click', function() {
        if (!currentUI) return;
        downloadFile('UI.html', currentUI);
    });
    
    // 下载文件的辅助函数
    function downloadFile(filename, content) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    // 添加欢迎消息
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message bot-message';
    welcomeMessage.textContent = '欢迎使用端到端智能开发平台！我是Iron，请描述您的产品需求，我将帮您生成PRD文档和UI界面预览。';
    chatMessages.appendChild(welcomeMessage);
    
    // 确保滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 加载项目列表
    async function loadProjects() {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            
            if (data.success && data.projects.length > 0) {
                // 如果有项目，添加一个项目选择器
                const projectSelector = document.createElement('div');
                projectSelector.className = 'project-selector mt-3';
                projectSelector.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label for="projectSelect">选择现有项目：</label>
                        <button class="btn btn-sm btn-outline-danger" id="deleteProjectBtn" disabled>删除项目</button>
                    </div>
                    <select class="form-select" id="projectSelect">
                        <option value="">-- 新项目 --</option>
                        ${data.projects.map(p => `<option value="${p.id}">${new Date(p.createdAt).toLocaleString()}</option>`).join('')}
                    </select>
                `;
                
                // 添加到聊天区域上方
                const chatContainer = document.querySelector('.chat-container .card-header');
                chatContainer.insertAdjacentElement('afterend', projectSelector);
                
                // 添加项目选择事件
                document.getElementById('projectSelect').addEventListener('change', async function() {
                    const selectedProjectId = this.value;
                    const deleteBtn = document.getElementById('deleteProjectBtn');
                    
                    // 清空当前内容，无论是选择新项目还是已有项目
                    window.currentPRD = '';
                    window.currentUI = '';
                    prdContent.innerHTML = '<p class="text-muted">请在左侧输入您的需求描述，AI将为您生成PRD文档...</p>';
                    uiPreview.srcdoc = '<p>请在左侧输入您的需求描述，AI将为您生成UI界面...</p>';
                    
                    // 清空生命周期内容
                    if (window.lifecycleContent) {
                        window.lifecycleContent = {
                            api: '',
                            code: {
                                frontend: '',
                                backend: '',
                                database: ''
                            },
                            test: {
                                unit: '',
                                integration: '',
                                e2e: ''
                            },
                            deploy: {
                                docker: '',
                                kubernetes: '',
                                serverless: ''
                            }
                        };
                    }
                    
                    // 更新所有标签页内容
                    updateAllTabsContent();
                    
                    if (selectedProjectId) {
                        // 如果选择了已有项目，加载项目内容
                        await loadProject(selectedProjectId);
                        deleteBtn.removeAttribute('disabled');
                    } else {
                        // 如果选择了新项目，重置项目ID
                        window.currentProjectId = '';
                        deleteBtn.setAttribute('disabled', 'disabled');
                        
                        // 添加新项目消息
                        const newProjectMessage = document.createElement('div');
                        newProjectMessage.className = 'message system-message';
                        newProjectMessage.textContent = `已创建新项目，请输入您的需求描述。`;
                        chatMessages.appendChild(newProjectMessage);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                });
                
                // 添加删除项目事件
                document.getElementById('deleteProjectBtn').addEventListener('click', async function() {
                    const projectSelect = document.getElementById('projectSelect');
                    const selectedProjectId = projectSelect.value;
                    
                    if (!selectedProjectId) return;
                    
                    if (confirm(`确定要删除项目 ${selectedProjectId} 吗？此操作不可撤销。`)) {
                        try {
                            const response = await fetch(`/api/projects/${selectedProjectId}`, {
                                method: 'DELETE'
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                // 从选择器中移除该项目
                                projectSelect.querySelector(`option[value="${selectedProjectId}"]`).remove();
                                
                                // 重置选择器和内容
                                projectSelect.value = '';
                                window.currentProjectId = '';
                                window.currentPRD = '';
                                window.currentUI = '';
                                prdContent.innerHTML = '<p class="text-muted">请在左侧输入您的需求描述，AI将为您生成PRD文档...</p>';
                                uiPreview.srcdoc = '<p>请在左侧输入您的需求描述，AI将为您生成UI界面...</p>';
                                
                                // 清空生命周期内容
                                if (window.lifecycleContent) {
                                    window.lifecycleContent = {
                                        api: '',
                                        code: {
                                            frontend: '',
                                            backend: '',
                                            database: ''
                                        },
                                        test: {
                                            unit: '',
                                            integration: '',
                                            e2e: ''
                                        },
                                        deploy: {
                                            docker: '',
                                            kubernetes: '',
                                            serverless: ''
                                        }
                                    };
                                }
                                
                                // 更新所有标签页内容
                                updateAllTabsContent();
                                
                                // 禁用删除按钮
                                this.setAttribute('disabled', 'disabled');
                                
                                // 添加删除成功消息
                                const deleteMessage = document.createElement('div');
                                deleteMessage.className = 'message system-message';
                                deleteMessage.textContent = `项目 ${selectedProjectId} 已成功删除。`;
                                chatMessages.appendChild(deleteMessage);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            } else {
                                alert(`删除失败: ${data.error}`);
                            }
                        } catch (error) {
                            console.error('Error deleting project:', error);
                            alert('删除项目时出错，请查看控制台了解详情。');
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }
    
    // 加载特定项目
    async function loadProject(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            const data = await response.json();
            
            if (data.success) {
                window.currentProjectId = projectId;
                
                if (data.project.prd) {
                    window.currentPRD = data.project.prd;
                    prdContent.innerHTML = marked.parse(data.project.prd);
                }
                
                if (data.project.ui) {
                    window.currentUI = data.project.ui;
                    uiPreview.srcdoc = data.project.ui;
                }
                
                // 尝试加载生命周期内容（如果有）
                try {
                    const lifecycleResponse = await fetch(`/api/projects/${projectId}/lifecycle`);
                    const lifecycleData = await lifecycleResponse.json();
                    
                    if (lifecycleData.success && lifecycleData.lifecycleContent) {
                        window.lifecycleContent = lifecycleData.lifecycleContent;
                    }
                } catch (lifecycleError) {
                    console.log('没有找到生命周期内容或格式不正确，使用默认空内容');
                    // 使用默认的空生命周期内容
                    window.lifecycleContent = {
                        api: '',
                        code: {
                            frontend: '',
                            backend: '',
                            database: ''
                        },
                        test: {
                            unit: '',
                            integration: '',
                            e2e: ''
                        },
                        deploy: {
                            docker: '',
                            kubernetes: '',
                            serverless: ''
                        }
                    };
                }
                
                // 更新所有标签页内容
                updateAllTabsContent();
                
                // 添加加载项目的消息
                const loadMessage = document.createElement('div');
                loadMessage.className = 'message system-message';
                loadMessage.textContent = `已加载项目 ${projectId}，您可以继续对其进行修改。`;
                chatMessages.appendChild(loadMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Error loading project:', error);
        }
    }
    
    // 更新所有标签页内容
    function updateAllTabsContent() {
        // 更新API标签页
        const apiContent = document.getElementById('apiContent');
        if (apiContent && window.lifecycleContent && window.lifecycleContent.api) {
            apiContent.innerHTML = marked.parse(window.lifecycleContent.api);
        } else if (apiContent) {
            apiContent.innerHTML = '<p class="text-muted">请先生成PRD文档，然后点击"生成API文档"按钮...</p>';
        }
        
        // 更新代码标签页
        const codeContent = document.getElementById('codeContent');
        const codeTypeSelector = document.getElementById('codeTypeSelector');
        if (codeContent && codeTypeSelector && window.lifecycleContent && window.lifecycleContent.code) {
            const codeType = codeTypeSelector.value;
            const code = window.lifecycleContent.code[codeType] || '// 请先生成PRD和API文档，然后点击"生成代码"按钮...';
            codeContent.innerHTML = `<pre class="code-preview"><code>${escapeHtml(code)}</code></pre>`;
        }
        
        // 更新测试标签页
        const testContent = document.getElementById('testContent');
        const testTypeSelector = document.getElementById('testTypeSelector');
        if (testContent && testTypeSelector && window.lifecycleContent && window.lifecycleContent.test) {
            const testType = testTypeSelector.value;
            const test = window.lifecycleContent.test[testType];
            if (test) {
                testContent.innerHTML = marked.parse(test);
            } else {
                testContent.innerHTML = '<p class="text-muted">请先生成代码，然后点击"生成测试"按钮...</p>';
            }
        }
        
        // 更新部署标签页
        const deployContent = document.getElementById('deployContent');
        const deployTypeSelector = document.getElementById('deployTypeSelector');
        if (deployContent && deployTypeSelector && window.lifecycleContent && window.lifecycleContent.deploy) {
            const deployType = deployTypeSelector.value;
            const deploy = window.lifecycleContent.deploy[deployType];
            if (deploy) {
                deployContent.innerHTML = marked.parse(deploy);
            } else {
                deployContent.innerHTML = '<p class="text-muted">请先生成代码和测试，然后点击"生成部署方案"按钮...</p>';
            }
        }
        
        // 更新项目编辑器文件树
        updateEditorFileTree();
        
        // 更新所有按钮状态
        updateAllButtonStates();
    }
    
    // 更新所有按钮状态
    function updateAllButtonStates() {
        // 更新UI生成按钮状态
        updateUIGenerationButton();
        
        // 更新生命周期按钮状态
        if (typeof window.updateButtonStates === 'function') {
            window.updateButtonStates();
        }
    }
    
    // 更新项目编辑器文件树
    function updateEditorFileTree() {
        // 检查编辑器是否已初始化
        if (typeof window.initFileTree === 'function') {
            console.log('更新项目编辑器文件树');
            window.initFileTree();
        } else {
            console.log('编辑器尚未初始化，将在激活标签页时更新文件树');
        }
    }
    
    // HTML转义函数
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // 调用加载项目列表函数
    loadProjects();
    
    // 初始化滚动到底部按钮
    function initScrollToBottomButton() {
        console.log('初始化滚动到底部按钮...');
        // 监听聊天消息区域的滚动事件
        chatMessages.addEventListener('scroll', function() {
            // 计算滚动位置
            const scrollPosition = chatMessages.scrollTop + chatMessages.clientHeight;
            const scrollHeight = chatMessages.scrollHeight;
            
            // 如果不在底部，显示滚动按钮
            if (scrollHeight - scrollPosition > 50) {
                scrollToBottomBtn.style.display = 'flex';
            } else {
                scrollToBottomBtn.style.display = 'none';
            }
        });
        
        // 点击滚动到底部按钮
        scrollToBottomBtn.addEventListener('click', function() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
    
    // 初始化侧边栏切换按钮
    function initToggleSidebarButton() {
        console.log('初始化侧边栏切换按钮...');
        
        // 获取固定按钮元素
        const sidebarToggleFixed = document.getElementById('sidebarToggleFixed');
        
        // 切换侧边栏状态的函数
        function toggleSidebar() {
            console.log('切换侧边栏状态');
            // 切换侧边栏的收起/展开状态
            chatSidebar.classList.toggle('collapsed');
            
            // 更新按钮状态
            const isCollapsed = chatSidebar.classList.contains('collapsed');
            
            // 保存当前状态到本地存储
            localStorage.setItem('sidebarCollapsed', isCollapsed);
            
            if (isCollapsed) {
                console.log('侧边栏已收起');
                // 确保固定按钮可见
                sidebarToggleFixed.style.display = 'flex';
            } else {
                console.log('侧边栏已展开');
                // 确保固定按钮隐藏
                sidebarToggleFixed.style.display = 'none';
            }
        }
        
        // 点击主切换按钮
        toggleSidebarBtn.addEventListener('click', function() {
            console.log('主侧边栏切换按钮被点击');
            toggleSidebar();
        });
        
        // 点击固定切换按钮
        sidebarToggleFixed.addEventListener('click', function() {
            console.log('固定侧边栏切换按钮被点击');
            toggleSidebar();
        });
        
        // 重置本地存储中的侧边栏状态，确保默认为展开状态
        localStorage.removeItem('sidebarCollapsed');
        console.log('重置侧边栏状态，确保默认为展开状态');
        
        // 确保侧边栏为展开状态
        chatSidebar.classList.remove('collapsed');
        // 确保固定按钮隐藏
        sidebarToggleFixed.style.display = 'none';
        console.log('侧边栏初始状态: 已展开');
        
        // 添加键盘快捷键支持
        document.addEventListener('keydown', function(e) {
            // Alt+S 切换侧边栏
            if (e.altKey && e.key === 's') {
                console.log('检测到快捷键: Alt+S');
                toggleSidebar();
                e.preventDefault();
            }
        });
    }
});
// 设备预览功能
document.addEventListener('DOMContentLoaded', function() {
    const viewportSelector = document.getElementById('viewportSelector');
    const uiPreview = document.getElementById('uiPreview');
    
    if (viewportSelector && uiPreview) {
        viewportSelector.addEventListener('change', function() {
            // 移除所有设备类名
            uiPreview.classList.remove('desktop', 'tablet', 'mobile');
            
            // 添加选中的设备类名
            const selectedDevice = this.value;
            uiPreview.classList.add(selectedDevice);
            
            // 保存用户选择
            localStorage.setItem('preferredViewport', selectedDevice);
        });
        
        // 加载用户之前的选择
        const savedViewport = localStorage.getItem('preferredViewport');
        if (savedViewport) {
            viewportSelector.value = savedViewport;
            uiPreview.classList.remove('desktop', 'tablet', 'mobile');
            uiPreview.classList.add(savedViewport);
        }
    }
});

// 初始化生成UI原型按钮
document.addEventListener('DOMContentLoaded', function() {
    const generateUIBtn = document.getElementById('generateUIBtn');
    
    if (generateUIBtn) {
        // 初始化按钮状态
        updateUIGenerationButton();
        
        generateUIBtn.addEventListener('click', function() {
            // 检查是否有PRD内容
            if (!window.currentPRD) {
                alert('请先生成PRD文档，然后再生成UI原型');
                return;
            }
            
            // 禁用按钮，防止重复点击
            generateUIBtn.disabled = true;
            generateUIBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
            
            // 禁用发送按钮，防止同时生成多个内容
            const sendBtn = document.getElementById('sendBtn');
            if (sendBtn) sendBtn.disabled = true;
            
            // 添加生成UI的消息
            const generatingUIMsg = document.createElement('div');
            generatingUIMsg.className = 'message bot-message';
            
            // 根据是否已有UI，显示不同的消息
            if (window.currentUI) {
                generatingUIMsg.textContent = '正在基于最新PRD更新UI原型...';
            } else {
                generatingUIMsg.textContent = '正在基于PRD生成UI原型...';
            }
            
            chatMessages.appendChild(generatingUIMsg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 显示加载动画
            uiPreview.srcdoc = `
                <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            flex-direction: column;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        }
                        .loading-text {
                            margin-top: 20px;
                            font-size: 1.2rem;
                            color: #4a6fdc;
                        }
                        .spinner-border {
                            width: 3rem;
                            height: 3rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div class="loading-text">正在生成UI原型，请稍候...</div>
                </body>
                </html>
            `;
            
            // 自动切换到UI预览标签
            document.getElementById('ui-tab').click();
            
            // 调用Artifacts API生成UI
            callClaudeArtifactAPIStream(window.currentPRD);
        });
    }
});

// 调用Claude Artifacts API生成UI原型 - 使用流式API
async function callClaudeArtifactAPIStream(prdContent) {
    // 获取系统提示词（如果有设置）
    const type = 'ui';
    const customSystemPrompt = window.getSystemPrompt ? window.getSystemPrompt(type) : null;
    try {
        // 设置SSE响应头
        const response = await fetch('/api/claude/artifact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                prompt: prdContent, 
                projectId: window.currentProjectId,
                previousContent: window.currentUI,
                systemPrompt: customSystemPrompt,
                type: type // 明确传递type参数到服务器
            }),
        });
        
        // 创建事件源
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 读取流
        let fullContent = '';
        let buffer = ''; // 用于存储不完整的JSON数据
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        // 添加到缓冲区
                        buffer += line.substring(6);
                        
                        try {
                            // 尝试解析完整的JSON
                            const data = JSON.parse(buffer);
                            
                            // 如果成功解析，处理数据并重置缓冲区
                            if (data.type === 'init') {
                                // 初始化项目ID
                                window.currentProjectId = data.projectId;
                            } else if (data.type === 'chunk') {
                                // 添加内容块
                                fullContent += data.content;
                                
                                // 更新预览区域，显示生成中的HTML代码
                                const previewHtml = `
                                <html>
                                <head>
                                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                                    <style>
                                        body { 
                                            padding: 20px; 
                                            font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; 
                                            white-space: pre-wrap;
                                            line-height: 1.5;
                                            font-size: 0.9rem;
                                            background-color: #f8f9fa;
                                        }
                                        .code-container {
                                            padding: 15px;
                                            border-radius: 5px;
                                            background-color: white;
                                            border: 1px solid #dee2e6;
                                            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                                            overflow: auto;
                                            max-height: 80vh;
                                        }
                                        .code-header {
                                            background-color: #4a6fdc;
                                            color: white;
                                            padding: 10px 15px;
                                            border-radius: 5px 5px 0 0;
                                            font-weight: bold;
                                            margin-bottom: -5px;
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                        }
                                        .progress-container {
                                            margin-top: 20px;
                                        }
                                        .blinking-cursor {
                                            display: inline-block;
                                            width: 0.5em;
                                            height: 1em;
                                            background-color: #4a6fdc;
                                            animation: blink 1s infinite;
                                            vertical-align: middle;
                                        }
                                        @keyframes blink {
                                            0%, 100% { opacity: 1; }
                                            50% { opacity: 0; }
                                        }
                                    </style>
                                    <script>
                                        // 添加自动滚动功能
                                        window.onload = function() {
                                            const codeContainer = document.querySelector('.code-container');
                                            if (codeContainer) {
                                                codeContainer.scrollTop = codeContainer.scrollHeight;
                                            }
                                        }
                                        
                                        // 监听内容变化，保持滚动到底部
                                        const observer = new MutationObserver(function(mutations) {
                                            const codeContainer = document.querySelector('.code-container');
                                            if (codeContainer) {
                                                codeContainer.scrollTop = codeContainer.scrollHeight;
                                            }
                                        });
                                        
                                        // 页面加载后开始观察
                                        window.addEventListener('DOMContentLoaded', function() {
                                            const codeContainer = document.querySelector('.code-container');
                                            if (codeContainer) {
                                                observer.observe(codeContainer, { 
                                                    childList: true,
                                                    characterData: true,
                                                    subtree: true 
                                                });
                                                codeContainer.scrollTop = codeContainer.scrollHeight;
                                            }
                                        });
                                    </script>
                                </head>
                                <body>
                                    <div class="code-header">
                                        <span>UI原型代码生成中...</span>
                                        <span class="badge bg-light text-dark">${Math.min(Math.round((fullContent.length / 50000) * 100), 100)}%</span>
                                    </div>
                                    <div class="code-container">${escapeHtml(fullContent)}<span class="blinking-cursor"></span></div>
                                    <div class="progress-container">
                                        <div class="progress">
                                            <div class="progress-bar" role="progressbar" style="width: ${Math.min((fullContent.length / 50000) * 100, 100)}%" 
                                                aria-valuenow="${Math.min((fullContent.length / 50000) * 100, 100)}" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </body>
                                </html>
                                `;
                                
                                // 更新预览
                                uiPreview.srcdoc = previewHtml;
                                
                                // 确保iframe内容加载后滚动到底部
                                uiPreview.onload = function() {
                                    try {
                                        const codeContainer = uiPreview.contentDocument.querySelector('.code-container');
                                        if (codeContainer) {
                                            codeContainer.scrollTop = codeContainer.scrollHeight;
                                        }
                                    } catch (e) {
                                        console.error('Error scrolling iframe content:', e);
                                    }
                                };
                            } else if (data.type === 'done') {
                                // 完成生成
                                window.currentUI = data.content;
                                
                                // 显示UI原型
                                uiPreview.srcdoc = data.content;
                                
                                // 设置iframe的sandbox属性，允许脚本执行和打开新窗口
                                uiPreview.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');
                                
                                // 添加AI回复
                                const botMessage = document.createElement('div');
                                botMessage.className = 'message bot-message';
                                
                                // 根据是否是更新UI显示不同消息
                                if (window.currentUI) {
                                    botMessage.textContent = `已更新UI界面，请查看右侧预览。`;
                                } else {
                                    botMessage.textContent = `已生成UI界面，请查看右侧预览。`;
                                }
                                
                                chatMessages.appendChild(botMessage);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                
                                // 更新UI生成按钮状态
                                updateUIGenerationButton();
                            } else if (data.type === 'error') {
                                throw new Error(data.error);
                            }
                            
                            // 重置缓冲区
                            buffer = '';
                        } catch (parseError) {
                            // 如果是语法错误，可能是不完整的JSON，继续收集数据
                            if (parseError instanceof SyntaxError) {
                                // 继续收集数据，不做任何处理
                                console.log('收到不完整的JSON数据，继续等待...');
                                
                                // 检查是否HTML已经完整（包含结束标签）
                                // 确保previewContent已定义且为字符串
                                if (type === 'ui' && typeof previewContent === 'string' && previewContent.includes('</html>')) {
                                    console.log('检测到HTML已完整，触发预览显示');
                                    
                                    // 清除保存的状态
                                    clearGenerationState(type);
                                    
                                    // 创建一个加载提示
                                    uiPreview.srcdoc = `
                                        <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column;">
                                            <div style="text-align: center; margin-bottom: 20px;">
                                                <div class="spinner-border text-primary" role="status">
                                                    <span class="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                            <p>正在渲染UI原型，请稍候...</p>
                                        </div>
                                    `;
                                    
                                    // 短暂延迟后再显示完整UI
                                    setTimeout(() => {
                                        try {
                                            console.log("设置UI预览内容...");
                                            // 确保previewContent存在
                                            if (typeof previewContent === 'string' && previewContent.trim() !== '') {
                                                uiPreview.srcdoc = previewContent;
                                                
                                                // 设置iframe的sandbox属性
                                                uiPreview.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');
                                                
                                                // 确保iframe内容加载完成后执行
                                                uiPreview.onload = function() {
                                                    console.log("UI预览加载完成");
                                                    // 调用完成回调，更新UI生成按钮状态
                                                    onStreamComplete('ui', previewContent);
                                                    
                                                    // 自动切换到UI预览标签
                                                    document.getElementById('ui-tab').click();
                                                };
                                                
                                                // 移除思考中的消息
                                                if (thinkingMsg && thinkingMsg.parentNode) {
                                                    chatMessages.removeChild(thinkingMsg);
                                                }
                                                
                                                // 添加AI回复
                                                const botMessage = document.createElement('div');
                                                botMessage.className = 'message bot-message';
                                                botMessage.textContent = `已生成UI界面，请查看右侧预览。`;
                                                chatMessages.appendChild(botMessage);
                                                chatMessages.scrollTop = chatMessages.scrollHeight;
                                            } else {
                                                console.error('预览内容为空或无效');
                                                throw new Error('预览内容为空或无效');
                                            }
                                        } catch (error) {
                                            console.error('设置UI预览时出错:', error);
                                            
                                            // 显示错误消息
                                            const errorMessage = document.createElement('div');
                                            errorMessage.className = 'message bot-message error';
                                            errorMessage.textContent = `生成UI界面时出错: ${error.message}`;
                                            chatMessages.appendChild(errorMessage);
                                            chatMessages.scrollTop = chatMessages.scrollHeight;
                                        } finally {
                                            // 确保按钮状态被重置
                                            resetAllButtonStates();
                                        }
                                    }, 1000);
                                    
                                    // 中断循环，不再等待更多数据
                                    return previewContent || '';
                                }
                            } else {
                                // 其他错误，记录并重置
                                console.error('解析过程中出现意外错误:', parseError);
                                buffer = '';
                                
                                // 尝试恢复并继续
                                try {
                                    // 如果是UI生成且内容看起来像HTML，尝试恢复
                                    if (type === 'ui' && typeof previewContent === 'string' && 
                                        (previewContent.includes('<html') || previewContent.includes('<body'))) {
                                        console.log('尝试从错误中恢复UI生成...');
                                        continue;
                                    }
                                } catch (recoveryError) {
                                    console.error('恢复过程中出错:', recoveryError);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('处理SSE数据时出错:', e);
                        buffer = ''; // 出错时重置缓冲区
                    }
                }
            }
        }
        
        return fullContent;
    } catch (error) {
        console.error('Error:', error);
        
        // 显示错误消息
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message bot-message error';
        errorMessage.textContent = `生成UI界面时出错: ${error.message}`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 显示错误信息在预览区域
        uiPreview.srcdoc = `
            <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        padding: 20px;
                        color: #dc3545;
                    }
                    .error-container {
                        border: 1px solid #dc3545;
                        border-radius: 5px;
                        padding: 20px;
                        margin-top: 20px;
                    }
                    h3 {
                        margin-top: 0;
                    }
                </style>
            </head>
            <body>
                <h3>生成UI原型时出错</h3>
                <div class="error-container">
                    <p>${error.message}</p>
                </div>
                <p>请尝试重新生成或修改PRD文档后再试。</p>
            </body>
            </html>
        `;
        
        // 确保在错误情况下也重置按钮状态
        resetAllButtonStates();
        
        return null;
    }
}

// 调用流式API的函数
async function callClaudeAPIStream(prompt, type) {
    // 显示思考中的消息
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'message bot-message thinking';
    thinkingMsg.textContent = 'Iron正在思考...';
    chatMessages.appendChild(thinkingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 检查是否有未完成的任务
    const unfinishedTask = checkForUnfinishedGeneration(type);
    let taskId = null;
    let previewContent = unfinishedTask ? unfinishedTask.content : '';
    let retryCount = 0;
    const maxRetries = 3;
    
    try {
        // 获取系统提示词（如果有设置）
        const customSystemPrompt = window.getSystemPrompt ? window.getSystemPrompt(type) : null;
        
        // 创建预览内容容器
        let previewContent = unfinishedTask ? unfinishedTask.content : '';
        
        // 创建预览区域的流式更新元素
        let previewElement;
        if (type === 'prd') {
            // 清空现有内容
            prdContent.innerHTML = '<div class="streaming-content markdown-preview"></div>';
            previewElement = prdContent.querySelector('.streaming-content');
            
            // 如果有未完成的内容，先显示出来
            if (previewContent) {
                previewElement.innerHTML = marked.parse(previewContent);
            }
        } else if (type === 'ui') {
            // 为UI预览创建一个临时容器，添加Bootstrap样式以美化代码显示
            uiPreview.srcdoc = `
                <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { 
                            padding: 20px; 
                            font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; 
                            white-space: pre-wrap;
                            line-height: 1.5;
                            font-size: 0.9rem;
                            background-color: #f8f9fa;
                        }
                        .streaming-content {
                            padding: 15px;
                            border-radius: 5px;
                            background-color: white;
                            border: 1px solid #dee2e6;
                            box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
                        }
                        .streaming-content::after {
                            content: '|';
                            display: inline-block;
                            animation: blink 1s infinite;
                            color: #4a6fdc;
                            font-weight: bold;
                        }
                        @keyframes blink {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0; }
                        }
                        .code-header {
                            background-color: #4a6fdc;
                            color: white;
                            padding: 10px 15px;
                            border-radius: 5px 5px 0 0;
                            font-weight: bold;
                            margin-bottom: -5px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .reconnect-info {
                            color: #ffc107;
                            font-style: italic;
                            margin-top: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="code-header">
                        <span>UI原型代码生成中...</span>
                        <span class="badge bg-light text-dark" id="progress-badge">0%</span>
                    </div>
                    <div class="streaming-content">${previewContent}</div>
                    ${unfinishedTask ? '<div class="reconnect-info">已恢复之前的生成进度...</div>' : ''}
                </body>
                </html>
            `;
            // 我们需要等待iframe加载完成
            await new Promise(resolve => {
                uiPreview.onload = resolve;
            });
            previewElement = uiPreview.contentDocument.querySelector('.streaming-content');
        }
        
        // 准备请求参数
        const requestBody = { 
            prompt, 
            type,
            projectId: window.currentProjectId,
            previousContent: type === 'prd' ? window.currentPRD : window.currentUI,
            systemPrompt: customSystemPrompt
        };
        
        // 记录当前请求的项目状态
        console.log(`准备${type}生成请求:`, {
            projectId: window.currentProjectId,
            hasPRD: !!window.currentPRD,
            hasUI: !!window.currentUI,
            isNewProject: !window.currentProjectId
        });
        
        // 如果是恢复任务，添加相关参数
        if (unfinishedTask && unfinishedTask.taskId) {
            requestBody.resumeTaskId = unfinishedTask.taskId;
            requestBody.resumeFrom = previewContent.length;
            
            console.log('正在恢复任务:', unfinishedTask.taskId, '从位置:', previewContent.length);
        }
        
        // 调用流式API
        const response = await fetch('/api/claude/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        // 创建事件源
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 读取流
        let buffer = '';
        let fullContent = previewContent || '';  // 确保fullContent始终有初始值
        
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));
                        
                        if (data.type === 'init') {
                            // 初始化项目ID和任务ID
                            window.currentProjectId = data.projectId;
                            taskId = data.taskId;
                            
                            console.log('任务已初始化，ID:', taskId);
                        } else if (data.type === 'chunk') {
                            // 添加内容块
                            previewContent += data.content;
                            
                            // 更新预览区域
                            if (type === 'prd') {
                                // 使用打字机效果逐字显示内容
                                const currentContent = marked.parse(previewContent);
                                previewElement.innerHTML = currentContent;
                                // 滚动到底部以显示最新内容
                                previewElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                prdContent.scrollTop = prdContent.scrollHeight;
                            } else if (type === 'ui') {
                                previewElement.textContent = previewContent;
                                
                                // 更新进度指示器
                                const progressBadge = uiPreview.contentDocument.querySelector('#progress-badge');
                                if (progressBadge) {
                                    const progress = Math.min(Math.round((previewContent.length / 50000) * 100), 100);
                                    progressBadge.textContent = `${progress}%`;
                                }
                            }
                            
                            // 每500ms保存一次状态
                            if (Date.now() % 500 < 100 && taskId) {
                                saveGenerationState(type, previewContent, taskId, 'in_progress');
                            }
                        } else if (data.type === 'done') {
                            // 完成生成
                            if (type === 'prd') {
                                window.currentPRD = data.content;
                                // 保留打字机效果的最终结果
                                prdContent.innerHTML = marked.parse(data.content);
                                // 滚动到顶部，让用户可以从头阅读完整文档
                                prdContent.scrollTop = 0;
                                
                                // 调用完成回调，更新UI生成按钮状态
                                onStreamComplete('prd', data.content);
                            } else if (type === 'ui') {
                                window.currentUI = data.content;
                                
                                // 创建一个加载提示
                                uiPreview.srcdoc = `
                                    <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column;">
                                        <div style="text-align: center; margin-bottom: 20px;">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                        <p>正在渲染UI原型，请稍候...</p>
                                    </div>
                                `;
                                
                                // 短暂延迟后再显示完整UI，让用户感知到渲染过程
                                setTimeout(() => {
                                    // 确保UI预览显示
                                    console.log("设置UI预览内容...");
                                    uiPreview.srcdoc = data.content;
                                    
                                    // 设置iframe的sandbox属性，允许脚本执行和打开新窗口
                                    uiPreview.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');
                                    
                                    // 确保iframe内容加载完成后执行
                                    uiPreview.onload = function() {
                                        console.log("UI预览加载完成");
                                        // 调用完成回调，更新UI生成按钮状态
                                        onStreamComplete('ui', data.content);
                                        
                                        // 自动切换到UI预览标签
                                        document.getElementById('ui-tab').click();
                                        
                                        // 确保按钮状态被重置
                                        resetAllButtonStates();
                                    };
                                    
                                    // 设置iframe的sandbox属性，允许脚本执行和打开新窗口
                                    uiPreview.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');
                                }, 1000);
                            }
                        } else if (data.type === 'error') {
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }
        }
        
      
        
        // 移除思考中的消息
        chatMessages.removeChild(thinkingMsg);
        
        // 添加AI回复
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot-message';
        
        if (type === 'prd') {
            botMessage.textContent = `已生成PRD文档，请查看右侧预览。`;
        } else if (type === 'ui') {
            // 根据是否已有UI，显示不同的消息
            if (window.currentUI) {
                botMessage.textContent = `已更新UI界面，请查看右侧预览。`;
            } else {
                botMessage.textContent = `已生成UI界面，请查看右侧预览。`;
            }
        }
        
        chatMessages.appendChild(botMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // 如果是UI，自动切换到UI预览标签
        if (type === 'ui') {
            document.getElementById('ui-tab').click();
        }
        
        return previewContent;
    } catch (error) {
        console.error('Error:', error);
     
        
        // 移除思考中的消息
        chatMessages.removeChild(thinkingMsg);
        
        // 显示错误消息
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message bot-message error';
        errorMessage.textContent = `生成${type === 'prd' ? 'PRD文档' : 'UI界面'}时出错: ${error.message}`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return null;
    }
}
// 辅助函数：HTML转义
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// 检测PRD是否已更新，并相应地更新UI生成按钮
function updateUIGenerationButton() {
    const generateUIBtn = document.getElementById('generateUIBtn');
    
    if (window.currentPRD && window.currentUI) {
        // 如果已有PRD和UI，则显示为"更新UI"
        generateUIBtn.textContent = '更新UI';
        generateUIBtn.classList.remove('btn-primary');
        generateUIBtn.classList.add('btn-success');
        
        // 添加提示信息
        generateUIBtn.setAttribute('data-bs-toggle', 'tooltip');
        generateUIBtn.setAttribute('data-bs-placement', 'top');
        generateUIBtn.setAttribute('title', 'PRD已更新，点击更新UI以匹配最新需求');
        
        // 初始化tooltip
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            new bootstrap.Tooltip(generateUIBtn);
        }
    } else if (window.currentPRD) {
        // 如果只有PRD，则显示为"生成UI"
        generateUIBtn.textContent = '生成UI';
        generateUIBtn.classList.remove('btn-success');
        generateUIBtn.classList.add('btn-primary');
        
        // 移除tooltip
        generateUIBtn.removeAttribute('data-bs-toggle');
        generateUIBtn.removeAttribute('data-bs-placement');
        generateUIBtn.removeAttribute('title');
        
        // 销毁tooltip
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltip = bootstrap.Tooltip.getInstance(generateUIBtn);
            if (tooltip) {
                tooltip.dispose();
            }
        }
    }
}
// 流式API调用完成后的回调
function onStreamComplete(type, content) {
    console.log(`${type}生成完成`);
    
    // 保存内容到全局变量
    if (type === 'prd') {
        window.currentPRD = content;
        
        // 当PRD更新时，更新UI生成按钮状态
        updateUIGenerationButton();
    } else if (type === 'ui') {
        window.currentUI = content;
        
        // 更新UI生成按钮状态
        updateUIGenerationButton();
    }
    
    // 无论是哪种类型，都重置所有按钮状态
    resetAllButtonStates();
    
    // 确保发送按钮恢复正常状态
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        console.log('在onStreamComplete中恢复发送按钮状态');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '发送';
    }
}

// 定期保存生成状态到localStorage
function saveGenerationState(type, content, taskId, progress) {
    localStorage.setItem(`generation_${type}_content`, content);
    localStorage.setItem(`generation_${type}_taskId`, taskId);
    localStorage.setItem(`generation_${type}_progress`, progress);
    localStorage.setItem(`generation_${type}_timestamp`, Date.now());
}

// 检查是否有未完成的生成任务
function checkForUnfinishedGeneration(type) {
    const content = localStorage.getItem(`generation_${type}_content`);
    const taskId = localStorage.getItem(`generation_${type}_taskId`);
    const progress = localStorage.getItem(`generation_${type}_progress`);
    const timestamp = localStorage.getItem(`generation_${type}_timestamp`);
    
    // 如果有未完成的任务且时间不超过1小时
    if (content && taskId && timestamp && (Date.now() - timestamp < 3600000)) {
        return { content, taskId, progress };
    }
    return null;
}

// 清除生成状态
function clearGenerationState(type) {
    localStorage.removeItem(`generation_${type}_content`);
    localStorage.removeItem(`generation_${type}_taskId`);
    localStorage.removeItem(`generation_${type}_progress`);
    localStorage.removeItem(`generation_${type}_timestamp`);
}

// 检测PRD是否已更新，并相应地更新UI生成按钮
function updateUIGenerationButton() {
    const generateUIBtn = document.getElementById('generateUIBtn');
    
    if (!generateUIBtn) return;
    
    if (window.currentPRD && window.currentUI) {
        // 如果已有PRD和UI，则显示为"更新UI"
        generateUIBtn.textContent = '更新UI';
        generateUIBtn.classList.remove('btn-primary');
        generateUIBtn.classList.add('btn-success');
        
        // 添加提示信息
        generateUIBtn.setAttribute('data-bs-toggle', 'tooltip');
        generateUIBtn.setAttribute('data-bs-placement', 'top');
        generateUIBtn.setAttribute('title', 'PRD已更新，点击更新UI以匹配最新需求');
        
        // 初始化tooltip
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            new bootstrap.Tooltip(generateUIBtn);
        }
    } else if (window.currentPRD) {
        // 如果只有PRD，则显示为"生成UI"
        generateUIBtn.textContent = '生成UI';
        generateUIBtn.classList.remove('btn-success');
        generateUIBtn.classList.add('btn-primary');
        
        // 移除tooltip
        generateUIBtn.removeAttribute('data-bs-toggle');
        generateUIBtn.removeAttribute('data-bs-placement');
        generateUIBtn.removeAttribute('title');
        
        // 销毁tooltip
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltip = bootstrap.Tooltip.getInstance(generateUIBtn);
            if (tooltip) {
                tooltip.dispose();
            }
        }
    }
}

// 流式API调用完成后的回调
function onStreamComplete(type, content) {
    console.log(`${type}生成完成`);
    
    // 保存内容到全局变量
    if (type === 'prd') {
        window.currentPRD = content;
        
        // 当PRD更新时，更新UI生成按钮状态
        updateUIGenerationButton();
    } else if (type === 'ui') {
        window.currentUI = content;
        
        // 更新UI生成按钮状态
        updateUIGenerationButton();
    }
}
// 重置所有按钮状态的通用函数
function resetAllButtonStates() {
    console.log('重置所有按钮状态');
    
    // 恢复发送按钮状态
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '发送';
    }
    
    // 恢复生成UI按钮状态
    const generateUIBtn = document.getElementById('generateUIBtn');
    if (generateUIBtn) {
        generateUIBtn.disabled = false;
        if (window.currentPRD && window.currentUI) {
            generateUIBtn.textContent = '更新UI';
        } else if (window.currentPRD) {
            generateUIBtn.textContent = '生成UI';
        }
    }
}
