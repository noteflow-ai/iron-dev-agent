document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const prdContent = document.getElementById('prdContent');
    const uiPreview = document.getElementById('uiPreview');
    const downloadPRD = document.getElementById('downloadPRD');
    const downloadUI = document.getElementById('downloadUI');

    // 存储当前的PRD和UI内容以及项目ID
    let currentPRD = '';
    let currentUI = '';
    let currentProjectId = '';

    // 调用API的函数
    async function callClaudeAPI(prompt, type) {
        // 显示思考中的消息
        const thinkingMsg = document.createElement('div');
        thinkingMsg.className = 'message bot-message thinking';
        thinkingMsg.textContent = 'Q Developer正在思考...';
        chatMessages.appendChild(thinkingMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // 调用后端API
            const response = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    prompt, 
                    type,
                    projectId: currentProjectId,
                    previousContent: type === 'prd' ? currentPRD : currentUI
                }),
            });
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '调用API失败');
            }
            
            // 更新项目ID
            if (data.projectId) {
                currentProjectId = data.projectId;
            }
            
            // 移除思考中的消息
            chatMessages.removeChild(thinkingMsg);
            
            // 添加AI回复
            const botMessage = document.createElement('div');
            botMessage.className = 'message bot-message';
            botMessage.textContent = `已生成${type === 'prd' ? 'PRD文档' : 'UI界面'}，请查看右侧预览。`;
            chatMessages.appendChild(botMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // 更新预览内容
            if (type === 'prd') {
                currentPRD = data.content;
                prdContent.innerHTML = marked.parse(data.content);
            } else if (type === 'ui') {
                currentUI = data.content;
                
                // 添加允许iframe内容与父窗口交互的sandbox属性
                const enhancedHTML = `
                    <base target="_blank">
                    <script>
                        // 为所有链接和按钮添加在新窗口打开的功能
                        document.addEventListener('DOMContentLoaded', function() {
                            // 处理所有链接
                            document.querySelectorAll('a').forEach(link => {
                                if (!link.getAttribute('target')) {
                                    link.setAttribute('target', '_blank');
                                }
                            });
                            
                            // 处理所有按钮点击
                            document.querySelectorAll('button, .btn, [role="button"]').forEach(button => {
                                // 如果按钮已经有事件处理程序，不添加新的
                                if (button.getAttribute('data-has-listener') === 'true') {
                                    return;
                                }
                                
                                button.addEventListener('click', function(e) {
                                    // 如果按钮有href属性或在表单内，不处理
                                    if (this.getAttribute('href') || this.closest('form')) {
                                        return;
                                    }
                                    
                                    // 获取按钮文本或值作为操作名称
                                    const actionName = this.textContent.trim() || this.value || '按钮操作';
                                    
                                    // 打开新窗口显示交互信息
                                    const newWindow = window.open('', '_blank');
                                    newWindow.document.write(\`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <title>交互演示</title>
                                            <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <style>
                                                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                                                .container { max-width: 800px; margin: 0 auto; }
                                                .alert { background-color: #f8f9fa; border-left: 4px solid #4a6fdc; padding: 15px; margin-bottom: 20px; }
                                                .btn { display: inline-block; background-color: #4a6fdc; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="container">
                                                <h1>交互演示</h1>
                                                <div class="alert">
                                                    <p>您点击了: <strong>\${actionName}</strong></p>
                                                    <p>这是一个交互演示页面。在实际应用中，这里会执行相应的业务逻辑。</p>
                                                </div>
                                                <p>这个页面展示了用户点击按钮后的交互效果。在完整实现中，这里可以：</p>
                                                <ul>
                                                    <li>显示表单提交结果</li>
                                                    <li>展示数据处理流程</li>
                                                    <li>进行页面跳转</li>
                                                    <li>显示操作成功/失败的反馈</li>
                                                </ul>
                                                <a href="javascript:window.close();" class="btn">关闭窗口</a>
                                            </div>
                                        </body>
                                        </html>
                                    \`);
                                    newWindow.document.close();
                                });
                                
                                // 标记按钮已添加事件处理程序
                                button.setAttribute('data-has-listener', 'true');
                            });
                        });
                    </script>
                    ${data.content}
                `;
                
                // 确保UI预览显示
                console.log("设置UI预览内容...");
                uiPreview.srcdoc = enhancedHTML;
                
                // 设置iframe的sandbox属性，允许脚本执行和打开新窗口
                uiPreview.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin');
                
                // 添加iframe加载事件监听器
                uiPreview.onload = function() {
                    console.log("UI预览加载完成");
                };
                
                // 添加错误处理
                uiPreview.onerror = function(e) {
                    console.error("UI预览加载错误:", e);
                };
            }
            
            return data.content;
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
        
        // 生成PRD
        callClaudeAPI(message, 'prd').then(() => {
            // 生成UI
            return callClaudeAPI(message, 'ui');
        });
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
});
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
    
    // 初始化时加载项目列表
    loadProjects();
