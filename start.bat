@echo off
chcp 65001 >nul
title 英语对话AI助手 - English Conversation AI Assistant

echo.
echo ========================================
echo 🌟 英语对话AI助手启动中...
echo 🌟 Starting English AI Assistant...
echo ========================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到Python，请先安装Python 3.7+
    echo ❌ Error: Python not found, please install Python 3.7+
    pause
    exit /b 1
)

REM 检查依赖包
echo 📦 检查依赖包...
pip show requests >nul 2>&1
if errorlevel 1 (
    echo 📦 安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ 依赖包安装失败
        pause
        exit /b 1
    )
)

echo.
echo ✅ 环境检查完成，启动AI助手...
echo ✅ Environment check completed, starting AI Assistant...
echo.

REM 启动主程序
python main.py

echo.
echo 👋 程序已退出
echo 👋 Program exited
pause
