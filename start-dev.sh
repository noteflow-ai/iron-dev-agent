#!/bin/bash

# 切换到项目目录
cd "$(dirname "$0")"

# 检查是否已安装所需依赖
echo "检查依赖..."
if ! command -v node &> /dev/null; then
    echo "错误: 未安装Node.js，请先安装Node.js"
    exit 1
fi

# 检查是否已安装依赖包
if [ ! -d "node_modules" ]; then
    echo "安装服务器依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "安装客户端依赖..."
    cd client && npm install && cd ..
fi

# 停止可能正在运行的服务
echo "停止可能正在运行的服务..."
./stop.sh

# 设置环境变量
export NODE_ENV=development

# 启动开发服务器
echo "启动开发服务器..."
echo "访问 http://localhost:3000 使用应用"
echo "按 Ctrl+C 停止服务"

# 使用concurrently同时启动后端和前端
npx concurrently "nodemon server.js" "cd client && npm start"
