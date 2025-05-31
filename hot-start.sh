#!/bin/bash

# 设置错误处理
set -e

# 切换到项目目录
cd "$(dirname "$0")"

echo "===== Iron端到端智能开发平台 热部署启动脚本 ====="
echo "正在检查是否有服务器实例正在运行..."

# 强制停止所有可能占用5678端口的进程
force_stop_port() {
    echo "尝试强制停止所有占用5678端口的进程..."
    
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
    # 如果lsof不可用，尝试使用netstat
    elif command -v netstat &> /dev/null; then
        PIDS=$(netstat -nlp 2>/dev/null | grep ':5678 ' | awk '{print $7}' | cut -d'/' -f1 || echo "")
        if [ ! -z "$PIDS" ]; then
            echo "发现以下进程占用端口5678: $PIDS"
            for PID in $PIDS; do
                echo "正在强制终止进程 $PID..."
                kill -9 $PID 2>/dev/null || echo "无法终止进程 $PID"
            done
        fi
    # 如果netstat也不可用，尝试使用ss
    elif command -v ss &> /dev/null; then
        PIDS=$(ss -nlp 2>/dev/null | grep ':5678 ' | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2 || echo "")
        if [ ! -z "$PIDS" ]; then
            echo "发现以下进程占用端口5678: $PIDS"
            for PID in $PIDS; do
                echo "正在强制终止进程 $PID..."
                kill -9 $PID 2>/dev/null || echo "无法终止进程 $PID"
            done
        fi
    fi
    
    # 额外尝试查找node进程
    NODE_PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}' 2>/dev/null || echo "")
    if [ ! -z "$NODE_PIDS" ]; then
        echo "发现以下node server.js进程: $NODE_PIDS"
        for PID in $NODE_PIDS; do
            echo "正在强制终止node进程 $PID..."
            kill -9 $PID 2>/dev/null || echo "无法终止进程 $PID"
        done
    fi
    
    # 等待端口释放
    echo "等待端口5678释放..."
    sleep 2
}

# 首先尝试使用stop.sh脚本
echo "尝试使用stop.sh脚本停止服务..."
./stop.sh

# 检查端口是否仍然被占用
PORT_IN_USE=false
if command -v lsof &> /dev/null; then
    lsof -i:5678 &>/dev/null && PORT_IN_USE=true
elif command -v netstat &> /dev/null; then
    netstat -an | grep ":5678 " &>/dev/null && PORT_IN_USE=true
elif command -v ss &> /dev/null; then
    ss -ln | grep ":5678 " &>/dev/null && PORT_IN_USE=true
fi

# 如果端口仍然被占用，强制停止
if [ "$PORT_IN_USE" = true ]; then
    echo "警告: 端口5678仍然被占用，尝试强制停止..."
    force_stop_port
fi

echo "正在启动热部署模式..."
echo "监视文件变化中，服务器将在文件变更时自动重启"
echo "按 Ctrl+C 停止服务"

# 使用nodemon启动服务器
echo "启动nodemon..."
npx nodemon server.js || {
    echo "启动失败，尝试强制清理端口并重试..."
    force_stop_port
    echo "重新尝试启动..."
    npx nodemon server.js
}

# 如果nodemon退出，显示消息
echo "热部署服务已停止"
