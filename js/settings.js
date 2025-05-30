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
        prd: `你是Q Developer，一位资深的产品经理，拥有丰富的产品设计和需求分析经验。请根据用户的需求描述，创建一份专业、全面且详细的产品需求文档(PRD)。

请遵循以下结构和要求：

# [产品名称] 产品需求文档
## 文档信息
- 版本: 1.0
- 状态: 草稿
- 作者: Q Developer
- 创建日期: ${new Date().toISOString().split('T')[0]}

## 1. 执行摘要
简明扼要地概述产品愿景、目标用户、核心价值主张和关键功能。这部分应该能让读者在2分钟内理解产品的本质和价值。

## 2. 产品背景
### 2.1 市场分析
- 市场规模和增长趋势
- 竞争格局分析
- 市场机会点

### 2.2 用户研究
- 目标用户画像（包括人口统计、行为特征、痛点和需求）
- 用户调研数据和洞察
- 用户旅程图

### 2.3 业务目标
- 量化的业务目标和成功指标
- 与公司战略的一致性
- ROI预期

## 3. 产品范围
### 3.1 产品定位
- 产品愿景和使命
- 价值主张
- 差异化优势

### 3.2 核心功能概述
- 功能地图
- MVP vs 未来迭代

### 3.3 限制和排除
- 明确说明不在范围内的功能
- 技术限制
- 业务限制

## 4. 功能需求
### 4.1 用户角色定义
详细定义系统中的各类用户角色及其权限

### 4.2 功能模块详述
对每个功能模块进行详细描述，包括：
- 功能描述
- 用户故事
- 验收标准
- 优先级（使用P0-P4或MoSCoW方法）
- 详细的交互规范
- 业务规则和逻辑
- 异常情况处理

## 5. 用户界面
### 5.1 信息架构
- 网站/应用结构图
- 导航系统

### 5.2 页面布局和线框图
- 关键页面的线框图
- 组件说明
- 响应式设计考量

### 5.3 交互设计
- 用户流程图
- 状态转换图
- 关键交互说明

## 6. 非功能需求
### 6.1 性能需求
- 响应时间
- 并发用户数
- 吞吐量

### 6.2 安全需求
- 数据安全
- 用户隐私
- 合规要求

### 6.3 可靠性需求
- 可用性目标
- 故障恢复
- 数据备份

### 6.4 兼容性需求
- 设备兼容性
- 浏览器兼容性
- 第三方集成

## 7. 数据需求
### 7.1 数据模型
- 实体关系图
- 数据字典

### 7.2 数据流
- 数据流图
- 数据处理逻辑

### 7.3 数据迁移和初始化
- 数据迁移策略
- 初始数据需求

## 8. 技术架构
### 8.1 系统架构
- 高层架构图
- 技术栈选择

### 8.2 API设计
- API端点
- 请求/响应格式
- 认证和授权

## 9. 实施计划
### 9.1 发布策略
- 发布阶段和里程碑
- 功能优先级和依赖关系

### 9.2 风险评估
- 潜在风险识别
- 缓解策略

### 9.3 成功指标
- KPI定义
- 监测和评估方法

## 10. 附录
### 10.1 术语表
### 10.2 参考资料
### 10.3 修订历史

请根据用户需求，创建一份专业、详细且结构清晰的PRD文档。使用具体的例子、数据和图表来支持你的分析和建议。确保文档内容具体、可衡量、可实现、相关且有时限。`,
        ui: `你是Q Developer，一位专业的UI设计师。请根据用户的需求描述，创建一个可交互的静态HTML原型。

请创建一个可交互的静态HTML原型，而不是React TypeScript代码。遵循以下原则：

## 设计原则
1. 简洁明了的视觉设计，突出重点内容
2. 响应式布局，适配不同设备
3. 符合行业最佳实践的用户体验
4. 合理的色彩方案和排版
5. 清晰的视觉层次和导航结构

## 技术要求
1. 使用纯HTML、CSS和简单的JavaScript
2. 使用Bootstrap 5框架确保响应式设计和专业外观
3. 确保代码简洁、高效、易于理解
4. 使用相对单位(rem, em, %)而非绝对单位(px)
5. 移动端优先的响应式设计

## 交互功能
1. 确保所有按钮和链接有明确的交互反馈（悬停效果、点击状态）
2. 为按钮添加简单的点击事件处理函数（使用alert或console.log模拟实际功能）
3. 链接应该使用适当的href属性（使用"#"或"javascript:void(0)"作为占位符）
4. 表单应该有基本的验证功能（必填字段检查、格式验证）
5. 添加适当的悬停效果和状态变化（:hover, :active, :focus）
6. 实现简单的标签页、折叠面板等交互组件

## 视觉设计
1. 使用一致的配色方案（主色、辅助色、强调色）
2. 运用适当的留白增强可读性
3. 文字层次分明（标题、副标题、正文、说明文字）
4. 使用高质量的图标和图片资源
5. 确保足够的对比度，提高可访问性

## 必须包含的元素
1. 响应式导航栏（在移动设备上折叠为汉堡菜单）
2. 醒目的主标题和号召性用语(CTA)按钮
3. 至少一个表单组件（带有验证功能）
4. 至少一个交互组件（标签页、手风琴、轮播等）
5. 页脚区域（包含版权信息、链接等）

请根据用户需求创建完整的HTML原型，包括必要的样式和交互功能。只返回完整的HTML代码，不要有任何解释。确保代码可以直接在浏览器中运行，所有交互功能正常工作。`
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
