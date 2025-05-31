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
        console.log('更新按钮状态，PRD存在:', !!window.currentPRD);
        
        // API按钮状态 - 依赖PRD
        if (generateAPIBtn) {
            generateAPIBtn.disabled = !window.currentPRD;
        }
        if (downloadAPIBtn) {
            downloadAPIBtn.disabled = !window.lifecycleContent.api;
        }
        
        // 代码按钮状态 - 依赖API
        if (generateCodeBtn) {
            generateCodeBtn.disabled = !window.lifecycleContent.api;
        }
        if (downloadCodeBtn && codeTypeSelector) {
            downloadCodeBtn.disabled = !window.lifecycleContent.code[codeTypeSelector.value];
        }
        
        // 测试按钮状态 - 依赖代码
        const hasAnyCode = Object.values(window.lifecycleContent.code).some(code => code);
        if (generateTestBtn) {
            generateTestBtn.disabled = !hasAnyCode;
        }
        if (downloadTestBtn && testTypeSelector) {
            downloadTestBtn.disabled = !window.lifecycleContent.test[testTypeSelector.value];
        }
        
        // 部署按钮状态 - 依赖代码和测试
        const hasAnyTest = Object.values(window.lifecycleContent.test).some(test => test);
        if (generateDeployBtn) {
            generateDeployBtn.disabled = !hasAnyCode || !hasAnyTest;
        }
        if (downloadDeployBtn && deployTypeSelector) {
            downloadDeployBtn.disabled = !window.lifecycleContent.deploy[deployTypeSelector.value];
        }
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
            
            // 构建提示词，参考PRD和UI
            let prompt = `请根据以下PRD文档和UI设计，生成一份完整的RESTful API文档，使用OpenAPI 3.0规范的YAML格式。\n\n`;
            
            // 添加PRD内容
            prompt += `## PRD文档内容：\n${window.currentPRD}\n\n`;
            
            // 如果有UI设计，也添加到提示中
            if (window.currentUI) {
                prompt += `## UI设计参考：\n我已经设计了UI界面，主要包含以下页面和功能：\n`;
                
                // 提取UI中的关键信息（简化版）
                const uiText = window.currentUI
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<[^>]*>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                // 添加UI摘要（限制长度）
                prompt += uiText.substring(0, 500) + (uiText.length > 500 ? '...' : '');
                prompt += '\n\n';
            }
            
            // 添加具体要求
            prompt += `请生成完整的API文档，包括：
1. 所有必要的API端点
2. 请求和响应的数据结构
3. 错误处理
4. 认证和授权机制
5. 分页和过滤机制（如适用）

请使用OpenAPI 3.0规范的YAML格式。`;
            
            // 调用生命周期API流式生成函数
            callLifecycleAPIStream(prompt, 'api');
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
            
            // 构建提示词，参考PRD、UI和API
            let prompt = `请根据以下PRD文档、UI设计和API文档，生成${getCodeTypeDescription(codeType)}代码。\n\n`;
            
            // 添加PRD摘要
            prompt += `## PRD文档摘要：\n${getSummary(window.currentPRD, 500)}\n\n`;
            
            // 添加API文档
            prompt += `## API文档：\n${window.lifecycleContent.api}\n\n`;
            
            // 根据代码类型添加特定指导
            switch (codeType) {
                case 'frontend':
                    // 添加UI设计参考
                    if (window.currentUI) {
                        prompt += `## UI设计参考：\n${getSummary(stripHtmlTags(window.currentUI), 500)}\n\n`;
                    }
                    
                    prompt += `请生成前端代码，要求：
1. 使用现代前端框架（React、Vue或Angular）
2. 实现所有UI界面和交互
3. 与API进行集成
4. 包含适当的错误处理和加载状态
5. 遵循最佳实践和设计模式
6. 添加必要的注释说明代码功能`;
                    break;
                    
                case 'backend':
                    prompt += `请生成后端代码，要求：
1. 使用适当的后端框架（如Express、Spring Boot、Django等）
2. 实现所有API端点
3. 包含数据验证和错误处理
4. 实现认证和授权机制
5. 遵循RESTful API最佳实践
6. 添加必要的注释说明代码功能`;
                    break;
                    
                case 'database':
                    prompt += `请生成数据库脚本，要求：
1. 创建所有必要的表和关系
2. 定义适当的索引和约束
3. 包含初始化数据（如需要）
4. 使用标准SQL语法
5. 添加注释说明表和字段的用途`;
                    break;
            }
            
            // 调用生命周期API流式生成函数
            callLifecycleAPIStream(prompt, 'code');
        });
    }
    
    // 获取代码类型的描述
    function getCodeTypeDescription(codeType) {
        switch (codeType) {
            case 'frontend': return '前端';
            case 'backend': return '后端';
            case 'database': return '数据库';
            default: return codeType;
        }
    }
    
    // 获取文本摘要
    function getSummary(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
    
    // 去除HTML标签
    function stripHtmlTags(html) {
        if (!html) return '';
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
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
            
            // 构建提示词，参考PRD、API和代码
            let prompt = `请根据以下PRD文档、API文档和代码，生成${getTestTypeDescription(testType)}测试。\n\n`;
            
            // 添加PRD摘要
            prompt += `## PRD文档摘要：\n${getSummary(window.currentPRD, 300)}\n\n`;
            
            // 添加API摘要
            prompt += `## API文档摘要：\n${getSummary(window.lifecycleContent.api, 300)}\n\n`;
            
            // 添加相关代码
            const codeToInclude = getRelevantCodeForTestType(testType);
            prompt += `## 相关代码：\n${codeToInclude}\n\n`;
            
            // 根据测试类型添加特定指导
            switch (testType) {
                case 'unit':
                    prompt += `请生成单元测试，要求：
1. 使用适当的测试框架（如Jest、JUnit、pytest等）
2. 测试所有关键函数和组件
3. 包含正常情况和边界情况的测试用例
4. 使用模拟(mock)隔离依赖
5. 测试覆盖率应达到80%以上
6. 添加必要的注释说明测试目的`;
                    break;
                    
                case 'integration':
                    prompt += `请生成集成测试，要求：
1. 测试组件之间的交互
2. 测试API端点的完整流程
3. 测试数据流和状态管理
4. 包含正常流程和异常流程的测试用例
5. 使用适当的测试数据和环境设置
6. 添加必要的注释说明测试场景`;
                    break;
                    
                case 'e2e':
                    prompt += `请生成端到端测试，要求：
1. 使用适当的E2E测试框架（如Cypress、Selenium、Playwright等）
2. 模拟真实用户行为和流程
3. 测试完整的业务流程
4. 包含UI交互和数据验证
5. 测试关键用户旅程和场景
6. 添加必要的注释说明测试场景和预期结果`;
                    break;
            }
            
            // 调用生命周期API流式生成函数
            callLifecycleAPIStream(prompt, 'test');
        });
    }
    
    // 获取测试类型的描述
    function getTestTypeDescription(testType) {
        switch (testType) {
            case 'unit': return '单元';
            case 'integration': return '集成';
            case 'e2e': return '端到端';
            default: return testType;
        }
    }
    
    // 获取与测试类型相关的代码
    function getRelevantCodeForTestType(testType) {
        let relevantCode = '';
        
        switch (testType) {
            case 'unit':
                // 单元测试主要关注后端代码和前端组件
                if (window.lifecycleContent.code.backend) {
                    relevantCode += `### 后端代码：\n${getSummary(window.lifecycleContent.code.backend, 500)}\n\n`;
                }
                if (window.lifecycleContent.code.frontend) {
                    relevantCode += `### 前端代码：\n${getSummary(window.lifecycleContent.code.frontend, 500)}\n\n`;
                }
                break;
                
            case 'integration':
                // 集成测试关注API和数据库交互
                if (window.lifecycleContent.code.backend) {
                    relevantCode += `### 后端代码：\n${getSummary(window.lifecycleContent.code.backend, 400)}\n\n`;
                }
                if (window.lifecycleContent.code.database) {
                    relevantCode += `### 数据库结构：\n${getSummary(window.lifecycleContent.code.database, 400)}\n\n`;
                }
                break;
                
            case 'e2e':
                // 端到端测试关注前端和完整流程
                if (window.lifecycleContent.code.frontend) {
                    relevantCode += `### 前端代码：\n${getSummary(window.lifecycleContent.code.frontend, 800)}\n\n`;
                }
                break;
        }
        
        return relevantCode || '暂无相关代码';
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
            
            // 构建提示词，参考PRD、API、代码和测试
            let prompt = `请根据以下项目信息，生成${getDeployTypeDescription(deployType)}部署方案。\n\n`;
            
            // 添加PRD摘要
            prompt += `## 项目概述：\n${getSummary(window.currentPRD, 300)}\n\n`;
            
            // 添加API摘要
            prompt += `## API概述：\n${getSummary(window.lifecycleContent.api, 300)}\n\n`;
            
            // 添加代码架构信息
            prompt += `## 技术栈信息：\n`;
            if (window.lifecycleContent.code.frontend) {
                prompt += `### 前端技术：\n${extractTechStack(window.lifecycleContent.code.frontend, 'frontend')}\n\n`;
            }
            if (window.lifecycleContent.code.backend) {
                prompt += `### 后端技术：\n${extractTechStack(window.lifecycleContent.code.backend, 'backend')}\n\n`;
            }
            if (window.lifecycleContent.code.database) {
                prompt += `### 数据库技术：\n${extractTechStack(window.lifecycleContent.code.database, 'database')}\n\n`;
            }
            
            // 添加测试信息摘要
            const testSummary = getTestSummary();
            if (testSummary) {
                prompt += `## 测试概述：\n${testSummary}\n\n`;
            }
            
            // 根据部署类型添加特定指导
            switch (deployType) {
                case 'docker':
                    prompt += `请生成Docker部署方案，要求：
1. 提供完整的Dockerfile
2. 包含多阶段构建优化
3. 配置适当的环境变量
4. 设置健康检查
5. 提供docker-compose.yml（如适用）
6. 添加必要的注释和说明
7. 考虑安全最佳实践`;
                    break;
                    
                case 'kubernetes':
                    prompt += `请生成Kubernetes部署方案，要求：
1. 提供所有必要的K8s资源定义（Deployment, Service, ConfigMap等）
2. 配置适当的资源请求和限制
3. 设置健康检查和就绪探针
4. 配置水平自动扩展
5. 设置持久化存储（如需要）
6. 配置Ingress或Service暴露服务
7. 添加必要的注释和说明
8. 考虑安全最佳实践`;
                    break;
                    
                case 'serverless':
                    prompt += `请生成Serverless部署方案，要求：
1. 选择适当的Serverless平台（AWS Lambda, Azure Functions, Google Cloud Functions等）
2. 提供完整的配置文件（如serverless.yml）
3. 定义API网关配置
4. 配置适当的触发器
5. 设置环境变量和权限
6. 配置数据持久化方案
7. 添加必要的注释和说明
8. 考虑冷启动和性能优化`;
                    break;
            }
            
            // 调用生命周期API流式生成函数
            callLifecycleAPIStream(prompt, 'deploy');
        });
    }
    
    // 获取部署类型的描述
    function getDeployTypeDescription(deployType) {
        switch (deployType) {
            case 'docker': return 'Docker';
            case 'kubernetes': return 'Kubernetes';
            case 'serverless': return 'Serverless';
            default: return deployType;
        }
    }
    
    // 提取技术栈信息
    function extractTechStack(code, type) {
        if (!code) return '未提供相关代码';
        
        let techInfo = '';
        
        // 根据代码类型提取关键技术信息
        switch (type) {
            case 'frontend':
                // 检查前端框架
                if (code.includes('React') || code.includes('react')) {
                    techInfo += '- React框架\n';
                } else if (code.includes('Vue') || code.includes('vue')) {
                    techInfo += '- Vue.js框架\n';
                } else if (code.includes('Angular') || code.includes('angular')) {
                    techInfo += '- Angular框架\n';
                }
                
                // 检查状态管理
                if (code.includes('Redux') || code.includes('redux')) {
                    techInfo += '- Redux状态管理\n';
                } else if (code.includes('Vuex') || code.includes('vuex')) {
                    techInfo += '- Vuex状态管理\n';
                }
                
                // 检查UI库
                if (code.includes('Bootstrap') || code.includes('bootstrap')) {
                    techInfo += '- Bootstrap UI库\n';
                } else if (code.includes('Material-UI') || code.includes('material-ui')) {
                    techInfo += '- Material-UI组件库\n';
                } else if (code.includes('Ant Design') || code.includes('antd')) {
                    techInfo += '- Ant Design组件库\n';
                }
                break;
                
            case 'backend':
                // 检查后端框架
                if (code.includes('Express') || code.includes('express')) {
                    techInfo += '- Express.js框架\n';
                } else if (code.includes('Spring') || code.includes('spring')) {
                    techInfo += '- Spring框架\n';
                } else if (code.includes('Django') || code.includes('django')) {
                    techInfo += '- Django框架\n';
                } else if (code.includes('Flask') || code.includes('flask')) {
                    techInfo += '- Flask框架\n';
                }
                
                // 检查语言
                if (code.includes('function') || code.includes('const') || code.includes('let')) {
                    techInfo += '- JavaScript/Node.js\n';
                } else if (code.includes('public class') || code.includes('private') || code.includes('@Controller')) {
                    techInfo += '- Java\n';
                } else if (code.includes('def ') || code.includes('import ') && code.includes('from ')) {
                    techInfo += '- Python\n';
                }
                break;
                
            case 'database':
                // 检查数据库类型
                if (code.includes('CREATE TABLE') || code.includes('INSERT INTO')) {
                    techInfo += '- SQL关系型数据库\n';
                }
                
                if (code.toLowerCase().includes('mysql')) {
                    techInfo += '- MySQL数据库\n';
                } else if (code.toLowerCase().includes('postgresql')) {
                    techInfo += '- PostgreSQL数据库\n';
                } else if (code.toLowerCase().includes('mongodb')) {
                    techInfo += '- MongoDB NoSQL数据库\n';
                }
                break;
        }
        
        return techInfo || '无法确定具体技术栈，请根据代码自行判断';
    }
    
    // 获取测试摘要
    function getTestSummary() {
        let summary = '';
        
        if (window.lifecycleContent.test.unit) {
            summary += '- 已实现单元测试\n';
        }
        
        if (window.lifecycleContent.test.integration) {
            summary += '- 已实现集成测试\n';
        }
        
        if (window.lifecycleContent.test.e2e) {
            summary += '- 已实现端到端测试\n';
        }
        
        return summary || '暂无测试信息';
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
    
    // 导出updateButtonStates函数到全局，以便其他模块调用
    window.updateButtonStates = updateButtonStates;
    
    // 保存生命周期内容到服务器
    async function saveLifecycleContent() {
        if (!window.currentProjectId) return;
        
        try {
            const response = await fetch(`/api/projects/${window.currentProjectId}/lifecycle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(window.lifecycleContent)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                console.error('保存生命周期内容失败:', data.error);
            } else {
                console.log('生命周期内容已保存');
            }
        } catch (error) {
            console.error('保存生命周期内容出错:', error);
        }
    }
    
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
            
            // 保存生命周期内容到服务器
            saveLifecycleContent();
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
            
            // 保存生命周期内容到服务器
            saveLifecycleContent();
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
            
            // 保存生命周期内容到服务器
            saveLifecycleContent();
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
            
            // 保存生命周期内容到服务器
            saveLifecycleContent();
        }
        
        // 确保所有按钮状态被重置
        resetAllButtonStates();
    };
});
    // 调用Claude API流式生成内容
    async function callLifecycleAPIStream(prompt, type) {
        // 获取相应的内容元素
        let contentElement;
        switch (type) {
            case 'api':
                contentElement = apiContent;
                break;
            case 'code':
                contentElement = codeContent;
                break;
            case 'test':
                contentElement = testContent;
                break;
            case 'deploy':
                contentElement = deployContent;
                break;
            default:
                console.error('未知的生成类型:', type);
                return;
        }
        
        // 创建流式预览容器
        let previewContent = '';
        let previewElement;
        
        // 根据类型设置不同的预览样式
        if (type === 'api' || type === 'test' || type === 'deploy') {
            // Markdown类型的内容
            contentElement.innerHTML = '<div class="streaming-content markdown-preview"><div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>生成中...</div>';
            previewElement = contentElement.querySelector('.streaming-content');
        } else if (type === 'code') {
            // 代码类型的内容
            contentElement.innerHTML = `
                <div class="code-preview-container">
                    <div class="code-header d-flex justify-content-between align-items-center">
                        <span>代码生成中...</span>
                        <span class="badge bg-light text-dark progress-badge">0%</span>
                    </div>
                    <pre class="code-preview position-relative">
                        <code class="streaming-content"></code>
                        <span class="blinking-cursor position-absolute"></span>
                    </pre>
                    <div class="progress mt-2">
                        <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            `;
            previewElement = contentElement.querySelector('.streaming-content');
        }
        
        try {
            // 准备请求参数
            const requestBody = { 
                prompt, 
                type,
                projectId: window.currentProjectId
            };
            
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
            let fullContent = '';
            
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
                                // 初始化任务
                                console.log('生命周期任务已初始化:', data.taskId);
                            } else if (data.type === 'chunk') {
                                // 添加内容块
                                previewContent += data.content;
                                fullContent += data.content;
                                
                                // 更新预览区域
                                if (type === 'api' || type === 'test' || type === 'deploy') {
                                    // Markdown类型的内容
                                    previewElement.innerHTML = marked.parse(previewContent);
                                    
                                    // 滚动到底部
                                    contentElement.scrollTop = contentElement.scrollHeight;
                                } else if (type === 'code') {
                                    // 代码类型的内容
                                    previewElement.textContent = previewContent;
                                    
                                    // 更新进度
                                    const progress = Math.min(Math.round((previewContent.length / 10000) * 100), 100);
                                    contentElement.querySelector('.progress-bar').style.width = `${progress}%`;
                                    contentElement.querySelector('.progress-bar').setAttribute('aria-valuenow', progress);
                                    contentElement.querySelector('.progress-badge').textContent = `${progress}%`;
                                    
                                    // 滚动到底部
                                    const codePreview = contentElement.querySelector('.code-preview');
                                    if (codePreview) {
                                        codePreview.scrollTop = codePreview.scrollHeight;
                                    }
                                }
                                
                                // 保存到生命周期内容
                                switch (type) {
                                    case 'api':
                                        window.lifecycleContent.api = previewContent;
                                        break;
                                    case 'code':
                                        window.lifecycleContent.code[codeTypeSelector.value] = previewContent;
                                        break;
                                    case 'test':
                                        window.lifecycleContent.test[testTypeSelector.value] = previewContent;
                                        break;
                                    case 'deploy':
                                        window.lifecycleContent.deploy[deployTypeSelector.value] = previewContent;
                                        break;
                                }
                            } else if (data.type === 'done') {
                                // 完成生成
                                console.log(`${type}生成完成`);
                                
                                // 调用完成回调
                                window.onStreamComplete(type, previewContent);
                                
                                return previewContent;
                            } else if (data.type === 'error') {
                                throw new Error(data.error);
                            }
                        } catch (parseError) {
                            if (parseError instanceof SyntaxError) {
                                // 不完整的JSON，继续收集
                                console.log('收到不完整的JSON数据，继续等待...');
                                continue;
                            } else {
                                console.error('解析过程中出现意外错误:', parseError);
                            }
                        }
                    }
                }
            }
            
            // 如果流正常结束但没有收到done事件，也调用完成回调
            window.onStreamComplete(type, previewContent);
            return previewContent;
            
        } catch (error) {
            console.error(`${type}生成出错:`, error);
            
            // 恢复按钮状态
            switch (type) {
                case 'api':
                    if (generateAPIBtn) {
                        generateAPIBtn.disabled = false;
                        generateAPIBtn.innerHTML = '生成API文档';
                    }
                    break;
                case 'code':
                    if (generateCodeBtn) {
                        generateCodeBtn.disabled = false;
                        generateCodeBtn.innerHTML = '生成代码';
                    }
                    break;
                case 'test':
                    if (generateTestBtn) {
                        generateTestBtn.disabled = false;
                        generateTestBtn.innerHTML = '生成测试';
                    }
                    break;
                case 'deploy':
                    if (generateDeployBtn) {
                        generateDeployBtn.disabled = false;
                        generateDeployBtn.innerHTML = '生成部署方案';
                    }
                    break;
            }
            
            // 显示错误信息
            contentElement.innerHTML = `<div class="alert alert-danger">生成${type}时出错: ${error.message}</div>`;
            
            return null;
        }
    }
