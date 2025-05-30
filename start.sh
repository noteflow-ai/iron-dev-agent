#!/bin/bash

# 切换到项目目录
cd "$(dirname "$0")"

# 在后台启动服务器
nohup node server.js > server.log 2>&1 &

# 输出进程ID
echo "服务已在后台启动，进程ID: $!"
echo "访问 http://localhost:3000 使用应用"
echo "查看日志: tail -f server.log"
