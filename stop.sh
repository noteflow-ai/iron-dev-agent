#!/bin/bash

# 设置错误处理
set -e

echo "===== PRD & UI 生成器停止脚本 ====="
echo "正在查找并停止所有相关进程..."

# 停止所有相关进程的函数
stop_all_processes() {
    local found_processes=false
    
    # 查找所有node server.js进程
    NODE_PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}' 2>/dev/null || echo "")
    if [ ! -z "$NODE_PIDS" ]; then
        echo "发现以下node server.js进程: $NODE_PIDS"
        for PID in $NODE_PIDS; do
            echo "正在终止node进程 $PID..."
            kill $PID 2>/dev/null || echo "无法终止进程 $PID，尝试强制终止..."
            sleep 1
            # 检查进程是否仍在运行，如果是则强制终止
            if ps -p $PID > /dev/null 2>&1; then
                echo "进程 $PID 仍在运行，强制终止..."
                kill -9 $PID 2>/dev/null || echo "无法强制终止进程 $PID"
            fi
        done
        found_processes=true
    else
        echo "未发现node server.js进程"
    fi
    
    # 查找所有nodemon进程
    NODEMON_PIDS=$(ps aux | grep "nodemon" | grep -v grep | awk '{print $2}' 2>/dev/null || echo "")
    if [ ! -z "$NODEMON_PIDS" ]; then
        echo "发现以下nodemon进程: $NODEMON_PIDS"
        for PID in $NODEMON_PIDS; do
            echo "正在终止nodemon进程 $PID..."
            kill $PID 2>/dev/null || echo "无法终止进程 $PID，尝试强制终止..."
            sleep 1
            # 检查进程是否仍在运行，如果是则强制终止
            if ps -p $PID > /dev/null 2>&1; then
                echo "进程 $PID 仍在运行，强制终止..."
                kill -9 $PID 2>/dev/null || echo "无法强制终止进程 $PID"
            fi
        done
        found_processes=true
    else
        echo "未发现nodemon进程"
    fi
    
    # 查找占用3000端口的进程
    if command -v lsof &> /dev/null; then
        PORT_PIDS=$(lsof -t -i:3000 2>/dev/null || echo "")
        if [ ! -z "$PORT_PIDS" ]; then
            echo "发现以下进程占用端口3000: $PORT_PIDS"
            for PID in $PORT_PIDS; do
                echo "正在终止端口占用进程 $PID..."
                kill $PID 2>/dev/null || echo "无法终止进程 $PID，尝试强制终止..."
                sleep 1
                # 检查进程是否仍在运行，如果是则强制终止
                if ps -p $PID > /dev/null 2>&1; then
                    echo "进程 $PID 仍在运行，强制终止..."
                    kill -9 $PID 2>/dev/null || echo "无法强制终止进程 $PID"
                fi
            done
            found_processes=true
        else
            echo "未发现进程占用端口3000"
        fi
    elif command -v netstat &> /dev/null; then
        PORT_PIDS=$(netstat -nlp 2>/dev/null | grep ':3000 ' | awk '{print $7}' | cut -d'/' -f1 || echo "")
        if [ ! -z "$PORT_PIDS" ]; then
            echo "发现以下进程占用端口3000: $PORT_PIDS"
            for PID in $PORT_PIDS; do
                echo "正在终止端口占用进程 $PID..."
                kill $PID 2>/dev/null || echo "无法终止进程 $PID，尝试强制终止..."
                sleep 1
                # 检查进程是否仍在运行，如果是则强制终止
                if ps -p $PID > /dev/null 2>&1; then
                    echo "进程 $PID 仍在运行，强制终止..."
                    kill -9 $PID 2>/dev/null || echo "无法强制终止进程 $PID"
                fi
            done
            found_processes=true
        else
            echo "未发现进程占用端口3000"
        fi
    fi
    
    if [ "$found_processes" = false ]; then
        echo "没有找到任何相关进程"
    else
        echo "所有相关进程已停止"
    fi
}

# 执行停止操作
stop_all_processes

# 等待端口释放
echo "等待端口释放..."
sleep 2

# 最后检查端口是否已释放
PORT_IN_USE=false
if command -v lsof &> /dev/null; then
    lsof -i:3000 &>/dev/null && PORT_IN_USE=true
elif command -v netstat &> /dev/null; then
    netstat -an | grep ":3000 " &>/dev/null && PORT_IN_USE=true
elif command -v ss &> /dev/null; then
    ss -ln | grep ":3000 " &>/dev/null && PORT_IN_USE=true
fi

if [ "$PORT_IN_USE" = true ]; then
    echo "警告: 端口3000仍然被占用，可能需要手动检查"
else
    echo "端口3000已成功释放"
fi

echo "停止操作完成"
