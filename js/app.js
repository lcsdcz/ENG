/**
 * 英语对话AI助手 - 主要应用逻辑
 */

// 配置验证和备用系统
function validateAndFixConfig() {
    // 如果CONFIG不存在，创建一个基本的备用配置
    if (typeof CONFIG === 'undefined') {
        console.warn('CONFIG not found, creating fallback configuration');
        window.CONFIG = {
            openai: {
                apiKey: 'sk-FadRRn1rmnl5cBivgMuR7pvppW8bTxo83QAUJ0osdAEnxEXe',
                apiUrl: 'https://new1.588686.xyz/v1/chat/completions',
                model: 'deepseek-ai/DeepSeek-V3-0324-fast',
                maxTokens: 1000,
                temperature: 0.7,
                timeout: 30000
            },
            app: {
                name: 'English AI Assistant',
                version: '1.0.0',
                language: 'en',
                maxHistoryLength: 50
            },
            ui: {
                theme: 'light',
                fontSize: 'medium',
                showTimestamps: true
            },
            filter: {
                enabled: true,
                blockedWords: ['porn', 'gambling', 'drugs', 'illegal'],
                inappropriateKeywords: ['porn', 'gambling', 'drugs', 'illegal', '黄', '赌', '毒', '色情', '暴力', '赌博', '吸毒', '违法'],
                redirectMessage: "I'm sorry, but I cannot discuss inappropriate or illegal topics. Let's focus on something positive and constructive instead. What would you like to learn about today?"
            },
            systemPrompt: `You are a helpful and positive English conversation AI assistant. You must:
1. Only communicate in English
2. Provide positive, uplifting content
3. Strictly avoid any illegal content including pornography, gambling, drugs, or other harmful material
4. Be encouraging and supportive in your responses
5. Help users improve their English conversation skills`,
            translationPrompt: `Please translate the following English text to Chinese while maintaining the original meaning and tone:`,
            welcomeMessage: {
                english: "Hello! I'm your English conversation AI assistant. I'm here to help you improve your English skills through natural conversation. What would you like to talk about today?",
                chinese: "你好！我是你的英语对话AI助手。我在这里帮助你通过自然对话提高英语水平。你今天想聊什么？"
            },
            errorMessages: {
                apiError: 'Sorry, I\'m having trouble connecting right now. Please try again.',
                networkError: 'Network connection issue. Please check your internet connection.',
                rateLimit: 'Too many requests. Please wait a moment before trying again.'
            },
            suggestedTopics: [
                'Daily conversation',
                'Travel and culture',
                'Technology and innovation',
                'Health and wellness',
                'Education and learning',
                'Business and career',
                'Hobbies and interests',
                'Current events'
            ],
            storageKeys: {
                chatHistory: 'english_ai_chat_history',
                userSettings: 'english_ai_user_settings',
                conversationStats: 'english_ai_conversation_stats'
            }
        };
    }
    
    // 验证和修复配置的完整性
    if (!CONFIG.filter) CONFIG.filter = {};
    if (!CONFIG.filter.inappropriateKeywords) CONFIG.filter.inappropriateKeywords = ['porn', 'gambling', 'drugs', 'illegal'];
    if (!CONFIG.filter.redirectMessage) CONFIG.filter.redirectMessage = "I'm sorry, but I cannot discuss inappropriate or illegal topics. Let's focus on something positive and constructive instead.";
    if (!CONFIG.filter.enabled) CONFIG.filter.enabled = true;
    
    if (!CONFIG.app) CONFIG.app = {};
    if (!CONFIG.app.maxHistoryLength) CONFIG.app.maxHistoryLength = 50;
    
    if (!CONFIG.welcomeMessage) CONFIG.welcomeMessage = {};
    if (!CONFIG.welcomeMessage.english) CONFIG.welcomeMessage.english = "Hello! I'm your English conversation AI assistant. How can I help you today?";
    if (!CONFIG.welcomeMessage.chinese) CONFIG.welcomeMessage.chinese = "你好！我是你的英语对话AI助手。你今天想聊什么？";
    
    if (!CONFIG.systemPrompt) CONFIG.systemPrompt = "You are a helpful and positive English conversation AI assistant.";
    if (!CONFIG.translationPrompt) CONFIG.translationPrompt = "Please translate the following English text to Chinese while maintaining the original meaning and tone:";
    
    // 验证API密钥格式
    if (CONFIG.openai && CONFIG.openai.apiKey) {
        const apiKey = CONFIG.openai.apiKey.trim();
        if (!apiKey.startsWith('sk-')) {
            console.warn('API密钥格式可能不正确，应该以sk-开头');
        }
        if (apiKey.length < 20) {
            console.warn('API密钥长度过短，可能无效');
        }
        console.log('API密钥格式验证完成，长度:', apiKey.length);
    }
    
    console.log('Configuration validated and fixed:', CONFIG);
}

// 在页面加载时立即验证配置
validateAndFixConfig();

class EnglishAIAssistant {
    constructor() {
        console.log('EnglishAIAssistant constructor called');
        this.chatHistory = [];
        this.isLoading = false;
        this.userSettings = this.loadUserSettings();
        this.conversationStats = this.loadConversationStats();
        this.translationEnabled = true; // 默认启用翻译
        
        console.log('Constructor completed, calling init()');
        this.init();
    }
    
    init() {
        console.log('Initializing EnglishAIAssistant...');
        this.loadChatHistory();
        this.setupEventListeners();
        this.applyUserSettings();
        this.updateStats();
        this.showWelcomeMessage();
        
        // 从用户设置加载翻译状态
        this.translationEnabled = this.userSettings.translationEnabled;
        this.updateTranslationButton();
        console.log('Initialization completed');
    }
    
    setupEventListeners() {
        // 发送按钮点击事件
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
        
        // 输入框回车事件
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // 字符计数
            userInput.addEventListener('input', (e) => {
                this.updateCharCount(e.target.value.length);
            });
        }
        
        // 翻译开关按钮
        const translationToggle = document.getElementById('translationToggle');
        if (translationToggle) {
            translationToggle.addEventListener('click', () => {
                this.toggleTranslation();
            });
        }
        
        // 设置变更事件
        const showEnglish = document.getElementById('showEnglish');
        if (showEnglish) {
            showEnglish.addEventListener('change', (e) => {
                this.userSettings.showEnglish = e.target.checked;
                this.saveUserSettings();
            });
        }
        
        const showChinese = document.getElementById('showChinese');
        if (showChinese) {
            showChinese.addEventListener('change', (e) => {
                this.userSettings.showChinese = e.target.checked;
                this.saveUserSettings();
            });
        }
        
        const autoSave = document.getElementById('autoSave');
        if (autoSave) {
            autoSave.addEventListener('change', (e) => {
                this.userSettings.autoSave = e.target.checked;
                this.saveUserSettings();
            });
        }
        
        // 功能按钮事件监听器
        const exportChatBtn = document.getElementById('exportChatBtn');
        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', () => {
                this.exportChat();
            });
        }
        
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                this.clearChat();
            });
        }
        
        const showSettingsBtn = document.getElementById('showSettingsBtn');
        if (showSettingsBtn) {
            showSettingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }
        
        // 字体大小调整按钮
        const increaseFontBtn = document.getElementById('increaseFontBtn');
        if (increaseFontBtn) {
            increaseFontBtn.addEventListener('click', () => {
                this.changeFontSize(1);
            });
        }
        
        const decreaseFontBtn = document.getElementById('decreaseFontBtn');
        if (decreaseFontBtn) {
            decreaseFontBtn.addEventListener('click', () => {
                this.changeFontSize(-1);
            });
        }
    }
    
    async sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        
        if (!message) {
            this.showError('请输入内容');
            return;
        }
        
        if (this.isLoading) {
            this.showError('请等待AI回复完成');
            return;
        }
        
        // 检查内容过滤
        if (this.isInappropriateContent(message)) {
            this.addMessage('user', message, '');
            // 安全检查：确保redirectMessage配置存在
            const redirectMsg = CONFIG && CONFIG.filter && CONFIG.filter.redirectMessage 
                ? CONFIG.filter.redirectMessage 
                : "I'm sorry, but I cannot discuss inappropriate or illegal topics. Let's focus on something positive and constructive instead. What would you like to learn about today?";
            this.addMessage('ai', redirectMsg, '抱歉，我不能讨论不当或违法的话题。让我们专注于积极和建设性的事情吧。您今天想了解什么？');
            userInput.value = '';
            this.updateCharCount(0);
            return;
        }
        
        // 添加用户消息
        this.addMessage('user', message, '');
        userInput.value = '';
        this.updateCharCount(0);
        
        // 显示加载状态
        this.showLoading(true);
        
        try {
            // 调用AI API
            const response = await this.callOpenAIAPI(message);
            
            if (response) {
                let chineseTranslation = '';
                
                // 根据翻译开关决定是否翻译
                if (this.translationEnabled) {
                    chineseTranslation = await this.translateToChinese(response);
                }
                
                // 添加AI回复
                this.addMessage('ai', response, chineseTranslation);
                
                // 更新统计
                this.updateStats();
            } else {
                this.showError('AI回复失败，请重试');
            }
        } catch (error) {
            console.error('API调用错误:', error);
            this.showError('网络错误，请检查网络连接后重试');
        } finally {
            this.showLoading(false);
        }
    }
    
    async callOpenAIAPI(userMessage) {
        // 安全检查：确保必要的配置存在
        if (!CONFIG || !CONFIG.openai || !CONFIG.systemPrompt) {
            throw new Error('API configuration is incomplete');
        }
        
        const messages = [
            { role: 'system', content: CONFIG.systemPrompt },
            ...this.getRecentHistory(),
            { role: 'user', content: userMessage }
        ];
        
        const requestData = {
            model: CONFIG.openai.model || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: CONFIG.openai.maxTokens || 1000,
            temperature: CONFIG.openai.temperature || 0.7,
            stream: false
        };
        
        console.log('Sending API request:', {
            url: CONFIG.openai.apiUrl,
            model: requestData.model,
            messages: requestData.messages,
            max_tokens: requestData.max_tokens
        });
        
        try {
            const response = await fetch(CONFIG.openai.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.openai.apiKey.trim()}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'English-AI-Assistant/1.0'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response Error:', response.status, response.statusText, errorText);
                
                // 尝试解析错误信息
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error && errorJson.error.message) {
                        console.error('API Error Details:', errorJson.error.message);
                    }
                } catch (parseError) {
                    // 如果无法解析JSON，使用原始错误文本
                }
                
                // 如果API失败，使用本地模拟回复
                console.log('API failed, using local fallback response');
                return this.getLocalFallbackResponse(userMessage);
            }
            
            const result = await response.json();
            console.log('API Response received:', result);
            
            if (result.choices && result.choices.length > 0) {
                return result.choices[0].message.content;
            } else {
                throw new Error('API返回格式错误');
            }
        } catch (error) {
            console.error('OpenAI API调用失败:', error);
            // 如果API调用失败，使用本地模拟回复
            console.log('API call failed, using local fallback response');
            return this.getLocalFallbackResponse(userMessage);
        }
    }
    
    getLocalFallbackResponse(userMessage) {
        // 本地模拟回复，用于API失败时的备用方案
        const responses = [
            "Hello! I'm here to help you practice English. Your message was: '" + userMessage + "'. How can I assist you today?",
            "Great to hear from you! I understand you said: '" + userMessage + "'. Let's continue our English conversation!",
            "Thanks for your message! I'm here to help improve your English skills. What would you like to discuss?",
            "Hello there! I'm your English conversation partner. I'm ready to help you practice and improve your English!",
            "Welcome! I'm excited to help you with English conversation. Let's make learning fun and engaging!"
        ];
        
        // 根据用户消息长度选择回复
        const index = userMessage.length % responses.length;
        return responses[index];
    }
    
    async translateToChinese(englishText) {
        try {
            // 安全检查：确保必要的配置存在
            if (!CONFIG || !CONFIG.openai || !CONFIG.translationPrompt) {
                console.warn('Translation configuration is incomplete');
                return '翻译配置不完整';
            }
            
            const messages = [
                { role: 'system', content: CONFIG.translationPrompt },
                { role: 'user', content: englishText }
            ];
            
            const requestData = {
                model: CONFIG.openai.model || 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 500,
                temperature: 0.3,
                stream: false
            };
            
            console.log('Sending translation request:', {
                model: requestData.model,
                messages: requestData.messages
            });
            
            const response = await fetch(CONFIG.openai.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.openai.apiKey.trim()}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'English-AI-Assistant/1.0'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Translation API Response Error:', response.status, response.statusText, errorText);
                
                // 尝试解析错误信息
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error && errorJson.error.message) {
                        console.error('Translation API Error Details:', errorJson.error.message);
                    }
                } catch (parseError) {
                    // 如果无法解析JSON，忽略
                }
                
                // 如果翻译API失败，使用本地翻译
                console.log('Translation API failed, using local fallback translation');
                return this.getLocalTranslation(englishText);
            }
            
            const result = await response.json();
            console.log('Translation response received:', result);
            
            if (result.choices && result.choices.length > 0) {
                return result.choices[0].message.content;
            } else {
                return this.getLocalTranslation(englishText);
            }
        } catch (error) {
            console.error('翻译失败:', error);
            // 如果翻译失败，使用本地翻译
            return this.getLocalTranslation(englishText);
        }
    }
    
    getLocalTranslation(englishText) {
        // 简单的本地翻译映射，用于API失败时的备用方案
        const translations = {
            'hello': '你好',
            'hi': '嗨',
            'goodbye': '再见',
            'thank you': '谢谢',
            'you\'re welcome': '不客气',
            'how are you': '你好吗',
            'i\'m fine': '我很好',
            'nice to meet you': '很高兴认识你',
            'what is your name': '你叫什么名字',
            'my name is': '我的名字是'
        };
        
        const lowerText = englishText.toLowerCase();
        for (const [eng, chn] of Object.entries(translations)) {
            if (lowerText.includes(eng)) {
                return chn;
            }
        }
        
        // 如果没有找到匹配的翻译，返回通用回复
        return '这是AI的英文回复，翻译功能暂时不可用。';
    }
    
    addMessage(role, content, translation = '') {
        console.log('addMessage called:', { role, content, translation });
        
        const message = {
            id: Date.now(),
            role: role,
            content: content,
            translation: translation,
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.push(message);
        console.log('Message added to chatHistory, total messages:', this.chatHistory.length);
        
        // 限制历史记录长度（添加安全检查）
        const maxLength = CONFIG && CONFIG.app && CONFIG.app.maxHistoryLength ? CONFIG.app.maxHistoryLength : 50;
        if (this.chatHistory.length > maxLength) {
            this.chatHistory = this.chatHistory.slice(-maxLength);
            console.log('Chat history trimmed to max length:', maxLength);
        }
        
        // 渲染消息
        console.log('Rendering message...');
        this.renderMessage(message);
        
        // 自动保存
        if (this.userSettings.autoSave) {
            this.saveChatHistory();
        }
        
        // 滚动到底部
        this.scrollToBottom();
        console.log('addMessage completed');
    }
    
    renderAllMessages() {
        // 清空聊天区域
        const chatArea = document.getElementById('chatArea');
        if (chatArea) {
            chatArea.innerHTML = '';
        }
        
        // 重新渲染所有消息
        this.chatHistory.forEach(msg => this.renderMessage(msg));
    }
    
    renderMessage(message) {
        console.log('renderMessage called for:', message);
        
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) {
            console.error('chatHistory element not found!');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        messageDiv.id = `message-${message.id}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (message.role === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        // 总是显示英文内容
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = message.content;
        content.appendChild(textDiv);
        
        // 根据翻译开关决定是否显示中文翻译
        if (this.translationEnabled && message.translation && message.role === 'ai') {
            const translationDiv = document.createElement('div');
            translationDiv.className = 'message-translation';
            translationDiv.textContent = message.translation;
            content.appendChild(translationDiv);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatHistory.appendChild(messageDiv);
        console.log('Message rendered and added to DOM');
    }
    
    isInappropriateContent(content) {
        // 安全检查：确保CONFIG和filter对象存在
        if (!CONFIG || !CONFIG.filter || !CONFIG.filter.enabled) {
            return false;
        }
        
        // 安全检查：确保inappropriateKeywords数组存在
        if (!CONFIG.filter.inappropriateKeywords || !Array.isArray(CONFIG.filter.inappropriateKeywords)) {
            console.warn('Content filter keywords not properly configured');
            return false;
        }
        
        const lowerContent = content.toLowerCase();
        return CONFIG.filter.inappropriateKeywords.some(keyword => 
            lowerContent.includes(keyword.toLowerCase())
        );
    }
    
    getRecentHistory() {
        // 获取最近的对话历史（最多10轮）
        const recentMessages = this.chatHistory.slice(-20);
        return recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
    
    showLoading(show) {
        this.isLoading = show;
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = show ? 'flex' : 'none';
        
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            if (show) {
                sendButton.disabled = true;
                sendButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>发送中...';
            } else {
                sendButton.disabled = false;
                sendButton.innerHTML = '<i class="fas fa-paper-plane me-1"></i>发送';
            }
        }
    }
    
    showError(message) {
        // 创建错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
        
        // 3秒后自动消失
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }
    
    updateCharCount(count) {
        const charCountElement = document.getElementById('charCount');
        if (charCountElement) {
            charCountElement.textContent = count;
        }
    }
    
    scrollToBottom() {
        const chatHistory = document.getElementById('chatHistory');
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // 本地存储相关方法
    saveChatHistory() {
        try {
            localStorage.setItem(CONFIG.storageKeys.chatHistory, JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('保存对话历史失败:', error);
        }
    }
    
    loadChatHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKeys.chatHistory);
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                // 重新渲染所有消息
                this.renderAllMessages();
            }
        } catch (error) {
            console.error('加载对话历史失败:', error);
            this.chatHistory = [];
        }
    }
    
    saveUserSettings() {
        try {
            const settings = {
                ...this.userSettings,
                translationEnabled: this.translationEnabled
            };
            localStorage.setItem(CONFIG.storageKeys.userSettings, JSON.stringify(settings));
        } catch (error) {
            console.error('保存用户设置失败:', error);
        }
    }
    
    loadUserSettings() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKeys.userSettings);
            if (saved) {
                const settings = JSON.parse(saved);
                return {
                    showEnglish: settings.showEnglish !== undefined ? settings.showEnglish : true,
                    showChinese: settings.showChinese !== undefined ? settings.showChinese : true,
                    autoSave: settings.autoSave !== undefined ? settings.autoSave : true,
                    translationEnabled: settings.translationEnabled !== undefined ? settings.translationEnabled : true
                };
            }
        } catch (error) {
            console.error('加载用户设置失败:', error);
        }
        
        return {
            showEnglish: true,
            showChinese: true,
            autoSave: true,
            translationEnabled: true
        };
    }
    
    applyUserSettings() {
        const showEnglish = document.getElementById('showEnglish');
        const showChinese = document.getElementById('showChinese');
        const autoSave = document.getElementById('autoSave');
        
        if (showEnglish) {
            showEnglish.checked = this.userSettings.showEnglish;
        }
        if (showChinese) {
            showChinese.checked = this.userSettings.showChinese;
        }
        if (autoSave) {
            autoSave.checked = this.userSettings.autoSave;
        }
    }
    
    saveConversationStats() {
        try {
            localStorage.setItem(CONFIG.storageKeys.conversationStats, JSON.stringify(this.conversationStats));
        } catch (error) {
            console.error('保存对话统计失败:', error);
        }
    }
    
    loadConversationStats() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKeys.conversationStats);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载对话统计失败:', error);
        }
        
        return {
            totalMessages: 0,
            userMessages: 0,
            aiMessages: 0,
            firstMessageTime: null,
            lastMessageTime: null
        };
    }
    
    updateStats() {
        this.conversationStats.totalMessages = this.chatHistory.length;
        this.conversationStats.userMessages = this.chatHistory.filter(msg => msg.role === 'user').length;
        this.conversationStats.aiMessages = this.chatHistory.filter(msg => msg.role === 'ai').length;
        
        if (this.chatHistory.length > 0) {
            if (!this.conversationStats.firstMessageTime) {
                this.conversationStats.firstMessageTime = this.chatHistory[0].timestamp;
            }
            this.conversationStats.lastMessageTime = this.chatHistory[this.chatHistory.length - 1].timestamp;
        }
        
        this.saveConversationStats();
    }
    
    showWelcomeMessage() {
        console.log('showWelcomeMessage called, chatHistory length:', this.chatHistory.length);
        // 如果这是第一次使用，显示欢迎消息
        if (this.chatHistory.length === 0) {
            console.log('Showing welcome message for first time user');
            // 安全检查：确保welcomeMessage配置存在
            if (CONFIG && CONFIG.welcomeMessage) {
                const englishMsg = CONFIG.welcomeMessage.english || CONFIG.welcomeMessage;
                const chineseMsg = CONFIG.welcomeMessage.chinese || '';
                console.log('Welcome message config found:', { english: englishMsg, chinese: chineseMsg });
                this.addMessage('ai', englishMsg, chineseMsg);
            } else {
                // 备用欢迎消息
                console.log('Using fallback welcome message');
                this.addMessage('ai', 'Hello! I\'m your English conversation AI assistant. How can I help you today?', '你好！我是你的英语对话AI助手。你今天想聊什么？');
            }
        } else {
            console.log('Not showing welcome message, chat history exists');
        }
    }

    toggleTranslation() {
        this.translationEnabled = !this.translationEnabled;
        this.updateTranslationButton();
        this.saveUserSettings();
        
        // 重新渲染所有消息以应用翻译设置
        this.renderAllMessages();
    }
    
    updateTranslationButton() {
        const button = document.getElementById('translationToggle');
        const text = document.getElementById('translationText');
        
        if (button && text) {
            if (this.translationEnabled) {
                button.classList.remove('btn-outline-warning');
                button.classList.add('btn-outline-light');
                text.textContent = '中文翻译';
            } else {
                button.classList.remove('btn-outline-light');
                button.classList.add('btn-outline-warning');
                text.textContent = '仅英文';
            }
        }
    }
    
    // 功能按钮方法
    exportChat() {
        if (this.chatHistory.length > 0) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `english_ai_conversation_${timestamp}.txt`;
            
            let content = '英语对话AI助手 - 对话记录\n';
            content += '='.repeat(50) + '\n\n';
            
            this.chatHistory.forEach(msg => {
                const time = new Date(msg.timestamp).toLocaleString();
                const role = msg.role === 'user' ? '👤 您' : '🤖 AI';
                
                content += `[${time}] ${role}:\n`;
                content += `${msg.content}\n`;
                
                if (msg.translation) {
                    content += `翻译: ${msg.translation}\n`;
                }
                
                content += '\n';
            });
            
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccessMessage(`对话记录已导出到: ${filename}`);
        } else {
            alert('暂无对话记录可导出');
        }
    }
    
    clearChat() {
        if (confirm('确定要清空所有对话历史吗？此操作不可恢复。')) {
            this.chatHistory = [];
            const chatHistory = document.getElementById('chatHistory');
            if (chatHistory) {
                chatHistory.innerHTML = '';
            }
            this.saveChatHistory();
            this.updateStats();
            this.showWelcomeMessage();
        }
    }
    
    showSettings() {
        const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
        settingsModal.show();
    }
    
    saveSettings() {
        this.userSettings.showEnglish = document.getElementById('showEnglish').checked;
        this.userSettings.showChinese = document.getElementById('showChinese').checked;
        this.userSettings.autoSave = document.getElementById('autoSave').checked;
        this.saveUserSettings();
        
        // 重新渲染消息以应用新设置
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            chatHistory.innerHTML = '';
            this.chatHistory.forEach(msg => this.renderMessage(msg));
        }
        
        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (settingsModal) {
            settingsModal.hide();
        }
        
        this.showSuccessMessage('设置已保存');
    }
    
    changeFontSize(delta) {
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            const currentSize = parseInt(window.getComputedStyle(chatHistory).fontSize) || 16;
            const newSize = Math.max(12, Math.min(24, currentSize + delta));
            chatHistory.style.fontSize = newSize + 'px';
        }
    }
    
    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(successDiv, container.firstChild);
        }
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 确保配置已经验证和修复
    validateAndFixConfig();
    
    // 初始化AI助手
    window.aiAssistant = new EnglishAIAssistant();
    
    console.log('English AI Assistant initialized successfully');
});
