/**
 * 软件开发生命周期阶段管理
 * 处理各个阶段的生成、预览和下载功能
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取各阶段的DOM元素
    const generateAPIBtn = document.getElementById('generateAPIBtn');
    const generateCodeBtn = document.getElementById('generateCodeBtn');
    const generateTestBtn = document.getElementById('generateTestBtn');
    const generateDeployBtn = document.getElementById('generateDeployBtn');
    
    const downloadAPIBtn = document.getElementById('downloadAPI');
    const downloadCodeBtn = document.getElementById('downloadCode');
    const downloadTestBtn = document.getElementById('downloadTest');
    const downloadDeployBtn = document.getElementById('downloadDeploy');
    
    const apiContent = document.getElementById('apiContent');
    const codeContent = document.getElementById('codeContent');
    const testContent = document.getElementById('testContent');
    const deployContent = document.getElementById('deployContent');
    
    const codeTypeSelector = document.getElementById('codeTypeSelector');
    const testTypeSelector = document.getElementById('testTypeSelector');
    const deployTypeSelector = document.getElementById('deployTypeSelector');
    
    // 存储各阶段的内容
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
    
    // 初始化按钮状态
    function updateButtonStates() {
        // API按钮状态 - 依赖PRD
        generateAPIBtn.disabled = !window.currentPRD;
        downloadAPIBtn.disabled = !window.lifecycleContent.api;
        
        // 代码按钮状态 - 依赖API
        generateCodeBtn.disabled = !window.lifecycleContent.api;
        downloadCodeBtn.disabled = !window.lifecycleContent.code[codeTypeSelector.value];
        
        // 测试按钮状态 - 依赖代码
        const hasAnyCode = Object.values(window.lifecycleContent.code).some(code => code);
        generateTestBtn.disabled = !hasAnyCode;
        downloadTestBtn.disabled = !window.lifecycleContent.test[testTypeSelector.value];
        
        // 部署按钮状态 - 依赖代码和测试
        const hasAnyTest = Object.values(window.lifecycleContent.test).some(test => test);
        generateDeployBtn.disabled = !hasAnyCode || !hasAnyTest;
        downloadDeployBtn.disabled = !window.lifecycleContent.deploy[deployTypeSelector.value];
    }
    
    // 生成API文档
    if (generateAPIBtn) {
        generateAPIBtn.addEventListener('click', function() {
            if (!window.currentPRD) {
                alert('请先生成PRD文档');
                return;
            }
            
            // 禁用按钮，防止重复点击
            generateAPIBtn.disabled = true;
            generateAPIBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
            
            // 调用API生成函数
            callClaudeAPIStream('根据PRD生成API文档', 'api');
        });
    }
    
    // 生成代码
    if (generateCodeBtn) {
        generateCodeBtn.addEventListener('click', function() {
            if (!window.lifecycleContent.api) {
                alert('请先生成API文档');
                return;
            }
            
            const codeType = codeTypeSelector.value;
            
            // 禁用按钮，防止重复点击
            generateCodeBtn.disabled = true;
            generateCodeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
            
            // 调用代码生成函数
            callClaudeAPIStream(`根据API文档生成${codeType}代码`, 'code');
        });
    }
    
    // 生成测试
    if (generateTestBtn) {
        generateTestBtn.addEventListener('click', function() {
            const hasAnyCode = Object.values(window.lifecycleContent.code).some(code => code);
            if (!hasAnyCode) {
                alert('请先生成代码');
                return;
            }
            
            const testType = testTypeSelector.value;
            
            // 禁用按钮，防止重复点击
            generateTestBtn.disabled = true;
            generateTestBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
            
            // 调用测试生成函数
            callClaudeAPIStream(`根据代码生成${testType}测试`, 'test');
        });
    }
    
    // 生成部署方案
    if (generateDeployBtn) {
        generateDeployBtn.addEventListener('click', function() {
            const hasAnyCode = Object.values(window.lifecycleContent.code).some(code => code);
            const hasAnyTest = Object.values(window.lifecycleContent.test).some(test => test);
            
            if (!hasAnyCode || !hasAnyTest) {
                alert('请先生成代码和测试');
                return;
            }
            
            const deployType = deployTypeSelector.value;
            
            // 禁用按钮，防止重复点击
            generateDeployBtn.disabled = true;
            generateDeployBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
            
            // 调用部署方案生成函数
            callClaudeAPIStream(`根据代码和测试生成${deployType}部署方案`, 'deploy');
        });
    }
    
    // 下载API文档
    if (downloadAPIBtn) {
        downloadAPIBtn.addEventListener('click', function() {
            if (!window.lifecycleContent.api) return;
            downloadFile('API.yaml', window.lifecycleContent.api);
        });
    }
    
    // 下载代码
    if (downloadCodeBtn) {
        downloadCodeBtn.addEventListener('click', function() {
            const codeType = codeTypeSelector.value;
            const code = window.lifecycleContent.code[codeType];
            if (!code) return;
            
            let filename;
            switch (codeType) {
                case 'frontend':
                    filename = 'frontend-code.zip';
                    break;
                case 'backend':
                    filename = 'backend-code.zip';
                    break;
                case 'database':
                    filename = 'database-scripts.sql';
                    break;
                default:
                    filename = 'code.txt';
            }
            
            downloadFile(filename, code);
        });
    }
    
    // 下载测试
    if (downloadTestBtn) {
        downloadTestBtn.addEventListener('click', function() {
            const testType = testTypeSelector.value;
            const test = window.lifecycleContent.test[testType];
            if (!test) return;
            
            let filename;
            switch (testType) {
                case 'unit':
                    filename = 'unit-tests.js';
                    break;
                case 'integration':
                    filename = 'integration-tests.js';
                    break;
                case 'e2e':
                    filename = 'e2e-tests.js';
                    break;
                default:
                    filename = 'tests.js';
            }
            
            downloadFile(filename, test);
        });
    }
    
    // 下载部署方案
    if (downloadDeployBtn) {
        downloadDeployBtn.addEventListener('click', function() {
            const deployType = deployTypeSelector.value;
            const deploy = window.lifecycleContent.deploy[deployType];
            if (!deploy) return;
            
            let filename;
            switch (deployType) {
                case 'docker':
                    filename = 'Dockerfile';
                    break;
                case 'kubernetes':
                    filename = 'kubernetes-manifests.yaml';
                    break;
                case 'serverless':
                    filename = 'serverless.yml';
                    break;
                default:
                    filename = 'deployment.txt';
            }
            
            downloadFile(filename, deploy);
        });
    }
    
    // 类型选择器变更事件
    if (codeTypeSelector) {
        codeTypeSelector.addEventListener('change', function() {
            const codeType = this.value;
            const code = window.lifecycleContent.code[codeType] || '// 请先生成代码...';
            codeContent.innerHTML = `<pre class="code-preview"><code>${escapeHtml(code)}</code></pre>`;
            updateButtonStates();
        });
    }
    
    if (testTypeSelector) {
        testTypeSelector.addEventListener('change', function() {
            const testType = this.value;
            const test = window.lifecycleContent.test[testType] || '<p class="text-muted">请先生成测试...</p>';
            testContent.innerHTML = test;
            updateButtonStates();
        });
    }
    
    if (deployTypeSelector) {
        deployTypeSelector.addEventListener('change', function() {
            const deployType = this.value;
            const deploy = window.lifecycleContent.deploy[deployType] || '<p class="text-muted">请先生成部署方案...</p>';
            deployContent.innerHTML = deploy;
            updateButtonStates();
        });
    }
    
    // 辅助函数 - HTML转义
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // 初始化按钮状态
    updateButtonStates();
    
    // 扩展现有的onStreamComplete函数，处理新增的生命周期阶段
    const originalOnStreamComplete = window.onStreamComplete;
    window.onStreamComplete = function(type, content) {
        // 调用原始函数处理PRD和UI
        if (type === 'prd' || type === 'ui') {
            originalOnStreamComplete(type, content);
        } else if (type === 'api') {
            // 处理API生成完成
            window.lifecycleContent.api = content;
            apiContent.innerHTML = marked.parse(content);
            
            // 恢复按钮状态
            if (generateAPIBtn) {
                generateAPIBtn.disabled = false;
                generateAPIBtn.innerHTML = '生成API文档';
            }
            
            // 更新所有按钮状态
            updateButtonStates();
            
            // 更新项目编辑器文件树
            if (typeof window.updateEditorFileTree === 'function') {
                window.updateEditorFileTree();
            }
        } else if (type === 'code') {
            // 处理代码生成完成
            const codeType = codeTypeSelector.value;
            window.lifecycleContent.code[codeType] = content;
            codeContent.innerHTML = `<pre class="code-preview"><code>${escapeHtml(content)}</code></pre>`;
            
            // 恢复按钮状态
            if (generateCodeBtn) {
                generateCodeBtn.disabled = false;
                generateCodeBtn.innerHTML = '生成代码';
            }
            
            // 更新所有按钮状态
            updateButtonStates();
            
            // 更新项目编辑器文件树
            if (typeof window.updateEditorFileTree === 'function') {
                window.updateEditorFileTree();
            }
        } else if (type === 'test') {
            // 处理测试生成完成
            const testType = testTypeSelector.value;
            window.lifecycleContent.test[testType] = content;
            testContent.innerHTML = marked.parse(content);
            
            // 恢复按钮状态
            if (generateTestBtn) {
                generateTestBtn.disabled = false;
                generateTestBtn.innerHTML = '生成测试';
            }
            
            // 更新所有按钮状态
            updateButtonStates();
            
            // 更新项目编辑器文件树
            if (typeof window.updateEditorFileTree === 'function') {
                window.updateEditorFileTree();
            }
        } else if (type === 'deploy') {
            // 处理部署方案生成完成
            const deployType = deployTypeSelector.value;
            window.lifecycleContent.deploy[deployType] = content;
            deployContent.innerHTML = marked.parse(content);
            
            // 恢复按钮状态
            if (generateDeployBtn) {
                generateDeployBtn.disabled = false;
                generateDeployBtn.innerHTML = '生成部署方案';
            }
            
            // 更新所有按钮状态
            updateButtonStates();
            
            // 更新项目编辑器文件树
            if (typeof window.updateEditorFileTree === 'function') {
                window.updateEditorFileTree();
            }
        }
        
        // 确保所有按钮状态被重置
        resetAllButtonStates();
    };
});
