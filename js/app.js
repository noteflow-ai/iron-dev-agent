// 确保页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化应用...');
    
    // 获取DOM元素
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const chatSidebar = document.getElementById('chatSidebar');
    
    // 文件浏览器相关元素
    const fileBreadcrumb = document.getElementById('fileBreadcrumb');
    const fileList = document.getElementById('fileList');
    const previewFileName = document.getElementById('previewFileName');
    const filePreviewContent = document.getElementById('filePreviewContent');
    const downloadFileBtn = document.getElementById('downloadFileBtn');
    const refreshFilesBtn = document.getElementById('refreshFilesBtn');
    const uploadFileBtn = document.getElementById('uploadFileBtn');

    // 存储当前的PRD和UI内容以及项目ID
    let currentPRD = '';
    let currentUI = '';
    let currentProjectId = '';
    
    // 文件浏览器状态
    let currentPath = '';
    let currentProjectFiles = [];
    let selectedFile = null;
    
    // 默认系统提示词
    const DEFAULT_PRD_SYSTEM_PROMPT = `你是一位专业的产品经理，擅长将用户需求转化为清晰的PRD文档。
请根据用户的需求描述，生成一份详细的PRD文档，包括但不限于：
1. 产品概述
2. 用户需求分析
3. 功能规格
4. 用户界面要求
5. 非功能性需求
6. 里程碑和交付计划

请使用Markdown格式输出，确保文档结构清晰，内容全面。`;

    const DEFAULT_UI_SYSTEM_PROMPT = `你是一位专业的UI设计师和前端开发工程师，擅长将产品需求转化为美观实用的界面。
请根据用户的需求描述，生成一份HTML界面原型，要求：
1. 使用HTML5、CSS3和基础JavaScript
2. 界面美观、简洁，符合现代设计趋势
3. 具有基本的交互功能
4. 响应式设计，适配不同设备
5. 代码整洁，结构清晰

请直接输出完整的HTML代码，包括内联的CSS和JavaScript。`;

    // 当前使用的系统提示词
    let currentPRDSystemPrompt = DEFAULT_PRD_SYSTEM_PROMPT;
    let currentUISystemPrompt = DEFAULT_UI_SYSTEM_PROMPT;
    
    console.log('初始化UI组件...');
    
    // 初始化滚动到底部按钮
    initScrollToBottomButton();
    
    // 初始化侧边栏切换按钮
    initToggleSidebarButton();
    
    // 初始化文件浏览器
    initFileExplorer();
    
    // 初始化设置
    initSettings();
    
    // 初始化设置功能
    function initSettings() {
        console.log('初始化设置功能...');
        
        // 获取设置相关的DOM元素
        const settingsBtn = document.getElementById('settingsBtn');
        const prdSystemPromptTextarea = document.getElementById('prdSystemPrompt');
        const uiSystemPromptTextarea = document.getElementById('uiSystemPrompt');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        
        // 从本地存储加载系统提示词
        const savedPRDPrompt = localStorage.getItem('prdSystemPrompt');
        const savedUIPrompt = localStorage.getItem('uiSystemPrompt');
        
        // 如果有保存的系统提示词，则使用它们
        if (savedPRDPrompt) {
            currentPRDSystemPrompt = savedPRDPrompt;
            console.log('从本地存储加载PRD系统提示词');
        }
        
        if (savedUIPrompt) {
            currentUISystemPrompt = savedUIPrompt;
            console.log('从本地存储加载UI系统提示词');
        }
        
        // 点击设置按钮，显示设置对话框
        settingsBtn.addEventListener('click', function() {
            // 在对话框中显示当前的系统提示词
            prdSystemPromptTextarea.value = currentPRDSystemPrompt;
            uiSystemPromptTextarea.value = currentUISystemPrompt;
            
            // 显示设置对话框
            const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
            settingsModal.show();
        });
        
        // 点击保存设置按钮
        saveSettingsBtn.addEventListener('click', function() {
            // 获取用户输入的系统提示词
            const newPRDPrompt = prdSystemPromptTextarea.value.trim();
            const newUIPrompt = uiSystemPromptTextarea.value.trim();
            
            // 如果用户输入为空，则使用默认值
            currentPRDSystemPrompt = newPRDPrompt || DEFAULT_PRD_SYSTEM_PROMPT;
            currentUISystemPrompt = newUIPrompt || DEFAULT_UI_SYSTEM_PROMPT;
            
            // 保存到本地存储
            localStorage.setItem('prdSystemPrompt', currentPRDSystemPrompt);
            localStorage.setItem('uiSystemPrompt', currentUISystemPrompt);
            
            console.log('系统提示词已保存到本地存储');
            
            // 关闭设置对话框
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            settingsModal.hide();
            
            // 显示保存成功消息
            const saveMessage = document.createElement('div');
            saveMessage.className = 'message system-message';
            saveMessage.textContent = '系统提示词设置已保存。';
            chatMessages.appendChild(saveMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
    
    // 初始化文件浏览器
    function initFileExplorer() {
        console.log('初始化文件浏览器...');
        
        // 刷新按钮点击事件
        refreshFilesBtn.addEventListener('click', function() {
            if (currentProjectId) {
                loadProjectFiles(currentProjectId, currentPath);
            } else {
                loadProjectList(); // 如果没有选择项目，则刷新项目列表
            }
        });
        
        // 上传文件按钮点击事件
        uploadFileBtn.addEventListener('click', function() {
            if (!currentProjectId) {
                alert('请先选择一个项目');
                return;
            }
            
            // 创建文件输入元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // 监听文件选择
            fileInput.addEventListener('change', async function() {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = async function(e) {
                        const content = e.target.result;
                        
                        try {
                            // 构建上传路径
                            const uploadPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                            
                            // 调用API上传文件
                            const response = await fetch(`/api/projects/${currentProjectId}/files`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    path: uploadPath,
                                    content: content
                                }),
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                // 刷新文件列表
                                loadProjectFiles(currentProjectId, currentPath);
                                
                                // 显示上传成功消息
                                const uploadMessage = document.createElement('div');
                                uploadMessage.className = 'message system-message';
                                uploadMessage.textContent = `文件 ${file.name} 已成功上传。`;
                                chatMessages.appendChild(uploadMessage);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            } else {
                                alert(`上传失败: ${data.error}`);
                            }
                        } catch (error) {
                            console.error('Error uploading file:', error);
                            alert('上传文件时出错，请查看控制台了解详情。');
                        }
                    };
                    
                    reader.readAsText(file);
                }
                
                // 移除文件输入元素
                document.body.removeChild(fileInput);
            });
            
            // 触发文件选择对话框
            fileInput.click();
        });
        
        // 下载文件按钮点击事件
        downloadFileBtn.addEventListener('click', function() {
            if (selectedFile && selectedFile.type === 'file') {
                downloadFile(selectedFile.name, selectedFile.content);
            }
        });
    }
    
    // 加载项目文件
    async function loadProjectFiles(projectId, path = '') {
        try {
            console.log(`加载项目 ${projectId} 的文件，路径: ${path}`);
            
            // 调用API获取文件列表
            const response = await fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`);
            const data = await response.json();
            
            if (data.success) {
                currentProjectFiles = data.files || [];
                currentPath = path;
                
                // 更新面包屑导航
                updateBreadcrumb(path);
                
                // 更新文件列表
                updateFileList(currentProjectFiles);
                
                // 清空文件预览
                clearFilePreview();
            } else {
                console.error('Error loading project files:', data.error);
                fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                    <p>加载文件失败: ${data.error}</p>
                </div>`;
            }
        } catch (error) {
            console.error('Error loading project files:', error);
            fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                <p>加载文件失败，请查看控制台了解详情。</p>
            </div>`;
        }
    }
    
    // 更新面包屑导航
    function updateBreadcrumb(path) {
        // 清空面包屑
        fileBreadcrumb.innerHTML = '';
        
        // 添加根目录
        const rootItem = document.createElement('li');
        rootItem.className = 'breadcrumb-item';
        
        if (path === '') {
            rootItem.classList.add('active');
            rootItem.setAttribute('aria-current', 'page');
            rootItem.textContent = '根目录';
        } else {
            const rootLink = document.createElement('a');
            rootLink.href = '#';
            rootLink.textContent = '根目录';
            rootLink.addEventListener('click', function(e) {
                e.preventDefault();
                loadProjectFiles(currentProjectId, '');
            });
            rootItem.appendChild(rootLink);
        }
        
        fileBreadcrumb.appendChild(rootItem);
        
        // 如果有路径，添加路径项
        if (path) {
            const pathParts = path.split('/');
            let currentPath = '';
            
            pathParts.forEach((part, index) => {
                currentPath += (index === 0 ? '' : '/') + part;
                
                const pathItem = document.createElement('li');
                pathItem.className = 'breadcrumb-item';
                
                if (index === pathParts.length - 1) {
                    pathItem.classList.add('active');
                    pathItem.setAttribute('aria-current', 'page');
                    pathItem.textContent = part;
                } else {
                    const pathLink = document.createElement('a');
                    pathLink.href = '#';
                    pathLink.textContent = part;
                    
                    // 闭包保存当前路径
                    const savedPath = currentPath;
                    pathLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        loadProjectFiles(currentProjectId, savedPath);
                    });
                    
                    pathItem.appendChild(pathLink);
                }
                
                fileBreadcrumb.appendChild(pathItem);
            });
        }
    }
    
    // 更新文件列表
    function updateFileList(files) {
        // 清空文件列表
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                <p>此文件夹为空</p>
            </div>`;
            return;
        }
        
        // 分离文件夹和文件
        const folders = files.filter(file => file.type === 'directory');
        const fileItems = files.filter(file => file.type === 'file');
        
        // 先显示文件夹，再显示文件
        [...folders, ...fileItems].forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // 文件图标
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-item-icon';
            
            if (file.type === 'directory') {
                fileIcon.classList.add('folder');
                fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
                    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                </svg>`;
            } else {
                // 根据文件扩展名设置不同的图标和颜色
                const extension = file.name.split('.').pop().toLowerCase();
                
                if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
                    fileIcon.classList.add('file-image');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-image" viewBox="0 0 16 16">
                        <path d="M8.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11 5.835 9.7a.5.5 0 0 0-.611.076L3 12V2z"/>
                    </svg>`;
                } else if (extension === 'md') {
                    fileIcon.classList.add('file-md');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-markdown" viewBox="0 0 16 16">
                        <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
                        <path fill-rule="evenodd" d="M9.146 8.146a.5.5 0 0 1 .708 0L11.5 9.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708z"/>
                        <path fill-rule="evenodd" d="M11.5 5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5z"/>
                        <path d="M3.56 11V7.01h.056l1.428 3.239h.774l1.42-3.24h.056V11h1.073V5.001h-1.2l-1.71 3.894h-.039l-1.71-3.894H2.5V11h1.06z"/>
                    </svg>`;
                } else if (extension === 'html') {
                    fileIcon.classList.add('file-html');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-html" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5Zm-9.736 7.35v3.999h-.791v-1.714H1.79v1.714H1V11.85h.791v1.626h1.682V11.85h.79Zm2.251.662v3.337h-.794v-3.337H4.588v-.662h3.064v.662H6.515Zm2.176 3.337v-2.66h.038l.952 2.159h.516l.946-2.16h.038v2.661h.715V11.85h-.8l-1.14 2.596H9.93L8.79 11.85h-.805v3.999h.706Zm4.71-.674h1.696v.674H12.61V11.85h.79v3.325Z"/>
                    </svg>`;
                } else if (extension === 'css') {
                    fileIcon.classList.add('file-css');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-css" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM3.397 14.841a1.13 1.13 0 0 0 .401.823c.13.108.289.192.478.252.19.061.411.091.665.091.338 0 .624-.053.859-.158.236-.105.416-.252.539-.44.125-.189.187-.408.187-.656 0-.224-.045-.41-.134-.56a1.001 1.001 0 0 0-.375-.357 2.027 2.027 0 0 0-.566-.21l-.621-.144a.97.97 0 0 1-.404-.176.37.37 0 0 1-.144-.299c0-.156.062-.284.185-.384.125-.101.296-.152.512-.152.143 0 .266.023.37.068a.624.624 0 0 1 .246.181.56.56 0 0 1 .12.258h.75a1.092 1.092 0 0 0-.2-.566 1.21 1.21 0 0 0-.5-.41 1.813 1.813 0 0 0-.78-.152c-.293 0-.551.05-.776.15-.225.099-.4.24-.527.421-.127.182-.19.395-.19.639 0 .201.04.376.122.524.082.149.2.27.352.367.152.095.332.167.539.213l.618.144c.207.049.361.113.463.193a.387.387 0 0 1 .152.326.505.505 0 0 1-.085.29.559.559 0 0 1-.255.193c-.111.047-.249.07-.413.07-.117 0-.223-.013-.32-.04a.838.838 0 0 1-.248-.115.578.578 0 0 1-.255-.384h-.765ZM.806 13.693c0-.248.034-.46.102-.633a.868.868 0 0 1 .302-.399.814.814 0 0 1 .475-.137c.15 0 .283.032.398.097a.7.7 0 0 1 .272.26.85.85 0 0 1 .12.381h.765v-.072a1.33 1.33 0 0 0-.466-.964 1.441 1.441 0 0 0-.489-.272 1.838 1.838 0 0 0-.606-.097c-.356 0-.66.074-.911.223-.25.148-.44.359-.572.632-.13.274-.196.6-.196.979v.498c0 .379.064.704.193.976.131.271.322.48.572.626.25.145.554.217.914.217.293 0 .554-.055.785-.164.23-.11.414-.26.55-.454a1.27 1.27 0 0 0 .226-.674v-.076h-.764a.799.799 0 0 1-.118.363.7.7 0 0 1-.272.25.874.874 0 0 1-.401.087.845.845 0 0 1-.478-.132.833.833 0 0 1-.299-.392 1.699 1.699 0 0 1-.102-.627v-.495ZM6.78 15.29a1.176 1.176 0 0 1-.111-.449h.764a.578.578 0 0 0 .255.384c.07.049.154.087.25.114.095.028.201.041.319.041.164 0 .301-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .085-.29.387.387 0 0 0-.153-.326c-.101-.08-.256-.144-.463-.193l-.618-.143a1.72 1.72 0 0 1-.539-.214 1 1 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.304 0 .564.05.779.152.217.102.384.239.5.41.12.17.187.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.246-.181.923.923 0 0 0-.37-.068c-.216 0-.387.05-.512.152a.472.472 0 0 0-.184.384c0 .121.047.22.143.3a.97.97 0 0 0 .404.175l.621.143c.217.05.406.12.566.211.16.09.285.21.375.358.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Z"/>
                    </svg>`;
                } else if (extension === 'js') {
                    fileIcon.classList.add('file-js');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-js" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2H8v-1h4a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM3.186 15.29a1.176 1.176 0 0 1-.111-.449h.765a.578.578 0 0 0 .255.384c.07.049.153.087.249.114.095.028.202.041.319.041.164 0 .302-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .085-.29.387.387 0 0 0-.153-.326c-.101-.08-.255-.144-.462-.193l-.619-.143a1.72 1.72 0 0 1-.539-.214 1.001 1.001 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.305 0 .564.05.78.152.216.102.383.239.5.41.12.17.186.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.247-.181.923.923 0 0 0-.369-.068c-.217 0-.388.05-.513.152a.472.472 0 0 0-.184.384c0 .121.048.22.143.3a.97.97 0 0 0 .405.175l.62.143c.218.05.406.12.566.211.16.09.285.21.375.358.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-3.104-.033A1.32 1.32 0 0 1 0 14.791h.765a.576.576 0 0 0 .073.27.499.499 0 0 0 .454.246c.19 0 .33-.055.422-.164.092-.11.138-.265.138-.466v-2.745h.79v2.725c0 .44-.119.774-.357 1.005-.236.23-.564.345-.984.345a1.59 1.59 0 0 1-.569-.094 1.145 1.145 0 0 1-.407-.266 1.14 1.14 0 0 1-.243-.39Z"/>
                    </svg>`;
                } else if (extension === 'json') {
                    fileIcon.classList.add('file-json');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-json" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM4.151 15.29a1.176 1.176 0 0 1-.111-.449h.764a.578.578 0 0 0 .255.384c.07.049.154.087.25.114.095.028.201.041.319.041.164 0 .301-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .084-.29.387.387 0 0 0-.152-.326c-.101-.08-.256-.144-.463-.193l-.618-.143a1.72 1.72 0 0 1-.539-.214 1 1 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.304 0 .564.05.779.152.217.102.384.239.5.41.12.17.187.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.246-.181.923.923 0 0 0-.37-.068c-.216 0-.387.05-.512.152a.472.472 0 0 0-.184.384c0 .121.047.22.143.3a.97.97 0 0 0 .404.175l.621.143c.217.05.406.12.566.211.16.09.285.21.375.358.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-3.104-.033a1.32 1.32 0 0 1-.082-.466h.764a.576.576 0 0 0 .074.27.499.499 0 0 0 .454.246c.19 0 .33-.055.422-.164.091-.11.137-.265.137-.466v-2.745h.791v2.725c0 .44-.119.774-.357 1.005-.237.23-.565.345-.985.345a1.59 1.59 0 0 1-.568-.094 1.145 1.145 0 0 1-.407-.266 1.14 1.14 0 0 1-.243-.39Z"/>
                    </svg>`;
                } else {
                    fileIcon.classList.add('file');
                    fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                    </svg>`;
                }
            }
            
            // 文件名
            const fileName = document.createElement('div');
            fileName.className = 'file-item-name';
            fileName.textContent = file.name;
            
            // 组合文件项
            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileName);
            
            // 点击事件
            fileItem.addEventListener('click', function() {
                if (file.type === 'directory') {
                    // 如果是文件夹，则进入该文件夹
                    const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                    loadProjectFiles(currentProjectId, newPath);
                } else {
                    // 如果是文件，则预览文件
                    previewFile(file);
                }
            });
            
            fileList.appendChild(fileItem);
        });
    }
    
    // 预览文件
    async function previewFile(file) {
        try {
            console.log(`预览文件: ${file.name}`);
            
            // 设置当前选中的文件
            selectedFile = file;
            
            // 更新文件名
            previewFileName.textContent = file.name;
            
            // 启用下载按钮
            downloadFileBtn.disabled = false;
            
            // 获取文件内容
            const response = await fetch(`/api/projects/${currentProjectId}/files/content?path=${encodeURIComponent(currentPath ? `${currentPath}/${file.name}` : file.name)}`);
            const data = await response.json();
            
            if (data.success) {
                // 更新文件内容
                const content = data.content;
                file.content = content; // 保存内容到文件对象
                
                // 根据文件类型显示不同的预览
                const extension = file.name.split('.').pop().toLowerCase();
                
                if (extension === 'md') {
                    // Markdown预览
                    filePreviewContent.innerHTML = `<div class="markdown-content">${marked.parse(content)}</div>`;
                } else if (extension === 'html') {
                    // HTML预览
                    filePreviewContent.innerHTML = `<iframe id="htmlPreview" style="width:100%;height:100%;border:none;"></iframe>`;
                    const iframe = document.getElementById('htmlPreview');
                    iframe.contentWindow.document.open();
                    iframe.contentWindow.document.write(content);
                    iframe.contentWindow.document.close();
                } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
                    // 图片预览
                    filePreviewContent.innerHTML = `<div class="text-center"><img src="data:image/${extension === 'svg' ? 'svg+xml' : extension};base64,${content}" class="img-fluid" alt="${file.name}"></div>`;
                } else {
                    // 文本预览
                    filePreviewContent.innerHTML = `<pre><code>${content}</code></pre>`;
                }
            } else {
                console.error('Error loading file content:', data.error);
                filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
                    <p>加载文件内容失败: ${data.error}</p>
                </div>`;
            }
        } catch (error) {
            console.error('Error previewing file:', error);
            filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
                <p>预览文件时出错，请查看控制台了解详情。</p>
            </div>`;
        }
    }
    
    // 清空文件预览
    function clearFilePreview() {
        previewFileName.textContent = '未选择文件';
        filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
            <p>选择一个文件以预览内容</p>
        </div>`;
        downloadFileBtn.disabled = true;
        selectedFile = null;
    }
    
    // 下载文件
    function downloadFile(fileName, content) {
        const extension = fileName.split('.').pop().toLowerCase();
        let blob;
        
        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
            // 图片文件
            const byteCharacters = atob(content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: `image/${extension === 'svg' ? 'svg+xml' : extension}` });
        } else {
            // 文本文件
            blob = new Blob([content], { type: 'text/plain' });
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // 初始化滚动到底部按钮
    function initScrollToBottomButton() {
        console.log('初始化滚动到底部按钮...');
        
        // 显示/隐藏滚动到底部按钮
        chatMessages.addEventListener('scroll', function() {
            const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 50;
            scrollToBottomBtn.style.display = isScrolledToBottom ? 'none' : 'flex';
        });
        
        // 点击滚动到底部按钮
        scrollToBottomBtn.addEventListener('click', function() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
    
    // 初始化侧边栏切换按钮
    function initToggleSidebarButton() {
        console.log('初始化侧边栏切换按钮...');
        
        // 点击侧边栏切换按钮
        toggleSidebarBtn.addEventListener('click', function() {
            chatSidebar.classList.toggle('collapsed');
        });
        
        // 点击固定的侧边栏切换按钮
        document.getElementById('sidebarToggleFixed').addEventListener('click', function() {
            chatSidebar.classList.remove('collapsed');
        });
    }
    
    // 发送消息
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (!message) {
            return;
        }
        
        // 清空输入框
        userInput.value = '';
        
        // 添加用户消息到聊天窗口
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'message user-message';
        userMessageElement.textContent = message;
        chatMessages.appendChild(userMessageElement);
        
        // 添加思考中的消息
        const thinkingElement = document.createElement('div');
        thinkingElement.className = 'message bot-message thinking';
        thinkingElement.textContent = '思考中...';
        chatMessages.appendChild(thinkingElement);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        try {
            // 调用API生成PRD
            const prdResponse = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: message,
                    type: 'prd',
                    projectId: currentProjectId,
                    previousContent: currentPRD
                }),
            });
            
            const prdData = await prdResponse.json();
            
            if (prdData.success) {
                // 更新当前PRD内容
                currentPRD = prdData.content;
                currentProjectId = prdData.projectId;
                
                // 移除思考中的消息
                chatMessages.removeChild(thinkingElement);
                
                // 添加机器人消息到聊天窗口
                const botMessageElement = document.createElement('div');
                botMessageElement.className = 'message bot-message';
                botMessageElement.innerHTML = `<p>已生成PRD文档，正在生成UI界面...</p>`;
                chatMessages.appendChild(botMessageElement);
                
                // 滚动到底部
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // 调用API生成UI
                const uiResponse = await fetch('/api/claude', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: message,
                        type: 'ui',
                        projectId: currentProjectId,
                        previousContent: currentUI
                    }),
                });
                
                const uiData = await uiResponse.json();
                
                if (uiData.success) {
                    // 更新当前UI内容
                    currentUI = uiData.content;
                    
                    // 添加完成消息
                    const completeMessageElement = document.createElement('div');
                    completeMessageElement.className = 'message bot-message';
                    completeMessageElement.innerHTML = `<p>PRD文档和UI界面已生成完成！</p>
                        <p>您可以在右侧查看生成的内容。</p>`;
                    chatMessages.appendChild(completeMessageElement);
                    
                    // 滚动到底部
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // 加载项目文件
                    loadProjectFiles(currentProjectId);
                } else {
                    console.error('Error generating UI:', uiData.error);
                    
                    // 添加错误消息
                    const errorMessageElement = document.createElement('div');
                    errorMessageElement.className = 'message bot-message';
                    errorMessageElement.innerHTML = `<p>生成UI界面时出错: ${uiData.error}</p>`;
                    chatMessages.appendChild(errorMessageElement);
                    
                    // 滚动到底部
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            } else {
                console.error('Error generating PRD:', prdData.error);
                
                // 移除思考中的消息
                chatMessages.removeChild(thinkingElement);
                
                // 添加错误消息
                const errorMessageElement = document.createElement('div');
                errorMessageElement.className = 'message bot-message';
                errorMessageElement.innerHTML = `<p>生成PRD文档时出错: ${prdData.error}</p>`;
                chatMessages.appendChild(errorMessageElement);
                
                // 滚动到底部
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // 移除思考中的消息
            chatMessages.removeChild(thinkingElement);
            
            // 添加错误消息
            const errorMessageElement = document.createElement('div');
            errorMessageElement.className = 'message bot-message';
            errorMessageElement.innerHTML = `<p>发送消息时出错，请查看控制台了解详情。</p>`;
            chatMessages.appendChild(errorMessageElement);
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // 点击发送按钮
    sendBtn.addEventListener('click', sendMessage);
    
    // 按Enter键发送消息
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 添加欢迎消息
    const welcomeMessageElement = document.createElement('div');
    welcomeMessageElement.className = 'message bot-message';
    welcomeMessageElement.innerHTML = `<p>欢迎使用PRD & UI生成器！</p>
        <p>请在下方输入您的产品需求描述，我将为您生成PRD文档和UI界面。</p>`;
    chatMessages.appendChild(welcomeMessageElement);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // 加载项目列表
    loadProjectList();
});
// 加载项目列表
async function loadProjectList() {
    try {
        console.log('加载项目列表...');
        
        // 调用API获取项目列表
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (data.success) {
            const projects = data.projects || [];
            
            // 更新文件列表区域显示项目
            fileList.innerHTML = '';
            
            if (projects.length === 0) {
                fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                    <p>暂无项目，请创建新项目</p>
                </div>`;
                return;
            }
            
            // 显示项目列表
            projects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.className = 'file-item';
                
                // 项目图标
                const projectIcon = document.createElement('div');
                projectIcon.className = 'file-item-icon folder';
                projectIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
                    <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                </svg>`;
                
                // 项目名称
                const projectName = document.createElement('div');
                projectName.className = 'file-item-name';
                
                // 格式化创建时间
                const createdAt = new Date(project.createdAt);
                const formattedDate = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')} ${String(createdAt.getHours()).padStart(2, '0')}:${String(createdAt.getMinutes()).padStart(2, '0')}`;
                
                projectName.textContent = `项目 ${project.id} (${formattedDate})`;
                
                // 组合项目项
                projectItem.appendChild(projectIcon);
                projectItem.appendChild(projectName);
                
                // 点击事件
                projectItem.addEventListener('click', function() {
                    // 设置当前项目ID
                    currentProjectId = project.id;
                    
                    // 直接加载项目内容
                    loadProjectContent(project.id);
                    
                    // 显示项目文件
                    showProjectFiles(project.id);
                });
                
                fileList.appendChild(projectItem);
            });
            
            // 清空文件预览
            previewFileName.textContent = '未选择文件';
            filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
                <p>选择一个文件以预览内容</p>
            </div>`;
            downloadFileBtn.disabled = true;
            selectedFile = null;
            
            // 显示项目列表成功消息
            console.log(`已加载 ${projects.length} 个项目`);
            
            // 设置面包屑为根目录
            fileBreadcrumb.innerHTML = `<li class="breadcrumb-item active" aria-current="page">根目录</li>`;
        } else {
            console.error('Error loading projects:', data.error);
            fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                <p>加载项目失败: ${data.error}</p>
            </div>`;
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
            <p>加载项目失败，请查看控制台了解详情。</p>
        </div>`;
    }
}

// 加载项目内容
async function loadProjectContent(projectId) {
    try {
        console.log(`加载项目 ${projectId} 的内容...`);
        
        // 调用API获取项目内容
        const response = await fetch(`/api/projects/${projectId}`);
        const data = await response.json();
        
        if (data.success) {
            const project = data.project;
            
            // 更新当前PRD和UI内容
            currentPRD = project.prd || '';
            currentUI = project.ui || '';
            
            // 显示加载成功消息
            const loadMessage = document.createElement('div');
            loadMessage.className = 'message system-message';
            loadMessage.textContent = `已加载项目 ${projectId}`;
            chatMessages.appendChild(loadMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            console.log(`项目 ${projectId} 内容加载成功`);
        } else {
            console.error('Error loading project content:', data.error);
            
            // 显示加载失败消息
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message system-message';
            errorMessage.textContent = `加载项目 ${projectId} 内容失败: ${data.error}`;
            chatMessages.appendChild(errorMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading project content:', error);
        
        // 显示加载失败消息
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message system-message';
        errorMessage.textContent = `加载项目内容时出错，请查看控制台了解详情。`;
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
// 显示项目文件
function showProjectFiles(projectId, path = '') {
    console.log(`显示项目 ${projectId} 的文件，路径: "${path}"`);
    
    // 更新当前路径
    currentPath = path;
    
    // 更新面包屑导航
    updateBreadcrumbNav(path);
    
    // 显示加载中消息
    fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
        <p>加载项目文件中...</p>
    </div>`;
    
    // 强制添加返回上级目录按钮（无论是否为根目录）
    const addBackButton = () => {
        console.log('添加返回上级目录按钮');
        
        const backItem = document.createElement('div');
        backItem.className = 'file-item back-item';
        backItem.style.backgroundColor = '#f0f8ff';
        backItem.style.fontWeight = 'bold';
        backItem.style.borderBottom = '2px solid #0d6efd';
        
        // 返回图标
        const backIcon = document.createElement('div');
        backIcon.className = 'file-item-icon';
        backIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left-circle" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8zm15 0A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-4.5-.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
        </svg>`;
        
        // 返回文本
        const backName = document.createElement('div');
        backName.className = 'file-item-name';
        backName.textContent = '返回上级目录';
        
        // 组合返回项
        backItem.appendChild(backIcon);
        backItem.appendChild(backName);
        
        // 点击事件
        backItem.addEventListener('click', function() {
            console.log('点击返回上级目录按钮');
            // 返回项目列表
            loadProjectList();
        });
        
        // 添加到文件列表的顶部
        fileList.innerHTML = '';
        fileList.appendChild(backItem);
        
        return backItem;
    };
    
    // 获取项目文件
    fetch(`/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const files = data.files || [];
                currentProjectFiles = files;
                currentPath = path;
                
                // 更新文件列表
                fileList.innerHTML = '';
                
                // 添加返回上级目录按钮
                const backButton = addBackButton();
                
                if (files.length === 0) {
                    // 文件夹为空的情况
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'file-list-empty text-center p-4 text-muted';
                    emptyMessage.innerHTML = '<p>此文件夹为空</p>';
                    fileList.appendChild(emptyMessage);
                    return;
                }
                
                // 分离文件夹和文件
                const folders = files.filter(file => file.type === 'directory');
                const fileItems = files.filter(file => file.type === 'file');
                
                console.log(`文件夹数量: ${folders.length}, 文件数量: ${fileItems.length}`);
                            <p>此项目为空</p>
                        </div>`;
                    } else {
                        fileList.innerHTML += `<div class="file-list-empty text-center p-4 text-muted">
                            <p>此文件夹为空</p>
                        </div>`;
                    }
                    return;
                }
                
                // 分离文件夹和文件
                const folders = files.filter(file => file.type === 'directory');
                const fileItems = files.filter(file => file.type === 'file');
                
                console.log(`文件夹数量: ${folders.length}, 文件数量: ${fileItems.length}`);
                
                // 先显示文件夹，再显示文件
                [...folders, ...fileItems].forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    
                    // 文件图标
                    const fileIcon = document.createElement('div');
                    fileIcon.className = 'file-item-icon';
                    
                    if (file.type === 'directory') {
                        fileIcon.classList.add('folder');
                        fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder" viewBox="0 0 16 16">
                            <path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31zM2.19 4a1 1 0 0 0-.996 1.09l.637 7a1 1 0 0 0 .995.91h10.348a1 1 0 0 0 .995-.91l.637-7A1 1 0 0 0 13.81 4H2.19zm4.69-1.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707z"/>
                        </svg>`;
                    } else {
                        // 根据文件扩展名设置不同的图标和颜色
                        const extension = file.name.split('.').pop().toLowerCase();
                        
                        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
                            fileIcon.classList.add('file-image');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-image" viewBox="0 0 16 16">
                                <path d="M8.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                <path d="M12 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM3 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v8l-2.083-2.083a.5.5 0 0 0-.76.063L8 11 5.835 9.7a.5.5 0 0 0-.611.076L3 12V2z"/>
                            </svg>`;
                        } else if (extension === 'md') {
                            fileIcon.classList.add('file-md');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-markdown" viewBox="0 0 16 16">
                                <path d="M14 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h12zM2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2z"/>
                                <path fill-rule="evenodd" d="M9.146 8.146a.5.5 0 0 1 .708 0L11.5 9.793l1.646-1.647a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708z"/>
                                <path fill-rule="evenodd" d="M11.5 5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5z"/>
                                <path d="M3.56 11V7.01h.056l1.428 3.239h.774l1.42-3.24h.056V11h1.073V5.001h-1.2l-1.71 3.894h-.039l-1.71-3.894H2.5V11h1.06z"/>
                            </svg>`;
                        } else if (extension === 'html') {
                            fileIcon.classList.add('file-html');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-html" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5Zm-9.736 7.35v3.999h-.791v-1.714H1.79v1.714H1V11.85h.791v1.626h1.682V11.85h.79Zm2.251.662v3.337h-.794v-3.337H4.588v-.662h3.064v.662H6.515Zm2.176 3.337v-2.66h.038l.952 2.159h.516l.946-2.16h.038v2.661h.715V11.85h-.8l-1.14 2.596H9.93L8.79 11.85h-.805v3.999h.706Zm4.71-.674h1.696v.674H12.61V11.85h.79v3.325Z"/>
                            </svg>`;
                        } else if (extension === 'css') {
                            fileIcon.classList.add('file-css');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-css" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM3.397 14.841a1.13 1.13 0 0 0 .401.823c.13.108.289.192.478.252.19.061.411.091.665.091.338 0 .624-.053.859-.158.236-.105.416-.252.539-.44.125-.189.187-.408.187-.656 0-.224-.045-.41-.134-.56a1.001 1.001 0 0 0-.375-.357 2.027 2.027 0 0 0-.566-.21l-.621-.144a.97.97 0 0 1-.404-.176.37.37 0 0 1-.144-.299c0-.156.062-.284.185-.384.125-.101.296-.152.512-.152.143 0 .266.023.37.068a.624.624 0 0 1 .246.181.56.56 0 0 1 .12.258h.75a1.092 1.092 0 0 0-.2-.566 1.21 1.21 0 0 0-.5-.41 1.813 1.813 0 0 0-.78-.152c-.293 0-.551.05-.776.15-.225.099-.4.24-.527.421-.127.182-.19.395-.19.639 0 .201.04.376.122.524.082.149.2.27.352.367.152.095.332.167.539.213l.618.144c.207.049.361.113.463.193a.387.387 0 0 1 .152.326.505.505 0 0 1-.085.29.559.559 0 0 1-.255.193c-.111.047-.249.07-.413.07-.117 0-.223-.013-.32-.04a.838.838 0 0 1-.248-.115.578.578 0 0 1-.255-.384h-.765ZM.806 13.693c0-.248.034-.46.102-.633a.868.868 0 0 1 .302-.399.814.814 0 0 1 .475-.137c.15 0 .283.032.398.097a.7.7 0 0 1 .272.26.85.85 0 0 1 .12.381h.765v-.072a1.33 1.33 0 0 0-.466-.964 1.441 1.441 0 0 0-.489-.272 1.838 1.838 0 0 0-.606-.097c-.356 0-.66.074-.911.223-.25.148-.44.359-.572.632-.13.274-.196.6-.196.979v.498c0 .379.064.704.193.976.131.271.322.48.572.626.25.145.554.217.914.217.293 0 .554-.055.785-.164.23-.11.414-.26.55-.454a1.27 1.27 0 0 0 .226-.674v-.076h-.764a.799.799 0 0 1-.118.363.7.7 0 0 1-.272.25.874.874 0 0 1-.401.087.845.845 0 0 1-.478-.132.833.833 0 0 1-.299-.392 1.699 1.699 0 0 1-.102-.627v-.495ZM6.78 15.29a1.176 1.176 0 0 1-.111-.449h.764a.578.578 0 0 0 .255.384c.07.049.154.087.25.114.095.028.201.041.319.041.164 0 .301-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .085-.29.387.387 0 0 0-.153-.326c-.101-.08-.256-.144-.463-.193l-.618-.143a1.72 1.72 0 0 1-.539-.214 1 1 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.304 0 .564.05.779.152.217.102.384.239.5.41.12.17.187.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.246-.181.923.923 0 0 0-.37-.068c-.216 0-.387.05-.512.152a.472.472 0 0 0-.184.384c0 .121.047.22.143.3a.97.97 0 0 0 .404.175l.621.143c.217.05.406.12.566.211.16.09.285.21.375.358.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Z"/>
                            </svg>`;
                        } else if (extension === 'js') {
                            fileIcon.classList.add('file-js');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-js" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2H8v-1h4a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM3.186 15.29a1.176 1.176 0 0 1-.111-.449h.765a.578.578 0 0 0 .255.384c.07.049.153.087.249.114.095.028.202.041.319.041.164 0 .302-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .085-.29.387.387 0 0 0-.153-.326c-.101-.08-.255-.144-.462-.193l-.619-.143a1.72 1.72 0 0 1-.539-.214 1.001 1.001 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.305 0 .564.05.78.152.216.102.383.239.5.41.12.17.186.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.247-.181.923.923 0 0 0-.369-.068c-.217 0-.388.05-.513.152a.472.472 0 0 0-.184.384c0 .121.048.22.143.3a.97.97 0 0 0 .405.175l.62.143c.218.05.406.12.566.211.16.09.285.21.375.358.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-3.104-.033A1.32 1.32 0 0 1 0 14.791h.765a.576.576 0 0 0 .073.27.499.499 0 0 0 .454.246c.19 0 .33-.055.422-.164.092-.11.138-.265.138-.466v-2.745h.79v2.725c0 .44-.119.774-.357 1.005-.236.23-.564.345-.984.345a1.59 1.59 0 0 1-.569-.094 1.145 1.145 0 0 1-.407-.266 1.14 1.14 0 0 1-.243-.39Z"/>
                            </svg>`;
                        } else if (extension === 'json') {
                            fileIcon.classList.add('file-json');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filetype-json" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M14 4.5V11h-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM4.151 15.29a1.176 1.176 0 0 1-.111-.449h.764a.578.578 0 0 0 .255.384c.07.049.154.087.25.114.095.028.201.041.319.041.164 0 .301-.023.413-.07a.559.559 0 0 0 .255-.193.507.507 0 0 0 .084-.29.387.387 0 0 0-.152-.326c-.101-.08-.256-.144-.463-.193l-.618-.143a1.72 1.72 0 0 1-.539-.214 1 1 0 0 1-.351-.367 1.068 1.068 0 0 1-.123-.524c0-.244.063-.457.19-.639.127-.181.303-.322.527-.422.225-.1.484-.149.777-.149.304 0 .564.05.779.152.217.102.384.239.5.41.12.17.187.359.2.566h-.75a.56.56 0 0 0-.12-.258.624.624 0 0 0-.246-.181.923.923 0 0 0-.37-.068c-.216 0-.387.05-.512.152a.472.472 0 0 0-.184.384c0 .121.047.22.143.3a.97.97 0 0 0 .404.175l.621.143c.217.05.406.12.566.211.16.09.285.21.375.358.09.148.135.335.135.56 0 .247-.063.466-.188.656a1.216 1.216 0 0 1-.539.439c-.234.105-.52.158-.858.158-.254 0-.476-.03-.665-.09a1.404 1.404 0 0 1-.478-.252 1.13 1.13 0 0 1-.29-.375Zm-3.104-.033a1.32 1.32 0 0 1-.082-.466h.764a.576.576 0 0 0 .074.27.499.499 0 0 0 .454.246c.19 0 .33-.055.422-.164.091-.11.137-.265.137-.466v-2.745h.791v2.725c0 .44-.119.774-.357 1.005-.237.23-.565.345-.985.345a1.59 1.59 0 0 1-.568-.094 1.145 1.145 0 0 1-.407-.266 1.14 1.14 0 0 1-.243-.39Z"/>
                            </svg>`;
                        } else {
                            fileIcon.classList.add('file');
                            fileIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark" viewBox="0 0 16 16">
                                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                            </svg>`;
                        }
                    }
                    
                    // 文件名
                    const fileName = document.createElement('div');
                    fileName.className = 'file-item-name';
                    fileName.textContent = file.name;
                    
                    // 组合文件项
                    fileItem.appendChild(fileIcon);
                    fileItem.appendChild(fileName);
                    
                    // 点击事件
                    fileItem.addEventListener('click', function() {
                        if (file.type === 'directory') {
                            // 如果是文件夹，则进入该文件夹
                            const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
                            console.log(`进入目录: ${newPath}`);
                            showProjectFiles(currentProjectId, newPath);
                        } else {
                            // 如果是文件，则预览文件
                            showFilePreview(file);
                        }
                    });
                    
                    fileList.appendChild(fileItem);
                });
                
                // 更新面包屑导航
                updateBreadcrumbNav(path);
            } else {
                console.error('Error loading project files:', data.error);
                fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                    <p>加载文件失败: ${data.error}</p>
                </div>`;
            }
        })
        .catch(error => {
            console.error('Error loading project files:', error);
            fileList.innerHTML = `<div class="file-list-empty text-center p-4 text-muted">
                <p>加载文件失败，请查看控制台了解详情。</p>
            </div>`;
        });
}

// 更新面包屑导航
function updateBreadcrumbNav(path) {
    // 清空面包屑
    fileBreadcrumb.innerHTML = '';
    
    // 添加根目录
    const rootItem = document.createElement('li');
    rootItem.className = 'breadcrumb-item';
    
    if (path === '') {
        rootItem.classList.add('active');
        rootItem.setAttribute('aria-current', 'page');
        rootItem.textContent = '根目录';
    } else {
        const rootLink = document.createElement('a');
        rootLink.href = 'javascript:void(0)';
        rootLink.textContent = '根目录';
        rootLink.addEventListener('click', function() {
            showProjectFiles(currentProjectId, '');
        });
        rootItem.appendChild(rootLink);
    }
    
    fileBreadcrumb.appendChild(rootItem);
    
    // 如果有路径，添加路径项
    if (path) {
        const pathParts = path.split('/');
        let currentPath = '';
        
        pathParts.forEach((part, index) => {
            currentPath += (index === 0 ? '' : '/') + part;
            
            const pathItem = document.createElement('li');
            pathItem.className = 'breadcrumb-item';
            
            if (index === pathParts.length - 1) {
                pathItem.classList.add('active');
                pathItem.setAttribute('aria-current', 'page');
                pathItem.textContent = part;
            } else {
                const pathLink = document.createElement('a');
                pathLink.href = 'javascript:void(0)';
                pathLink.textContent = part;
                
                // 闭包保存当前路径
                const savedPath = currentPath;
                pathLink.addEventListener('click', function() {
                    showProjectFiles(currentProjectId, savedPath);
                });
                
                pathItem.appendChild(pathLink);
            }
            
            fileBreadcrumb.appendChild(pathItem);
        });
    }
}

// 显示文件预览
function showFilePreview(file) {
    try {
        console.log(`预览文件: ${file.name}`);
        
        // 设置当前选中的文件
        selectedFile = file;
        
        // 更新文件名
        previewFileName.textContent = file.name;
        
        // 启用下载按钮
        downloadFileBtn.disabled = false;
        
        // 显示加载中
        filePreviewContent.innerHTML = `<div class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <p class="mt-2">加载文件内容中...</p>
        </div>`;
        
        // 获取文件内容
        fetch(`/api/projects/${currentProjectId}/files/content?path=${encodeURIComponent(currentPath ? `${currentPath}/${file.name}` : file.name)}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 更新文件内容
                    const content = data.content;
                    file.content = content; // 保存内容到文件对象
                    
                    // 根据文件类型显示不同的预览
                    const extension = file.name.split('.').pop().toLowerCase();
                    
                    if (extension === 'md') {
                        // Markdown预览
                        filePreviewContent.innerHTML = `<div class="markdown-content">${marked.parse(content)}</div>`;
                    } else if (extension === 'html') {
                        // HTML预览
                        filePreviewContent.innerHTML = `<iframe id="htmlPreview" style="width:100%;height:100%;border:none;"></iframe>`;
                        const iframe = document.getElementById('htmlPreview');
                        iframe.contentWindow.document.open();
                        iframe.contentWindow.document.write(content);
                        iframe.contentWindow.document.close();
                    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
                        // 图片预览
                        filePreviewContent.innerHTML = `<div class="text-center"><img src="data:image/${extension === 'svg' ? 'svg+xml' : extension};base64,${content}" class="img-fluid" alt="${file.name}"></div>`;
                    } else {
                        // 文本预览
                        filePreviewContent.innerHTML = `<pre><code>${content}</code></pre>`;
                    }
                } else {
                    console.error('Error loading file content:', data.error);
                    filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
                        <p>加载文件内容失败: ${data.error}</p>
                    </div>`;
                }
            })
            .catch(error => {
                console.error('Error previewing file:', error);
                filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
                    <p>预览文件时出错，请查看控制台了解详情。</p>
                </div>`;
            });
    } catch (error) {
        console.error('Error previewing file:', error);
        filePreviewContent.innerHTML = `<div class="file-preview-placeholder text-center p-4 text-muted">
            <p>预览文件时出错，请查看控制台了解详情。</p>
        </div>`;
    }
}
