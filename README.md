# Iron Dev Agent - 端到端开发助手

Iron Dev Agent是一个全面的端到端开发助手，通过与AWS Bedrock Q Developer大模型交互，覆盖从需求分析到部署维护的完整开发生命周期。

## 功能特点

- **全生命周期覆盖**：
  - 需求阶段：PRD文档、技术规格、用户故事
  - 设计阶段：UI界面、数据库设计、API设计、架构设计
  - 开发阶段：前端代码、后端代码、数据库迁移
  - 测试阶段：单元测试、集成测试、UI测试
  - 部署阶段：Docker配置、CI/CD流水线、监控配置

- **AI辅助开发**：
  - 与AWS Bedrock Q Developer模型交互
  - 为每个开发阶段提供专业化AI助手
  - 自动生成高质量代码和文档

- **项目管理**：
  - 项目仪表板和进度跟踪
  - 阶段化开发流程
  - 工件版本管理

- **代码编辑与预览**：
  - 集成Monaco代码编辑器
  - 实时UI预览
  - 支持多种编程语言

## 安装与运行

### 依赖条件
- Node.js 14+
- MongoDB (可选，支持文件系统存储模式)
- AWS账户和Bedrock访问权限

### 安装依赖
```bash
npm install
cd client && npm install && cd ..
```

### 配置
创建`.env`文件并设置以下环境变量：
```
PORT=5678
MONGODB_URI=mongodb://localhost:27017/iron-dev-agent
JWT_SECRET=your-secret-key
AWS_REGION=us-east-1
```

### 运行方式

#### 1. 生产模式
```bash
./start.sh
```

#### 2. 开发模式
```bash
./start-dev.sh
```

#### 3. 热重载模式
```bash
./hot-start.sh
```

#### 4. 停止服务
```bash
./stop.sh
```

#### 5. 重启服务
```bash
./restart.sh
```

### 访问应用
在浏览器中访问：
```
http://localhost:5678
```

## 使用方法

1. 注册/登录账户
2. 创建新项目或选择现有项目
3. 选择开发阶段（需求、设计、开发、测试、部署）
4. 使用AI助手生成相应阶段的内容
5. 编辑和保存生成的内容
6. 在各阶段之间无缝切换，推进项目进度

## 技术栈

- **前端**：React, Bootstrap 5, Monaco Editor
- **后端**：Node.js, Express
- **数据库**：MongoDB (可选)
- **AI模型**：AWS Bedrock Q Developer
- **其他**：JWT认证, Socket.IO

## 注意事项

使用前请确保您有有效的AWS凭证，并且有权限访问AWS Bedrock服务。

## 向后兼容性

Iron Dev Agent保持与原PRD & UI生成器的向后兼容性，支持原有的API和文件存储方式。

## 许可证

MIT
