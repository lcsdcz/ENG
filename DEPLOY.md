# 🚀 Vercel部署指南

这个项目已经配置好可以直接部署到Vercel，支持一键部署！

## 📋 部署前准备

### 1. 准备API密钥
确保你有有效的OpenAI API密钥

### 2. 创建GitHub仓库
```bash
# 初始化Git仓库
git init
git add .
git commit -m "Initial commit"

# 推送到GitHub
git remote add origin https://github.com/你的用户名/english-ai-assistant.git
git push -u origin main
```

## 🚀 一键部署到Vercel

### 方法1：通过Vercel Dashboard（推荐）

1. **访问Vercel**: https://vercel.com
2. **登录/注册**: 使用GitHub账号登录
3. **导入项目**: 点击"New Project"
4. **选择仓库**: 选择你的GitHub仓库
5. **配置环境变量**:
   ```
   OPENAI_API_KEY=你的OpenAI API密钥
   OPENAI_API_URL=https://api.openai.com/v1/chat/completions
   OPENAI_MODEL=gpt-3.5-turbo
   OPENAI_TEMPERATURE=0.7
   ```
6. **部署**: 点击"Deploy"

### 方法2：通过Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel

# 按提示配置环境变量
```

## 🔧 环境变量配置

在Vercel Dashboard中设置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `OPENAI_API_KEY` | OpenAI API密钥 | `sk-...` |
| `OPENAI_API_URL` | API地址 | `https://api.openai.com/v1/chat/completions` |
| `OPENAI_MODEL` | 模型名称 | `gpt-3.5-turbo` |
| `OPENAI_TEMPERATURE` | 温度参数 | `0.7` |

## 🌐 访问你的应用

部署成功后，你会得到一个类似这样的URL：
```
https://your-app-name.vercel.app
```

## 🔍 测试部署

1. **健康检查**: 访问 `https://your-app-name.vercel.app/api/health`
2. **主应用**: 访问 `https://your-app-name.vercel.app`
3. **测试聊天**: 发送一条消息测试功能

## 📁 项目结构

```
├── api/
│   ├── chat.js          # 聊天API (Vercel Function)
│   └── health.js        # 健康检查API
├── js/
│   └── app.js           # 前端JavaScript
├── css/
│   └── style.css        # 样式文件
├── index.html           # 主页面
├── package.json         # 项目配置
├── vercel.json          # Vercel配置
└── DEPLOY.md           # 本文档
```

## 🔒 安全特性

✅ **API密钥安全**: 密钥存储在Vercel环境变量中，不会暴露在前端代码
✅ **HTTPS**: Vercel自动提供HTTPS
✅ **CORS保护**: 配置了适当的跨域访问控制
✅ **错误处理**: 不会在错误信息中暴露敏感数据

## 🆘 常见问题

### Q: 部署后API调用失败
A: 检查环境变量是否正确设置，特别是 `OPENAI_API_KEY`

### Q: 流式输出不工作
A: 确保 `OPENAI_API_KEY` 有效且有足够的额度

### Q: 页面显示404
A: 确保 `index.html` 在项目根目录

### Q: CORS错误
A: 检查浏览器控制台，确保API路由正确配置

## 🔄 更新部署

每次推送到GitHub主分支，Vercel会自动重新部署：

```bash
git add .
git commit -m "Update features"
git push origin main
```

## 📊 监控和日志

在Vercel Dashboard中可以查看：
- 部署状态
- 函数执行日志
- 性能指标
- 错误报告

## 🎉 部署完成！

恭喜！你的英语AI助手现在已经安全地部署在Vercel上了！

**优势**:
- 🌍 全球CDN加速
- 🔒 自动HTTPS
- 📱 移动端优化
- 🔄 自动部署
- 💰 免费额度充足
