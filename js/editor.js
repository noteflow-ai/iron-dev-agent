/**
 * 项目编辑器功能
 * 提供目录树浏览和编辑项目各阶段产出物的功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 编辑器相关DOM元素
    const fileTree = document.getElementById('fileTree');
    const codeEditor = document.getElementById('codeEditor');
    const currentFilePath = document.getElementById('currentFilePath');
    const saveFileBtn = document.getElementById('saveFileBtn');
    const refreshEditorBtn = document.getElementById('refreshEditorBtn');
    const createFileBtn = document.getElementById('createFileBtn');
    
    // 当前编辑的文件信息
    let currentFile = {
        path: '',
        content: '',
        type: ''
    };
    
    // 编辑器实例
    let editor = null;
    
    // 初始化Monaco编辑器
    function initMonacoEditor() {
        // 设置Monaco编辑器的CDN路径
        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.40.0/min/vs' }});
        
        // 加载编辑器
        require(['vs/editor/editor.main'], function() {
            // 创建编辑器实例
            editor = monaco.editor.create(codeEditor, {
                value: '// 请选择一个文件进行编辑',
                language: 'plaintext',
                theme: 'vs',
                automaticLayout: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2,
                wordWrap: 'on'
            });
            
            // 监听编辑器内容变化
            editor.onDidChangeModelContent(function() {
                // 标记文件已修改
                if (currentFile.path) {
                    saveFileBtn.classList.add('btn-warning');
                    saveFileBtn.classList.remove('btn-primary');
                }
            });
            
            // 初始化文件树
            initFileTree();
        });
    }
    
    // 初始化文件树
    function initFileTree() {
        // 检查是否有选中的项目
        const projectSelect = document.getElementById('projectSelect');
        if (!projectSelect || !projectSelect.value) {
            fileTree.innerHTML = '<p class="text-muted small">请先选择一个项目</p>';
            return;
        }
        
        const projectId = projectSelect.value;
        if (projectId === '') {
            fileTree.innerHTML = '<p class="text-muted small">请先选择一个已有项目</p>';
            return;
        }
        
        // 显示加载状态
        fileTree.innerHTML = '<div class="d-flex justify-content-center my-3"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // 构建项目文件树结构
        buildProjectFileTree(projectId);
    }
    
    // 构建项目文件树结构
    function buildProjectFileTree(projectId) {
        console.log('构建项目文件树，项目ID:', projectId);
        
        // 获取项目数据
        fetchProjectData(projectId).then(projectData => {
            if (!projectData) {
                fileTree.innerHTML = '<p class="text-muted small">无法加载项目数据</p>';
                return;
            }
            
            console.log('获取到项目数据:', projectData);
            
            // 构建文件树结构
            const treeStructure = createFileTreeStructure(projectData);
            
            // 渲染文件树
            fileTree.innerHTML = renderFileTree(treeStructure);
            
            console.log('文件树已渲染');
        }).catch(error => {
            console.error('加载项目文件树出错:', error);
            fileTree.innerHTML = '<p class="text-danger small">加载项目文件失败</p>';
        });
    }
    
    // 获取项目数据
    async function fetchProjectData(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.project;
            } else {
                console.error('获取项目数据失败:', data.error);
                return null;
            }
        } catch (error) {
            console.error('获取项目数据出错:', error);
            return null;
        }
    }
    
    // 创建文件树结构
    function createFileTreeStructure(projectData) {
        // 创建根目录
        const root = {
            name: '项目文件',
            type: 'folder',
            path: '/',
            children: []
        };
        
        // 添加PRD文件
        if (projectData.prd) {
            root.children.push({
                name: 'PRD.md',
                type: 'file',
                fileType: 'md',
                path: '/PRD.md',
                content: projectData.prd
            });
        }
        
        // 添加UI文件
        if (projectData.ui) {
            root.children.push({
                name: 'UI.html',
                type: 'file',
                fileType: 'html',
                path: '/UI.html',
                content: projectData.ui
            });
        }
        
        // 添加API文件
        if (window.lifecycleContent && window.lifecycleContent.api) {
            root.children.push({
                name: 'API.yaml',
                type: 'file',
                fileType: 'yaml',
                path: '/API.yaml',
                content: window.lifecycleContent.api
            });
        }
        
        // 添加代码文件夹
        if (window.lifecycleContent && Object.values(window.lifecycleContent.code).some(code => code)) {
            const codeFolder = {
                name: '代码',
                type: 'folder',
                path: '/code',
                children: []
            };
            
            // 前端代码
            if (window.lifecycleContent.code.frontend) {
                codeFolder.children.push({
                    name: 'frontend.js',
                    type: 'file',
                    fileType: 'js',
                    path: '/code/frontend.js',
                    content: window.lifecycleContent.code.frontend
                });
            }
            
            // 后端代码
            if (window.lifecycleContent.code.backend) {
                codeFolder.children.push({
                    name: 'backend.js',
                    type: 'file',
                    fileType: 'js',
                    path: '/code/backend.js',
                    content: window.lifecycleContent.code.backend
                });
            }
            
            // 数据库脚本
            if (window.lifecycleContent.code.database) {
                codeFolder.children.push({
                    name: 'database.sql',
                    type: 'file',
                    fileType: 'sql',
                    path: '/code/database.sql',
                    content: window.lifecycleContent.code.database
                });
            }
            
            root.children.push(codeFolder);
        }
        
        // 添加测试文件夹
        if (window.lifecycleContent && Object.values(window.lifecycleContent.test).some(test => test)) {
            const testFolder = {
                name: '测试',
                type: 'folder',
                path: '/test',
                children: []
            };
            
            // 单元测试
            if (window.lifecycleContent.test.unit) {
                testFolder.children.push({
                    name: 'unit-tests.js',
                    type: 'file',
                    fileType: 'js',
                    path: '/test/unit-tests.js',
                    content: window.lifecycleContent.test.unit
                });
            }
            
            // 集成测试
            if (window.lifecycleContent.test.integration) {
                testFolder.children.push({
                    name: 'integration-tests.js',
                    type: 'file',
                    fileType: 'js',
                    path: '/test/integration-tests.js',
                    content: window.lifecycleContent.test.integration
                });
            }
            
            // 端到端测试
            if (window.lifecycleContent.test.e2e) {
                testFolder.children.push({
                    name: 'e2e-tests.js',
                    type: 'file',
                    fileType: 'js',
                    path: '/test/e2e-tests.js',
                    content: window.lifecycleContent.test.e2e
                });
            }
            
            root.children.push(testFolder);
        }
        
        // 添加部署文件夹
        if (window.lifecycleContent && Object.values(window.lifecycleContent.deploy).some(deploy => deploy)) {
            const deployFolder = {
                name: '部署',
                type: 'folder',
                path: '/deploy',
                children: []
            };
            
            // Docker部署
            if (window.lifecycleContent.deploy.docker) {
                deployFolder.children.push({
                    name: 'Dockerfile',
                    type: 'file',
                    fileType: 'docker',
                    path: '/deploy/Dockerfile',
                    content: window.lifecycleContent.deploy.docker
                });
            }
            
            // Kubernetes部署
            if (window.lifecycleContent.deploy.kubernetes) {
                deployFolder.children.push({
                    name: 'kubernetes.yaml',
                    type: 'file',
                    fileType: 'yaml',
                    path: '/deploy/kubernetes.yaml',
                    content: window.lifecycleContent.deploy.kubernetes
                });
            }
            
            // Serverless部署
            if (window.lifecycleContent.deploy.serverless) {
                deployFolder.children.push({
                    name: 'serverless.yml',
                    type: 'file',
                    fileType: 'yaml',
                    path: '/deploy/serverless.yml',
                    content: window.lifecycleContent.deploy.serverless
                });
            }
            
            root.children.push(deployFolder);
        }
        
        return root;
    }
    
    // 渲染文件树
    function renderFileTree(node) {
        if (!node) return '';
        
        let html = '';
        
        if (node.type === 'folder') {
            // 如果是根目录，不显示折叠图标
            if (node.path === '/') {
                // 渲染子节点
                if (node.children && node.children.length > 0) {
                    html = '<ul class="list-unstyled mb-0">';
                    node.children.forEach(child => {
                        html += '<li>' + renderFileTree(child) + '</li>';
                    });
                    html += '</ul>';
                } else {
                    html = '<p class="text-muted small">项目中没有文件</p>';
                }
            } else {
                // 渲染文件夹
                html = `
                    <div class="file-item folder-item" data-path="${node.path}">
                        <span class="tree-toggle me-1" data-path="${node.path}">
                            <i class="bi bi-chevron-down"></i>
                        </span>
                        <i class="bi bi-folder-fill file-icon-folder"></i>
                        ${node.name}
                    </div>
                    <div class="folder-content" data-path="${node.path}">
                `;
                
                // 渲染子节点
                if (node.children && node.children.length > 0) {
                    html += '<ul class="list-unstyled mb-0">';
                    node.children.forEach(child => {
                        html += '<li>' + renderFileTree(child) + '</li>';
                    });
                    html += '</ul>';
                }
                
                html += '</div>';
            }
        } else {
            // 渲染文件
            const fileIcon = getFileIcon(node.fileType);
            html = `
                <div class="file-item" data-path="${node.path}" data-type="${node.fileType}">
                    <span class="me-1 invisible" style="width: 16px;"></span>
                    <i class="${fileIcon}"></i>
                    ${node.name}
                </div>
            `;
        }
        
        return html;
    }
    
    // 获取文件图标
    function getFileIcon(fileType) {
        switch (fileType) {
            case 'md':
                return 'bi bi-file-earmark-text file-icon-md';
            case 'html':
                return 'bi bi-file-earmark-code file-icon-html';
            case 'css':
                return 'bi bi-file-earmark-code file-icon-css';
            case 'js':
                return 'bi bi-file-earmark-code file-icon-js';
            case 'json':
                return 'bi bi-file-earmark-code file-icon-json';
            case 'yaml':
            case 'yml':
                return 'bi bi-file-earmark-code file-icon-yaml';
            case 'sql':
                return 'bi bi-file-earmark-code file-icon-json';
            case 'docker':
                return 'bi bi-file-earmark-code file-icon-yaml';
            default:
                return 'bi bi-file-earmark';
        }
    }
    
    // 获取文件语言类型
    function getFileLanguage(fileType) {
        switch (fileType) {
            case 'md':
                return 'markdown';
            case 'html':
                return 'html';
            case 'css':
                return 'css';
            case 'js':
                return 'javascript';
            case 'json':
                return 'json';
            case 'yaml':
            case 'yml':
                return 'yaml';
            case 'sql':
                return 'sql';
            case 'docker':
                return 'dockerfile';
            default:
                return 'plaintext';
        }
    }
    
    // 打开文件
    function openFile(path, fileType) {
        // 查找文件内容
        let fileContent = '';
        
        // 根据路径获取文件内容
        if (path === '/PRD.md') {
            fileContent = window.currentPRD || '';
        } else if (path === '/UI.html') {
            fileContent = window.currentUI || '';
        } else if (path === '/API.yaml') {
            fileContent = window.lifecycleContent?.api || '';
        } else if (path === '/code/frontend.js') {
            fileContent = window.lifecycleContent?.code?.frontend || '';
        } else if (path === '/code/backend.js') {
            fileContent = window.lifecycleContent?.code?.backend || '';
        } else if (path === '/code/database.sql') {
            fileContent = window.lifecycleContent?.code?.database || '';
        } else if (path === '/test/unit-tests.js') {
            fileContent = window.lifecycleContent?.test?.unit || '';
        } else if (path === '/test/integration-tests.js') {
            fileContent = window.lifecycleContent?.test?.integration || '';
        } else if (path === '/test/e2e-tests.js') {
            fileContent = window.lifecycleContent?.test?.e2e || '';
        } else if (path === '/deploy/Dockerfile') {
            fileContent = window.lifecycleContent?.deploy?.docker || '';
        } else if (path === '/deploy/kubernetes.yaml') {
            fileContent = window.lifecycleContent?.deploy?.kubernetes || '';
        } else if (path === '/deploy/serverless.yml') {
            fileContent = window.lifecycleContent?.deploy?.serverless || '';
        }
        
        // 更新当前文件信息
        currentFile = {
            path: path,
            content: fileContent,
            type: fileType
        };
        
        // 更新文件路径显示
        currentFilePath.textContent = path;
        
        // 更新编辑器内容和语言
        const language = getFileLanguage(fileType);
        
        // 如果编辑器已经初始化
        if (editor) {
            // 更新编辑器模型
            const model = monaco.editor.createModel(fileContent, language);
            editor.setModel(model);
            
            // 重置保存按钮状态
            saveFileBtn.classList.add('btn-primary');
            saveFileBtn.classList.remove('btn-warning');
        }
        
        // 高亮当前选中的文件
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.path === path) {
                item.classList.add('active');
            }
        });
    }
    
    // 保存文件
    function saveFile() {
        if (!currentFile.path) return;
        
        // 获取编辑器内容
        const content = editor.getValue();
        
        // 根据路径保存文件内容
        if (currentFile.path === '/PRD.md') {
            window.currentPRD = content;
            // 更新PRD预览
            const prdContent = document.getElementById('prdContent');
            if (prdContent) {
                prdContent.innerHTML = marked.parse(content);
            }
        } else if (currentFile.path === '/UI.html') {
            window.currentUI = content;
            // 更新UI预览
            const uiPreview = document.getElementById('uiPreview');
            if (uiPreview) {
                uiPreview.srcdoc = content;
            }
        } else if (currentFile.path === '/API.yaml') {
            if (window.lifecycleContent) window.lifecycleContent.api = content;
            // 更新API预览
            const apiContent = document.getElementById('apiContent');
            if (apiContent) {
                apiContent.innerHTML = marked.parse(content);
            }
        } else if (currentFile.path === '/code/frontend.js') {
            if (window.lifecycleContent?.code) window.lifecycleContent.code.frontend = content;
        } else if (currentFile.path === '/code/backend.js') {
            if (window.lifecycleContent?.code) window.lifecycleContent.code.backend = content;
        } else if (currentFile.path === '/code/database.sql') {
            if (window.lifecycleContent?.code) window.lifecycleContent.code.database = content;
        } else if (currentFile.path === '/test/unit-tests.js') {
            if (window.lifecycleContent?.test) window.lifecycleContent.test.unit = content;
        } else if (currentFile.path === '/test/integration-tests.js') {
            if (window.lifecycleContent?.test) window.lifecycleContent.test.integration = content;
        } else if (currentFile.path === '/test/e2e-tests.js') {
            if (window.lifecycleContent?.test) window.lifecycleContent.test.e2e = content;
        } else if (currentFile.path === '/deploy/Dockerfile') {
            if (window.lifecycleContent?.deploy) window.lifecycleContent.deploy.docker = content;
        } else if (currentFile.path === '/deploy/kubernetes.yaml') {
            if (window.lifecycleContent?.deploy) window.lifecycleContent.deploy.kubernetes = content;
        } else if (currentFile.path === '/deploy/serverless.yml') {
            if (window.lifecycleContent?.deploy) window.lifecycleContent.deploy.serverless = content;
        }
        
        // 保存到服务器
        saveProjectData();
        
        // 重置保存按钮状态
        saveFileBtn.classList.add('btn-primary');
        saveFileBtn.classList.remove('btn-warning');
        
        // 显示保存成功提示
        showToast('文件已保存');
    }
    
    // 保存项目数据到服务器
    async function saveProjectData() {
        const projectSelect = document.getElementById('projectSelect');
        if (!projectSelect || !projectSelect.value) return;
        
        const projectId = projectSelect.value;
        if (projectId === '') return;
        
        try {
            // 构建项目数据
            const projectData = {
                prd: window.currentPRD || '',
                ui: window.currentUI || ''
            };
            
            // 发送保存请求
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                console.error('保存项目数据失败:', data.error);
                showToast('保存失败: ' + data.error, 'danger');
            }
        } catch (error) {
            console.error('保存项目数据出错:', error);
            showToast('保存失败: ' + error.message, 'danger');
        }
    }
    
    // 显示提示消息
    function showToast(message, type = 'success') {
        // 创建toast元素
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.innerHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">编辑器提示</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body ${type === 'danger' ? 'text-danger' : ''}">
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
    
    // 创建新文件
    function createNewFile() {
        // 检查是否有选中的项目
        const projectSelect = document.getElementById('projectSelect');
        if (!projectSelect || !projectSelect.value || projectSelect.value === '') {
            showToast('请先选择一个已有项目', 'danger');
            return;
        }
        
        // 创建模态框
        const modalHtml = `
            <div class="modal fade" id="createFileModal" tabindex="-1" aria-labelledby="createFileModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="createFileModalLabel">创建新文件</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body modal-file-create">
                            <div class="mb-3">
                                <label for="filePathInput" class="form-label">文件路径</label>
                                <input type="text" class="form-control" id="filePathInput" placeholder="/path/to/file.ext">
                                <div class="form-text">例如: /docs/readme.md, /code/utils.js</div>
                            </div>
                            <div class="mb-3">
                                <label for="fileContentInput" class="form-label">初始内容</label>
                                <textarea class="form-control" id="fileContentInput" rows="5"></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" id="confirmCreateFileBtn">创建</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加模态框到文档
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 获取模态框元素
        const modalElement = document.getElementById('createFileModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // 显示模态框
        modal.show();
        
        // 绑定创建按钮事件
        document.getElementById('confirmCreateFileBtn').addEventListener('click', function() {
            const filePath = document.getElementById('filePathInput').value.trim();
            const fileContent = document.getElementById('fileContentInput').value;
            
            if (!filePath) {
                showToast('请输入文件路径', 'danger');
                return;
            }
            
            // 确保路径以/开头
            const normalizedPath = filePath.startsWith('/') ? filePath : '/' + filePath;
            
            // 获取文件类型
            const fileExt = normalizedPath.split('.').pop().toLowerCase();
            const fileType = fileExt || 'txt';
            
            // 创建文件
            createCustomFile(normalizedPath, fileContent, fileType);
            
            // 关闭模态框
            modal.hide();
            
            // 移除模态框
            modalElement.addEventListener('hidden.bs.modal', function() {
                document.body.removeChild(modalElement);
            });
        });
    }
    
    // 创建自定义文件
    function createCustomFile(path, content, fileType) {
        // 解析路径
        const pathParts = path.split('/').filter(part => part);
        const fileName = pathParts.pop();
        const dirPath = '/' + pathParts.join('/');
        
        // 创建文件对象
        const fileObj = {
            name: fileName,
            type: 'file',
            fileType: fileType,
            path: path,
            content: content
        };
        
        // 添加到生命周期内容
        if (!window.lifecycleContent) {
            window.lifecycleContent = {
                api: '',
                code: { frontend: '', backend: '', database: '' },
                test: { unit: '', integration: '', e2e: '' },
                deploy: { docker: '', kubernetes: '', serverless: '' },
                custom: {}
            };
        }
        
        if (!window.lifecycleContent.custom) {
            window.lifecycleContent.custom = {};
        }
        
        // 保存自定义文件
        window.lifecycleContent.custom[path] = {
            content: content,
            type: fileType
        };
        
        // 刷新文件树
        initFileTree();
        
        // 打开新创建的文件
        setTimeout(() => {
            openFile(path, fileType);
        }, 500);
        
        // 显示创建成功提示
        showToast(`文件 ${fileName} 已创建`);
    }
    
    // 绑定事件
    function bindEvents() {
        // 文件树点击事件
        if (fileTree) {
            fileTree.addEventListener('click', function(e) {
                // 文件点击事件
                if (e.target.closest('.file-item') && !e.target.closest('.folder-item')) {
                    const fileItem = e.target.closest('.file-item');
                    const path = fileItem.dataset.path;
                    const fileType = fileItem.dataset.type;
                    
                    if (path) {
                        openFile(path, fileType);
                    }
                }
                
                // 文件夹折叠/展开事件
                if (e.target.closest('.tree-toggle')) {
                    const toggle = e.target.closest('.tree-toggle');
                    toggle.classList.toggle('collapsed');
                    
                    const path = toggle.dataset.path;
                    const folderContent = document.querySelector(`.folder-content[data-path="${path}"]`);
                    
                    if (folderContent) {
                        folderContent.style.display = toggle.classList.contains('collapsed') ? 'none' : 'block';
                    }
                }
            });
        }
        
        // 保存文件按钮点击事件
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', saveFile);
        }
        
        // 刷新编辑器按钮点击事件
        if (refreshEditorBtn) {
            refreshEditorBtn.addEventListener('click', initFileTree);
        }
        
        // 创建文件按钮点击事件
        if (createFileBtn) {
            createFileBtn.addEventListener('click', createNewFile);
        }
        
        // 项目选择变更事件
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', function() {
                // 重置当前文件信息
                currentFile = {
                    path: '',
                    content: '',
                    type: ''
                };
                
                // 更新文件路径显示
                currentFilePath.textContent = '未选择文件';
                
                // 更新编辑器内容
                if (editor) {
                    editor.setValue('// 请选择一个文件进行编辑');
                }
                
                // 初始化文件树
                initFileTree();
            });
        }
        
    // 编辑器标签页激活事件
        document.getElementById('editor-tab').addEventListener('shown.bs.tab', function() {
            console.log('编辑器标签页被激活');
            // 如果编辑器尚未初始化，则初始化
            if (!editor) {
                console.log('初始化Monaco编辑器');
                initMonacoEditor();
            } else {
                console.log('编辑器已初始化，刷新文件树');
                // 刷新文件树
                initFileTree();
            }
        });
    }
    
    // 初始化编辑器
    function init() {
        // 绑定事件
        bindEvents();
        
        // 导出initFileTree函数到全局，以便其他模块调用
        window.initFileTree = initFileTree;
    }
    
    // 调用初始化函数
    init();
});
