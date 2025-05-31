# Iron Dev Agent 设置指南

## 启动模式

Iron Dev Agent 提供了多种启动模式，以适应不同的使用场景：

### 1. 传统模式（向后兼容）

这种模式保持与原有PRD & UI生成器完全兼容，使用原始的HTML/JS/CSS架构：

```bash
./start-legacy.sh
```

然后访问 http://localhost:5678

### 2. 开发模式（前后端同时启动）

这种模式同时启动后端API服务和React前端开发服务器：

```bash
./start-dev.sh
```

### 3. 热重载模式（仅后端）

这种模式启动后端服务器，并在文件变更时自动重启：

```bash
./hot-start.sh
```

### 4. 生产模式

这种模式启动优化后的生产版本：

```bash
./start.sh
```

## 故障排除

### 端口冲突

如果5678端口已被占用，可以使用以下命令停止所有相关进程：

```bash
./stop.sh
```

### 依赖问题

如果遇到依赖相关的错误，请确保安装了所有必要的依赖：

```bash
npm install
cd client && npm install && cd ..
```

### MongoDB连接问题

如果MongoDB连接失败，系统会自动回退到文件系统存储模式。如果您想使用MongoDB，请确保：

1. MongoDB服务已启动
2. `.env`文件中的`MONGODB_URI`配置正确

## 登录信息

系统保留了原有的登录凭据：
- 用户名：chuyi
- 密码：chuyi.123456

## 目录结构

```
iron-dev-agent/
├── client/                 # React前端应用
├── projects/               # 项目文件存储目录
├── public/                 # 传统模式的静态文件
├── server/                 # 服务器端代码
│   ├── config/             # 配置文件
│   ├── controllers/        # 控制器
│   ├── middleware/         # 中间件
│   ├── models/             # 数据模型
│   └── routes/             # 路由定义
├── .env                    # 环境变量配置
├── server.js               # 主服务器文件
├── start.sh                # 生产模式启动脚本
├── start-dev.sh            # 开发模式启动脚本
├── start-legacy.sh         # 传统模式启动脚本
├── hot-start.sh            # 热重载模式启动脚本
├── stop.sh                 # 停止服务脚本
└── restart.sh              # 重启服务脚本
```
