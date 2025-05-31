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
  
  // 根据类型和是否有现有内容选择提示词
  if (type === 'prd') {
    // 如果有现有内容，使用编辑提示词；否则使用创建提示词
    defaultPrompt = contentToModify ? 
      prompts.prd.edit : 
      prompts.prd.create;
  } else if (type === 'ui') {
    // 如果有现有内容，使用编辑提示词；否则使用创建提示词
    defaultPrompt = contentToModify ? 
      prompts.ui.edit : 
      prompts.ui.create;
  }
  
  // 如果有自定义提示词，追加到默认提示词后面，而不是替换
  return customPrompt ? `${defaultPrompt}\n\n${customPrompt}` : defaultPrompt;
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
    const { prompt, type, projectId, previousContent, systemPrompt, resumeTaskId, resumeFrom } = req.body;
    
    // 生成或使用任务ID
    const taskId = resumeTaskId || generateUniqueId();
    
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
    
    // 如果是恢复任务，获取之前的状态
    let startPosition = 0;
    let fullContent = '';
    
    if (resumeTaskId && activeGenerations.has(resumeTaskId)) {
      const savedState = activeGenerations.get(resumeTaskId);
      startPosition = resumeFrom || savedState.position;
      fullContent = savedState.content || '';
    }
    
    // 存储任务状态
    activeGenerations.set(taskId, {
      prompt,
      type,
      projectId: actualProjectId,
      content: fullContent,
      position: startPosition,
      timestamp: Date.now()
    });
    
    // 如果是修改现有内容，将现有内容添加到提示中
    let userPrompt = prompt;
    if (contentToModify) {
      if (type === 'prd') {
        userPrompt = `现有PRD文档内容：\n\n${contentToModify}\n\n用户的新需求：\n\n${prompt}`;
      } else if (type === 'ui') {
        // 对于UI修改，使用增量更新方式
        userPrompt = `现有UI原型代码：\n\n${contentToModify}\n\n用户的修改需求：\n\n${prompt}\n\n请直接按照用户的要求进行修改，不要进行任何形式的评估或建议，只返回修改后的完整HTML代码。请确保修改后的UI严格遵循PRD中定义的功能，保持功能的一致性。请尽可能保留原有代码结构和样式，只修改需要变更的部分，以实现增量更新。`;
      }
    }
    
    // 获取系统提示词
    const finalSystemPrompt = getSystemPrompt(type, contentToModify, systemPrompt);
    
    // 发送初始信息，包含任务ID
    res.write(`data: ${JSON.stringify({ type: 'init', projectId: actualProjectId, taskId: taskId })}\n\n`);
    
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
                  text: userPrompt
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
      const decoder = new TextDecoder('utf-8');
      let currentPosition = startPosition;
      
      // 定期更新任务状态
      const updateInterval = setInterval(() => {
        if (activeGenerations.has(taskId)) {
          activeGenerations.get(taskId).content = fullContent;
          activeGenerations.get(taskId).position = currentPosition;
        }
      }, 5000);
      
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
              currentPosition += textChunk.length;
              
              // 发送数据块给客户端
              res.write(`data: ${JSON.stringify({ type: 'chunk', content: textChunk, position: currentPosition })}\n\n`);
              
              // 更新任务状态
              if (activeGenerations.has(taskId)) {
                activeGenerations.get(taskId).content = fullContent;
                activeGenerations.get(taskId).position = currentPosition;
              }
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
      
      // 清除更新间隔
      clearInterval(updateInterval);
      
      // 保存到文件
      if (type === 'prd') {
        fs.writeFileSync(prdFilePath, fullContent);
      } else if (type === 'ui') {
        fs.writeFileSync(uiFilePath, fullContent);
      }
      
      // 发送完成信息
      res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
      res.end();
      
      // 完成后保留任务状态一段时间，以便可能的重连
      setTimeout(() => {
        activeGenerations.delete(taskId);
      }, 3600000); // 1小时后删除
      
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
    const finalSystemPrompt = systemPrompt ? `${contentToModify ? prompts.ui.edit : prompts.ui.create}\n\n${systemPrompt}` : (contentToModify ? prompts.ui.edit : prompts.ui.create);
    
    // 如果是修改现有内容，将现有内容添加到提示中
    let userPrompt = prompt;
    if (contentToModify) {
      // 检查是否有关联的PRD文件
      const prdFilePath = path.join(projectDir, 'PRD.md');
      let prdContent = '';
      if (fs.existsSync(prdFilePath)) {
        prdContent = fs.readFileSync(prdFilePath, 'utf8');
        userPrompt = `现有UI原型代码：\n\n${contentToModify}\n\n最新PRD文档：\n\n${prdContent}\n\n用户的修改需求：\n\n${prompt}\n\n请直接按照用户的要求进行修改，不要进行任何形式的评估或建议，只返回修改后的完整HTML代码。`;
      } else {
        userPrompt = `现有UI原型代码：\n\n${contentToModify}\n\n用户的修改需求：\n\n${prompt}\n\n请直接按照用户的要求进行修改，不要进行任何形式的评估或建议，只返回修改后的完整HTML代码。`;
      }
    }

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
                  text: userPrompt
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
// 存储活跃的生成任务
const activeGenerations = new Map();

// 生成唯一ID的函数
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
// 更新项目内容
app.put('/api/projects/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const { prd, ui } = req.body;
    const projectPath = path.join(projectsDir, projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    
    // 更新PRD文件（如果提供）
    if (prd !== undefined) {
      const prdPath = path.join(projectPath, 'PRD.md');
      fs.writeFileSync(prdPath, prd);
    }
    
    // 更新UI文件（如果提供）
    if (ui !== undefined) {
      const uiPath = path.join(projectPath, 'UI.html');
      fs.writeFileSync(uiPath, ui);
    }
    
    res.json({
      success: true,
      message: `项目 ${projectId} 已成功更新`
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// 获取项目生命周期内容
app.get('/api/projects/:projectId/lifecycle', (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(projectsDir, projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    
    const lifecyclePath = path.join(projectPath, 'lifecycle.json');
    
    // 如果生命周期文件存在，返回其内容
    if (fs.existsSync(lifecyclePath)) {
      const lifecycleContent = JSON.parse(fs.readFileSync(lifecyclePath, 'utf8'));
      
      res.json({
        success: true,
        lifecycleContent
      });
    } else {
      // 如果文件不存在，返回空的生命周期内容
      res.json({
        success: true,
        lifecycleContent: {
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
        }
      });
    }
  } catch (error) {
    console.error('Error getting project lifecycle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 保存项目生命周期内容
app.put('/api/projects/:projectId/lifecycle', (req, res) => {
  try {
    const { projectId } = req.params;
    const lifecycleContent = req.body;
    const projectPath = path.join(projectsDir, projectId);
    
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: '项目不存在' });
    }
    
    const lifecyclePath = path.join(projectPath, 'lifecycle.json');
    
    // 保存生命周期内容
    fs.writeFileSync(lifecyclePath, JSON.stringify(lifecycleContent, null, 2));
    
    res.json({
      success: true,
      message: `项目 ${projectId} 的生命周期内容已成功保存`
    });
  } catch (error) {
    console.error('Error saving project lifecycle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
