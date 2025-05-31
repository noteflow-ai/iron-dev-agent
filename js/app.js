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
    welcomeMessage.textContent = '欢迎使用PRD & UI生成器！我是Q Developer，请描述您的产品需求，我将帮您生成PRD文档和UI界面预览。';
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
                    
                    if (selectedProjectId) {
                        await loadProject(selectedProjectId);
                        deleteBtn.removeAttribute('disabled');
                    } else {
                        // 清空当前内容
                        currentProjectId = '';
                        currentPRD = '';
                        currentUI = '';
                        prdContent.innerHTML = '<p class="text-muted">请在左侧输入您的需求描述，AI将为您生成PRD文档...</p>';
                        uiPreview.srcdoc = '<p>请在左侧输入您的需求描述，AI将为您生成UI界面...</p>';
                        deleteBtn.setAttribute('disabled', 'disabled');
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
                                currentProjectId = '';
                                currentPRD = '';
                                currentUI = '';
                                prdContent.innerHTML = '<p class="text-muted">请在左侧输入您的需求描述，AI将为您生成PRD文档...</p>';
                                uiPreview.srcdoc = '<p>请在左侧输入您的需求描述，AI将为您生成UI界面...</p>';
                                
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
                currentProjectId = projectId;
                
                if (data.project.prd) {
                    currentPRD = data.project.prd;
                    prdContent.innerHTML = marked.parse(data.project.prd);
                }
                
                if (data.project.ui) {
                    currentUI = data.project.ui;
                    uiPreview.srcdoc = data.project.ui;
                }
                
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
        generateUIBtn.addEventListener('click', function() {
            // 检查是否有PRD内容
            if (!window.currentPRD) {
                alert('请先生成PRD文档，然后再生成UI原型');
                return;
            }
            
            // 添加生成UI的消息
            const generatingUIMsg = document.createElement('div');
            generatingUIMsg.className = 'message bot-message';
            generatingUIMsg.textContent = '正在基于PRD生成UI原型...';
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
                                </head>
                                <body>
                                    <div class="code-header">
                                        <span>UI原型代码生成中...</span>
                                        <span class="badge bg-light text-dark">${Math.round(fullContent.length / 100)}%</span>
                                    </div>
                                    <div class="code-container">${escapeHtml(fullContent)}<span class="blinking-cursor"></span></div>
                                    <div class="progress-container">
                                        <div class="progress">
                                            <div class="progress-bar" role="progressbar" style="width: ${Math.min(fullContent.length / 100, 100)}%" 
                                                aria-valuenow="${Math.min(fullContent.length / 100, 100)}" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                </body>
                                </html>
                                `;
                                
                                // 更新预览
                                uiPreview.srcdoc = previewHtml;
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
                                botMessage.textContent = `已生成UI界面，请查看右侧预览。`;
                                chatMessages.appendChild(botMessage);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
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
                                continue;
                            } else {
                                // 其他错误，记录并重置
                                console.error('解析过程中出现意外错误:', parseError);
                                buffer = '';
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
        
        return null;
    }
}

// 调用流式API的函数
async function callClaudeAPIStream(prompt, type) {
    // 显示思考中的消息
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = 'message bot-message thinking';
    
    
    // 创建思考内容区域
    const thinkingContent = document.createElement('div');
    thinkingContent.className = 'thinking-content';
   
    
    // 添加初始思考消息
    thinkingMsg.textContent = 'Iron正在思考...';
    chatMessages.appendChild(thinkingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    
    
   
    
    try {
        // 获取系统提示词（如果有设置）
        const customSystemPrompt = window.getSystemPrompt ? window.getSystemPrompt(type) : null;
        
        // 创建预览内容容器
        let previewContent = '';
        
        // 创建预览区域的流式更新元素
        let previewElement;
        if (type === 'prd') {
            // 清空现有内容
            prdContent.innerHTML = '<div class="streaming-content markdown-preview"></div>';
            previewElement = prdContent.querySelector('.streaming-content');
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
                        }
                    </style>
                </head>
                <body>
                    <div class="code-header">UI原型代码生成中...</div>
                    <div class="streaming-content"></div>
                </body>
                </html>
            `;
            // 我们需要等待iframe加载完成
            await new Promise(resolve => {
                uiPreview.onload = resolve;
            });
            previewElement = uiPreview.contentDocument.querySelector('.streaming-content');
        }
        
        // 调用流式API
        const response = await fetch('/api/claude/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                prompt, 
                type,
                projectId: window.currentProjectId,
                previousContent: type === 'prd' ? window.currentPRD : window.currentUI,
                systemPrompt: customSystemPrompt
            }),
        });
        
        // 创建事件源
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        // 读取流
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
                            // 初始化项目ID
                            window.currentProjectId = data.projectId;
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
                            }
                        } else if (data.type === 'done') {
                            // 完成生成
                            if (type === 'prd') {
                                window.currentPRD = data.content;
                                // 保留打字机效果的最终结果
                                prdContent.innerHTML = marked.parse(data.content);
                                // 滚动到顶部，让用户可以从头阅读完整文档
                                prdContent.scrollTop = 0;
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
        botMessage.textContent = `已生成${type === 'prd' ? 'PRD文档' : 'UI界面'}，请查看右侧预览。`;
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
