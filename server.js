const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const app = express();
const port = 5678;

// 创建保存文件的目录
const projectsDir = path.join(__dirname, 'projects');
if (!fs.existsSync(projectsDir)) {
  fs.mkdirSync(projectsDir, { recursive: true });
}

// 登录凭据
const validCredentials = {
  username: 'chuyi',
  password: 'chuyi.123456'
};

// 配置AWS Bedrock客户端
const bedrockClient = new BedrockRuntimeClient({
  region: 'us-east-1', // 使用模型所在的区域
});

// 中间件
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// 登录验证中间件
const authMiddleware = (req, res, next) => {
  // API登录端点不需要验证
  if (req.path === '/api/login') {
    return next();
  }
  
  // 检查Authorization头
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ success: false, error: '未授权访问' });
  }
  
  // 解析Basic认证
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');
  
  // 验证凭据
  if (username === validCredentials.username && password === validCredentials.password) {
    next();
  } else {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
  }
};

// 登录API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === validCredentials.username && password === validCredentials.password) {
    res.json({ success: true });
  } else {
    res.json({ success: false, error: '用户名或密码错误' });
  }
});

// 应用认证中间件到所有API路由
app.use('/api', authMiddleware);

// Claude API调用端点
app.post('/api/claude', async (req, res) => {
  try {
    const { prompt, type, projectId, previousContent, systemPrompt } = req.body;
    
    // 创建或获取项目目录
    const projectDir = projectId ? 
      path.join(projectsDir, projectId) : 
      path.join(projectsDir, Date.now().toString());
    
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    // 如果没有提供projectId，则创建一个新的
    const actualProjectId = projectId || path.basename(projectDir);
    
    // 文件路径
    const prdFilePath = path.join(projectDir, 'PRD.md');
    const uiFilePath = path.join(projectDir, 'UI.html');
    
    // 读取现有内容（如果有）
    let existingContent = '';
    if (type === 'prd' && fs.existsSync(prdFilePath)) {
      existingContent = fs.readFileSync(prdFilePath, 'utf8');
    } else if (type === 'ui' && fs.existsSync(uiFilePath)) {
      existingContent = fs.readFileSync(uiFilePath, 'utf8');
    }
    
    // 使用previousContent参数或文件中的内容
    const contentToModify = previousContent || existingContent;
    
    // 根据请求类型构建不同的提示
    let defaultSystemPrompt = '';
    if (type === 'prd') {
      defaultSystemPrompt = contentToModify ? 
        `你是Q Developer，一位资深的产品经理，拥有丰富的产品设计和需求分析经验。请根据用户的新需求，对现有PRD文档进行增量修改和完善。

请遵循以下原则创建专业、全面且详细的产品需求文档：

1. 文档结构与格式
   - 使用清晰的层级结构和规范的Markdown格式
   - 使用编号系统保持条理性（1.1, 1.2, 1.2.1等）
   - 适当使用表格、列表和引用增强可读性
   - 包含目录以便快速导航

2. 内容质量要求
   - 所有需求必须具体、可衡量、可实现、相关且有时限(SMART)
   - 使用精确的业务术语，避免模糊表述
   - 提供数据支持的分析和决策理由
   - 包含用户故事和场景描述，使需求具有上下文

3. 需求优先级
   - 使用明确的优先级分类（如P0-P4或MoSCoW方法）
   - 解释每个优先级的判定依据
   - 确保关键路径功能得到突出强调

4. 视觉辅助
   - 添加流程图说明用户旅程和系统流程
   - 使用线框图或示意图展示界面布局
   - 提供状态转换图说明复杂交互

5. 技术考量
   - 包含非功能性需求（性能、安全、可扩展性）
   - 考虑技术限制和依赖关系
   - 提供API设计建议或数据模型

请保留原文档中合理的部分，只修改需要更新的内容。确保最终文档专业、全面且具有可执行性。

现有文档内容：\n\n${contentToModify}` :
        `你是Q Developer，一位资深的产品经理，拥有丰富的产品设计和需求分析经验。请根据用户的需求描述，创建一份专业、全面且详细的产品需求文档(PRD)。

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

请根据用户需求，创建一份专业、详细且结构清晰的PRD文档。使用具体的例子、数据和图表来支持你的分析和建议。确保文档内容具体、可衡量、可实现、相关且有时限。`;
    } else if (type === 'ui') {
      defaultSystemPrompt = contentToModify ?
        `你是Q Developer，一位专业的UI设计师。请根据用户的新需求，对现有HTML界面原型进行增量修改和完善。

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

只返回完整的HTML代码，不要有任何解释。确保代码可以直接在浏览器中运行，所有交互功能正常工作。现有界面代码：\n\n${contentToModify}` :
        `你是Q Developer，一位专业的UI设计师。请根据用户的需求描述，创建一个可交互的静态HTML原型。

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

请根据用户需求创建完整的HTML原型，包括必要的样式和交互功能。只返回完整的HTML代码，不要有任何解释。确保代码可以直接在浏览器中运行，所有交互功能正常工作。`;
    }
    
    // 使用提供的系统提示词或默认提示词
    const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
    
    // 调用Claude API
    const params = {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0', // 使用可用的Claude 3 Sonnet模型
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 100000, // 增加到最大token数
        system: finalSystemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      })
    };

    const command = new InvokeModelCommand(params);
    const response = await bedrockClient.send(command);
    
    // 解析响应
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // 保存到文件
    if (type === 'prd') {
      fs.writeFileSync(prdFilePath, content);
    } else if (type === 'ui') {
      fs.writeFileSync(uiFilePath, content);
    }
    
    res.json({ 
      success: true, 
      content,
      projectId: actualProjectId
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务器 - 绑定到所有网络接口
app.listen(port, '0.0.0.0', () => {
  const isHotReload = process.env.NODE_ENV === 'development';
  console.log(`PRD & UI 生成器服务已启动: http://localhost:${port}`);
  
  if (isHotReload) {
    console.log('热部署模式已启用，文件变更将自动重启服务器');
    console.log('监视的文件: server.js, js/, css/, index.html');
    console.log('忽略的目录: projects/, node_modules/, .git/');
  }
});
// 获取项目列表
app.get('/api/projects', (req, res) => {
  try {
    const projects = fs.readdirSync(projectsDir)
      .filter(dir => fs.statSync(path.join(projectsDir, dir)).isDirectory())
      .map(dir => {
        const projectPath = path.join(projectsDir, dir);
        const hasPRD = fs.existsSync(path.join(projectPath, 'PRD.md'));
        const hasUI = fs.existsSync(path.join(projectPath, 'UI.html'));
        
        return {
          id: dir,
          hasPRD,
          hasUI,
          createdAt: fs.statSync(projectPath).birthtime
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取项目内容
app.get('/api/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(projectsDir, projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    
    const prdPath = path.join(projectPath, 'PRD.md');
    const uiPath = path.join(projectPath, 'UI.html');
    
    const prdContent = fs.existsSync(prdPath) ? fs.readFileSync(prdPath, 'utf8') : '';
    const uiContent = fs.existsSync(uiPath) ? fs.readFileSync(uiPath, 'utf8') : '';
    
    res.json({
      success: true,
      project: {
        id: projectId,
        prd: prdContent,
        ui: uiContent
      }
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// 删除项目
app.delete('/api/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(projectsDir, projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    
    // 递归删除项目目录
    fs.rmSync(projectPath, { recursive: true, force: true });
    
    res.json({ success: true, message: `项目 ${projectId} 已成功删除` });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
