#!/bin/bash

# 设置错误处理
set -e

# 切换到项目目录
cd "$(dirname "$0")"

echo "===== PRD & UI 生成器重启脚本 ====="

echo "步骤1: 停止所有相关服务..."
# 停止当前服务
./stop.sh

echo "步骤2: 检查端口状态..."
# 检查端口是否仍然被占用
PORT_IN_USE=false
if command -v lsof &> /dev/null; then
    lsof -i:5678 &>/dev/null && PORT_IN_USE=true
elif command -v netstat &> /dev/null; then
    netstat -an | grep ":5678 " &>/dev/null && PORT_IN_USE=true
elif command -v ss &> /dev/null; then
    ss -ln | grep ":5678 " &>/dev/null && PORT_IN_USE=true
fi

# 如果端口仍然被占用，尝试强制停止
if [ "$PORT_IN_USE" = true ]; then
    echo "警告: 端口5678仍然被占用，尝试强制停止..."
    
    # 尝试使用lsof（如果可用）
    if command -v lsof &> /dev/null; then
        PIDS=$(lsof -t -i:5678 2>/dev/null || echo "")
        if [ ! -z "$PIDS" ]; then
            echo "发现以下进程占用端口5678: $PIDS"
            for PID in $PIDS; do
                echo "正在强制终止进程 $PID..."
                kill -9 $PID 2>/dev/null || echo "无法终止进程 $PID"
            done
        fi
    fi
    
    echo "等待端口释放..."
    sleep 3
fi

echo "步骤3: 启动服务..."
# 启动服务
./start.sh

echo "服务已重启完成"
echo "访问 http://localhost:5678 使用应用"
echo "如需热部署模式，请运行 ./hot-start.sh"
