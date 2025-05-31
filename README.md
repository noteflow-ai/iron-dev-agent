# Iron端到端智能开发平台

这是一个精简的Web服务，通过与AWS Bedrock Q Developer大模型交互，生成专业的PRD文档和UI界面预览。

## 功能特点

- 左侧聊天区域：与Q Developer模型交互
- 右侧预览区域：包含两个Tab
  - PRD.md预览：显示生成的产品需求文档
  - UI.html预览：显示生成的UI界面
- 支持项目保存和管理：自动保存生成的内容，支持项目切换和删除
- 交互式UI预览：可点击按钮和链接，在新窗口中查看交互效果

## 安装与运行

1. 安装依赖：
```
npm install
```

2. 启动服务：
```
npm start
```
或使用后台运行脚本：
```
./start.sh
```

3. 在浏览器中访问：
```
http://localhost:5678
```

4. 停止服务：
```
./stop.sh
```

## 使用方法

1. 在左侧聊天框中输入您的产品需求描述
2. 点击"发送"按钮或按Enter键发送消息
3. 等待AI生成PRD文档和UI界面
4. 在右侧Tab中查看生成的内容
5. 可以点击"下载PRD"或"下载UI"按钮保存生成的内容
6. 使用项目选择器可以切换或删除已保存的项目

## 技术栈

- 前端：HTML, CSS, JavaScript, Bootstrap 5
- 后端：Node.js, Express
- AI模型：AWS Bedrock Q Developer
- Markdown渲染：marked.js

## 注意事项

使用前请确保您有有效的AWS凭证，并且有权限访问AWS Bedrock服务。
