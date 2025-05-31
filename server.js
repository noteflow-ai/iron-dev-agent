const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } = require('@aws-sdk/client-bedrock-runtime');
const prompts = require('./config/prompts');

const app = express();
const port = 5678;

// 辅助函数 - 处理项目目录和文件
async function setupProject(projectId, type) {
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
  
  return {
    projectDir,
    actualProjectId,
    prdFilePath,
    uiFilePath,
    existingContent
  };
}

// 辅助函数 - 获取系统提示词
function getSystemPrompt(type, contentToModify, customPrompt) {
  let defaultPrompt = '';
  
  if (type === 'prd') {
    defaultPrompt = prompts.prd.prompt;
  } else if (type === 'ui') {
    defaultPrompt = prompts.ui.prompt;
  }
  
  return customPrompt || defaultPrompt;
}

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
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

// 注意：非流式API端点(/api/claude)已移除，所有功能通过流式API端点(/api/claude/stream)提供

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
// 流式API调用端点
app.post('/api/claude/stream', async (req, res) => {
  try {
    const { prompt, type, projectId, previousContent, systemPrompt } = req.body;
    
    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // 使用辅助函数设置项目
    const { 
      projectDir, 
      actualProjectId, 
      prdFilePath, 
      uiFilePath, 
      existingContent 
    } = await setupProject(projectId, type);
    
    // 使用previousContent参数或文件中的内容
    const contentToModify = previousContent || existingContent;
    
    // 获取系统提示词
    const finalSystemPrompt = getSystemPrompt(type, contentToModify, systemPrompt);
    
    // 发送初始信息
    res.write(`data: ${JSON.stringify({ type: 'init', projectId: actualProjectId })}\n\n`);
    
    try {
      // 使用Bedrock SDK的原生流式输出
      const params = {
        modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0', // 使用Claude 3.7 Sonnet模型
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 131072, // 增加到更大的token数
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

      // 使用流式响应命令
      const command = new InvokeModelWithResponseStreamCommand(params);
      const response = await bedrockClient.send(command);
      
      // 处理流式响应
      let fullContent = '';
      const decoder = new TextDecoder('utf-8');
      
      // 处理流式响应的事件流
      for await (const chunk of response.body) {
        // 解析每个块
        if (chunk.chunk && chunk.chunk.bytes) {
          const decodedChunk = decoder.decode(chunk.chunk.bytes, { stream: true });
          try {
            // 解析JSON响应
            const parsedChunk = JSON.parse(decodedChunk);
            
            // 检查是否有内容
            if (parsedChunk.delta && parsedChunk.delta.text) {
              const textChunk = parsedChunk.delta.text;
              fullContent += textChunk;
              
              // 发送数据块给客户端
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: textChunk })}\n\n`);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
      
      // 保存到文件
      if (type === 'prd') {
        fs.writeFileSync(prdFilePath, fullContent);
      } else if (type === 'ui') {
        fs.writeFileSync(uiFilePath, fullContent);
      }
      
      // 发送完成信息
      res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
      res.end();
      
    } catch (error) {
      console.error('Error calling Claude API:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error in stream API:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});
// Claude Artifacts API调用端点 - 使用流式输出
app.post('/api/claude/artifact', async (req, res) => {
  try {
    const { prompt, projectId, previousContent, systemPrompt, type = 'ui' } = req.body;
    
    // 使用辅助函数设置项目
    const { 
      projectDir, 
      actualProjectId, 
      prdFilePath, 
      uiFilePath, 
      existingContent 
    } = await setupProject(projectId, type);
    
    // 使用previousContent参数或文件中的内容
    const contentToModify = previousContent || existingContent;
    
    // 获取系统提示词
    const finalSystemPrompt = systemPrompt || prompts.ui.prompt;

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // 发送初始信息
    res.write(`data: ${JSON.stringify({ type: 'init', projectId: actualProjectId })}\n\n`);

    try {
      // 调用Claude API，请求HTML Artifact - 使用流式输出
      const params = {
        modelId: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0', // 使用Claude 3.7 Sonnet模型
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 131072, // 增加到更大的token数
          system: finalSystemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `请基于以下PRD需求。创建一个单页应用，严格满足以下规范：
                  
                    #确保PRD里的功能都已经被覆盖，包括细节到字段，只返回完整的HTML代码，不要有任何解释。确保代码可以直接在浏览器中运行，所有交互功能正常工作。
                  
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

                    ## 链接处理
                    1. 不要使用href="#"，这会导致页面跳转
                    2. 对于页面内导航，使用data-navigate属性指定目标页面
                    3. 对于功能按钮，使用javascript:void(0)或者onClick事件处理
                    4. 所有链接必须阻止默认行为，使用e.preventDefault()
                    5. 确保链接点击不会导致页面刷新或跳转

                    ## 交互功能
                    1. 确保所有按钮和链接有明确的交互反馈（悬停效果、点击状态）
                    2. 为按钮添加简单的点击事件处理函数（使用自定义函数模拟实际功能）
                    3. 链接应该使用data-navigate属性或javascript:void(0)，避免使用href="#"
                    4. 表单应该有基本的验证功能（必填字段检查、格式验证）
                    5. 添加适当的悬停效果和状态变化（:hover, :active, :focus）
                    6. 实现简单的标签页、折叠面板等交互组件
                    7. 实现页面间的导航功能，点击链接可以切换到对应页面
                    8. 表单应该有基本的验证功能（必填字段检查、格式验证）
                    9. 实现标签页、折叠面板、模态框等交互组件
                    10. 实现数据的增删改查操作的模拟

                    ## 多页面实现
                    1. 使用单页面应用的方式模拟多页面功能
                    2. 实现主页、列表页、详情页、表单页等PRD中提到的所有页面类型
                    3. 使用JavaScript控制页面切换，保持URL不变
                    4. 所有页面内容都应包含在同一个HTML文件中
                    5. 使用CSS控制不同页面的显示和隐藏

                    ## 视觉设计
                    1. 使用一致的配色方案（主色、辅助色、强调色）
                    2. 运用适当的留白增强可读性
                    3. 文字层次分明（标题、副标题、正文、说明文字）
                    4. 使用高质量的图标和图片资源（可使用Bootstrap图标或Font Awesome）
                    5. 确保足够的对比度，提高可访问性

                    ## 必须包含的元素
                    1. 响应式导航栏（在移动设备上折叠为汉堡菜单）
                    2. 醒目的主标题和号召性用语(CTA)按钮
                    3. 至少一个表单组件（带有验证功能）
                    4. 至少一个交互组件（标签页、手风琴、轮播等）
                    5. 页脚区域（包含版权信息、链接等）

                    ## 数据模拟
                    1. 使用合理的示例数据填充界面
                    2. 确保数据与PRD中描述的业务场景一致
                    3. 模拟API响应和数据交互

                  #确保数据的一致性和真实性。不要使用外部图片链接，而是使用Bootstrap组件和图标创建视觉元素。\n\n${prompt}`
                }
              ]
            }
          ]
        })
      };

      // 使用流式响应命令
      const command = new InvokeModelWithResponseStreamCommand(params);
      const response = await bedrockClient.send(command);
      
      // 处理流式响应
      let fullContent = '';
      const decoder = new TextDecoder('utf-8');
      
      // 处理流式响应的事件流
      for await (const chunk of response.body) {
        // 解析每个块
        if (chunk.chunk && chunk.chunk.bytes) {
          const decodedChunk = decoder.decode(chunk.chunk.bytes, { stream: true });
          try {
            // 解析JSON响应
            const parsedChunk = JSON.parse(decodedChunk);
            
            // 检查是否有内容
            if (parsedChunk.delta && parsedChunk.delta.text) {
              const textChunk = parsedChunk.delta.text;
              fullContent += textChunk;
              
              // 发送数据块给客户端
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: textChunk })}\n\n`);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
      
      // 提取HTML代码
      // 通常Claude会返回完整的HTML代码，但有时可能会包含在代码块中
      let htmlContent = fullContent;
      
      // 尝试从代码块中提取HTML
      const htmlMatch = fullContent.match(/```html\s*([\s\S]*?)\s*```/);
      if (htmlMatch && htmlMatch[1]) {
        htmlContent = htmlMatch[1];
      }
      
      
      
      // 保存到文件
      fs.writeFileSync(uiFilePath, htmlContent);
      
      // 发送完成信息
      res.write(`data: ${JSON.stringify({ type: 'done', content: htmlContent })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Error calling Claude API for artifact:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error in artifact API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
