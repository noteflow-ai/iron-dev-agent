#!/bin/bash

# 查找运行中的服务器进程
PID=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
  echo "没有找到运行中的服务器进程"
else
  # 终止进程
  kill $PID
  echo "已停止服务器进程 (PID: $PID)"
fi
