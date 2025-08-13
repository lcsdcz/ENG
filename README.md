# 🌟 英语对话AI助手

一个智能的英语对话AI助手，专门设计用于英语学习和积极对话交流。支持命令行和网页两种使用方式。

## ✨ 主要功能

- 🤖 **纯英语对话**: AI只使用英语回复，帮助提升英语水平
- 🚫 **内容过滤**: 自动过滤不当内容，确保对话积极正面
- 🌏 **中文翻译**: 自动将AI回复翻译成中文，便于理解
- 💾 **对话历史**: 自动保存和加载对话记录
- 📊 **统计功能**: 查看对话统计信息
- 📤 **导出功能**: 导出对话记录到文件
- ⚙️ **配置管理**: 灵活的配置选项
- 🌐 **网页版本**: 现代化的Web界面，支持移动端

## 🚀 快速开始

### 方式1：网页版本（推荐）

直接访问：https://english.charon.ac.cn

### 方式2：命令行版本

#### 1. 安装依赖

```bash
pip install -r requirements.txt
```

#### 2. 配置API

在项目根目录创建 `.env` 文件（或设置环境变量）：

```bash
# OpenAI API配置
OPENAI_API_KEY=your_api_key_here
OPENAI_API_URL=https://new1.588686.xyz/v1/chat/completions
OPENAI_MODEL=deepseek-ai/DeepSeek-V3-0324-fast
```

#### 3. 运行程序

```bash
# 运行基础版本
python english_ai_assistant.py

# 运行增强版本（推荐）
python main.py
```

## 🌐 网页版本特性

### 界面特点
- 🎨 **现代化设计**: 使用Bootstrap 5和自定义CSS
- 📱 **响应式布局**: 完美支持桌面端和移动端
- 🌈 **美观界面**: 渐变背景、卡片式设计、动画效果
- 🎯 **用户友好**: 直观的操作界面和清晰的视觉反馈

### 功能特性
- 💬 **实时对话**: 流畅的对话体验
- ⚡ **快速响应**: 优化的API调用和错误处理
- 💾 **本地存储**: 自动保存对话历史和用户设置
- 🔧 **个性化设置**: 可自定义显示选项和保存偏好
- 📊 **数据统计**: 详细的对话统计信息
- 📤 **导出功能**: 支持导出对话记录为文本文件

## 📚 使用方法

### 网页版本
1. 打开浏览器访问 https://english.charon.ac.cn
2. 在输入框中输入您想聊的话题
3. 点击发送按钮或按回车键
4. AI会用英语回复并自动翻译成中文
5. 使用右上角的按钮查看帮助、统计和设置

### 命令行版本
- 直接输入您想聊的话题
- AI会用英语回复并自动翻译成中文
- 支持中英文混合输入

### 特殊命令
- `help` / `帮助` / `h` - 显示帮助信息
- `stats` / `统计` / `s` - 显示对话统计
- `export` / `导出` / `e` - 导出对话记录
- `clear` / `清空` / `c` - 清空对话历史
- `quit` / `退出` / `q` - 结束对话

## 🎯 建议话题

- 🎓 **英语学习**: 语法、词汇、发音等
- 🌱 **个人发展**: 目标设定、时间管理、技能提升
- 💭 **积极思考**: 正面心态、压力管理、自我激励
- 🏫 **教育文化**: 学习方法、文化差异、知识分享
- 🎨 **兴趣爱好**: 音乐、电影、阅读、运动等
- ✈️ **旅行探索**: 目的地介绍、文化体验、旅行建议
- 🔬 **科学技术**: 最新科技、科学发现、技术趋势
- 💪 **健康生活**: 健身、营养、心理健康、生活习惯
- 🚀 **励志激励**: 成功故事、人生哲理、积极能量

## 🚀 部署到GitHub Pages

### 1. Fork或克隆仓库

```bash
git clone https://github.com/your-username/english-ai-assistant.git
cd english-ai-assistant
```

### 2. 配置GitHub Secrets

在GitHub仓库设置中添加以下Secrets：
- `OPENAI_API_KEY`: 您的OpenAI API密钥
- `OPENAI_API_URL`: API端点URL
- `OPENAI_MODEL`: 使用的模型名称

### 3. 启用GitHub Pages

1. 进入仓库设置 → Pages
2. Source选择 "GitHub Actions"
3. 推送代码到main分支，Actions会自动运行

### 4. 配置自定义域名

1. 在DNS提供商处添加CNAME记录：
   ```
   english.charon.ac.cn → your-username.github.io
   ```
2. 在GitHub Pages设置中添加自定义域名
3. 勾选"Enforce HTTPS"

## ⚙️ 配置选项

### 对话配置
- `max_history_length`: 最大对话历史长度（默认50）
- `recent_history_count`: 发送给API的最近对话轮数（默认20）
- `enable_translation`: 是否启用中文翻译（默认True）
- `auto_save_history`: 是否自动保存对话历史（默认True）

### UI配置
- `show_english`: 显示英文回复（默认True）
- `show_chinese`: 显示中文翻译（默认True）
- `show_timestamps`: 显示时间戳（默认False）
- `theme`: 主题模式（auto/light/dark）

## 🔒 安全特性

- 自动过滤不当内容关键词
- 内容积极正面导向
- 禁止讨论违法话题
- 自动重定向到积极话题
- API密钥通过GitHub Secrets安全存储

## 📁 文件结构

```
english-ai-assistant/
├── index.html              # 网页版主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── config.js          # 配置文件
│   └── app.js             # 主要逻辑
├── .github/
│   └── workflows/         # GitHub Actions配置
├── english_ai_assistant.py # 命令行基础版本
├── main.py                # 命令行增强版本
├── config.py              # 命令行配置管理
├── requirements.txt       # Python依赖包
├── CNAME                 # 自定义域名配置
├── README.md             # 说明文档
└── conversation_history.json # 对话历史（自动生成）
```

## 🛠️ 技术特点

- **模块化设计**: 清晰的代码结构，易于维护和扩展
- **配置驱动**: 灵活的配置系统，支持环境变量和配置文件
- **错误处理**: 完善的异常处理机制
- **类型提示**: 使用Python类型提示，提高代码质量
- **多语言支持**: 支持中英文界面
- **响应式设计**: 现代化的Web界面，支持各种设备
- **安全部署**: 通过GitHub Actions安全部署，API密钥不暴露

## 🚨 注意事项

1. **API密钥安全**: 请妥善保管您的API密钥，不要泄露给他人
2. **网络连接**: 确保网络连接稳定，API调用需要网络访问
3. **内容合规**: 请遵守相关法律法规，不要尝试绕过内容过滤
4. **使用频率**: 注意API调用频率限制，避免过度使用
5. **部署安全**: 使用GitHub Secrets存储敏感信息，不要直接提交到代码中

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 贡献方式
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

**享受您的英语学习之旅！** 🎉

**在线体验**: https://english.charon.ac.cn
