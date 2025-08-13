/**
 * 英语对话AI助手 - 简化版本
 */

// 配置对象
const CONFIG = {
    openai: {
        apiKey: 'sk-oQ5JuAiv2D9SQZ0Y48LvJEUvqfuxjPR2weQJMOnF0IR7fkMQ',
        apiUrl: 'https://gpt.soruxgpt.com/api/api/v1/chat/completions',
        model: 'gpt-4o',
        maxTokens: 1000,
        temperature: 0.7
    },
    systemPrompt: `You are a helpful English conversation AI assistant. CRITICAL RULE: You must ALWAYS communicate in English ONLY. Never respond in Chinese or any other language.`,
    translationPrompt: `Please translate the following English text to Chinese while maintaining the original meaning and tone:`
};

// 主应用类
class EnglishAIAssistant {
    constructor() {
        this.chatHistory = [];
        this.isLoading = false;
        this.translationEnabled = true;
        this.essayMode = false;
        
        console.log('EnglishAIAssistant initialized');
        this.init();
    }
    
    init() {
        console.log('Initializing...');
        
        // 等待DOM完全加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }
    
    setupApp() {
        console.log('Setting up app...');
        
        // 检查关键元素
        const elements = this.checkElements();
        if (!elements.allFound) {
            console.error('Required elements not found:', elements.missing);
            return;
        }
        
        console.log('All elements found, setting up event listeners');
        
        // 设置事件监听器
        this.setupEventListeners(elements);
        
        // 加载历史记录
        this.loadChatHistory();
        
        // 显示欢迎消息
        this.showWelcomeMessage();
        
        console.log('App setup completed');
    }
    
    checkElements() {
        const required = ['chatHistory', 'sendButton', 'userInput', 'charCount'];
        const found = {};
        const missing = [];
        
        required.forEach(id => {
            const element = document.getElementById(id);
            found[id] = element;
            if (!element) {
                missing.push(id);
            }
        });
        
        return {
            allFound: missing.length === 0,
            found,
            missing
        };
    }
    
    setupEventListeners(elements) {
        const { sendButton, userInput, charCount } = elements;
        
        // 发送按钮点击事件
        sendButton.addEventListener('click', () => this.sendMessage());
        
        // 输入框事件
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        userInput.addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });
        
        // 翻译开关
        const translationToggle = document.getElementById('translationToggle');
        if (translationToggle) {
            translationToggle.addEventListener('click', () => this.toggleTranslation());
        }
        
        // 作文模式开关
        const essayModeToggle = document.getElementById('essayModeToggle');
        if (essayModeToggle) {
            essayModeToggle.addEventListener('click', () => this.toggleEssayMode());
        }
        
        // 功能按钮
        const exportChatBtn = document.getElementById('exportChatBtn');
        if (exportChatBtn) {
            exportChatBtn.addEventListener('click', () => this.exportChat());
        }
        
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
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
        
        console.log('Sending message:', message);
        
        // 添加用户消息
        this.addMessage('user', message);
        
        // 清空输入框
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
        const systemPrompt = this.essayMode ? this.getEssaySystemPrompt() : CONFIG.systemPrompt;
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.getRecentHistory(),
            { role: 'user', content: userMessage }
        ];
        
        const requestData = {
            model: CONFIG.openai.model,
            messages: messages,
            max_tokens: CONFIG.openai.maxTokens,
            temperature: CONFIG.openai.temperature,
            stream: false
        };
        
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
                console.error('API Error:', response.status, errorText);
                return this.getLocalFallbackResponse(userMessage);
            }
            
            const result = await response.json();
            
            if (result.choices && result.choices.length > 0) {
                const aiResponse = result.choices[0].message.content;
                
                // 检查是否包含中文
                if (this.containsChinese(aiResponse)) {
                    return "I apologize, but I can only provide responses in English. Please ask me to write about this topic in English.";
                }
                
                return aiResponse;
            } else {
                throw new Error('API返回格式错误');
            }
        } catch (error) {
            console.error('OpenAI API调用失败:', error);
            return this.getLocalFallbackResponse(userMessage);
        }
    }
    
    getEssaySystemPrompt() {
        return `${CONFIG.systemPrompt}

You are now in Essay Mode. When writing essays, you must:

1. Use proper essay structure (introduction, body paragraphs, conclusion)
2. Use advanced vocabulary and sophisticated expressions
3. Vary sentence structures (simple, compound, complex sentences)
4. Employ proper grammar, punctuation, and spelling
5. Provide well-developed arguments with examples
6. Aim for 300-500 words for standard essays

REMEMBER: Always respond in English ONLY.`;
    }
    
    getLocalFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('你好')) {
            return "Hello! Nice to meet you! I'm excited to help you improve your English skills. How are you today?";
        }
        
        if (lowerMessage.includes('how are you') || lowerMessage.includes('你好吗')) {
            return "I'm doing great, thank you for asking! I'm here and ready to help you practice English. How about you?";
        }
        
        if (lowerMessage.includes('thank') || lowerMessage.includes('谢谢')) {
            return "You're very welcome! I'm happy to help you with English. Is there anything specific you'd like to practice today?";
        }
        
        return "That's interesting! I'd love to hear more about that. Let's continue our English conversation!";
    }
    
    async translateToChinese(englishText) {
        try {
            const messages = [
                { role: 'system', content: CONFIG.translationPrompt },
                { role: 'user', content: englishText }
            ];
            
            const requestData = {
                model: CONFIG.openai.model,
                messages: messages,
                max_tokens: 500,
                temperature: 0.3,
                stream: false
            };
            
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
                return this.getLocalTranslation(englishText);
            }
            
            const result = await response.json();
            
            if (result.choices && result.choices.length > 0) {
                return result.choices[0].message.content;
            } else {
                return this.getLocalTranslation(englishText);
            }
        } catch (error) {
            console.error('翻译失败:', error);
            return this.getLocalTranslation(englishText);
        }
    }
    
    getLocalTranslation(englishText) {
        const translations = {
            'hello': '你好',
            'hi': '嗨',
            'thank you': '谢谢',
            'how are you': '你好吗',
            'nice to meet you': '很高兴认识你'
        };
        
        const lowerText = englishText.toLowerCase();
        
        for (const [eng, chn] of Object.entries(translations)) {
            if (lowerText.includes(eng)) {
                return chn;
            }
        }
        
        return '这是AI的英文回复。如需完整翻译，请稍后再试。';
    }
    
    addMessage(role, content, translation = '') {
        const message = {
            id: Date.now(),
            role: role,
            content: content,
            translation: translation,
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.push(message);
        console.log('Message added:', message);
        
        // 渲染消息
        this.renderMessage(message);
        
        // 保存历史记录
        this.saveChatHistory();
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) {
            console.error('chatHistory element not found in renderMessage');
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}-message`;
        messageDiv.id = `message-${message.id}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = message.role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = this.formatMessageText(message.content);
        content.appendChild(textDiv);
        
        // 显示翻译
        if (this.translationEnabled && message.translation && message.role === 'ai') {
            const translationDiv = document.createElement('div');
            translationDiv.className = 'message-translation';
            translationDiv.textContent = message.translation;
            content.appendChild(translationDiv);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatHistory.appendChild(messageDiv);
        console.log('Message rendered successfully');
    }
    
    formatMessageText(text) {
        if (!text) return '';
        
        return text
            .replace(/\n/g, '<br>')
            .replace(/\r\n/g, '<br>')
            .replace(/\r/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }
    
    getRecentHistory() {
        const recentMessages = this.chatHistory.slice(-20);
        return recentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
    
    showLoading(show) {
        this.isLoading = show;
        
        if (show) {
            this.showThinkingIndicator();
        } else {
            this.hideThinkingIndicator();
        }
        
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = show;
            sendButton.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin me-1"></i>发送中...' : 
                '<i class="fas fa-paper-plane me-1"></i>发送';
        }
    }
    
    showThinkingIndicator() {
        this.hideThinkingIndicator();
        
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;
        
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking-indicator';
        thinkingDiv.id = 'thinkingIndicator';
        
        thinkingDiv.innerHTML = `
            <div class="avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="content">
                <div class="text">AI正在思考中</div>
                <div class="dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        chatHistory.appendChild(thinkingDiv);
        this.scrollToBottom();
    }
    
    hideThinkingIndicator() {
        const existingIndicator = document.getElementById('thinkingIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
            
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 3000);
        }
    }
    
    updateCharCount(count) {
        const charCountElement = document.getElementById('charCount');
        if (charCountElement) {
            charCountElement.textContent = count;
        }
    }
    
    scrollToBottom() {
        try {
            const chatHistory = document.getElementById('chatHistory');
            if (chatHistory && chatHistory.scrollHeight) {
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        } catch (error) {
            console.error('Error in scrollToBottom:', error);
        }
    }
    
    saveChatHistory() {
        try {
            localStorage.setItem('english_ai_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('保存对话历史失败:', error);
        }
    }
    
    loadChatHistory() {
        try {
            const saved = localStorage.getItem('english_ai_chat_history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                this.renderAllMessages();
            }
        } catch (error) {
            console.error('加载对话历史失败:', error);
            this.chatHistory = [];
        }
    }
    
    renderAllMessages() {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) return;
        
        chatHistory.innerHTML = '';
        this.chatHistory.forEach(msg => this.renderMessage(msg));
    }
    
    showWelcomeMessage() {
        if (this.chatHistory.length === 0) {
            this.addMessage('ai', 
                'Hello! I\'m your English conversation AI assistant. I\'m here to help you improve your English skills through natural conversation. What would you like to talk about today?',
                '你好！我是你的英语对话AI助手。我在这里帮助你通过自然对话提高英语水平。你今天想聊什么？'
            );
        }
    }
    
    toggleTranslation() {
        this.translationEnabled = !this.translationEnabled;
        this.updateTranslationButton();
        this.renderAllMessages();
    }
    
    toggleEssayMode() {
        this.essayMode = !this.essayMode;
        this.updateEssayModeButton();
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
    
    updateEssayModeButton() {
        const button = document.getElementById('essayModeToggle');
        const text = document.getElementById('essayModeText');
        
        if (button && text) {
            if (this.essayMode) {
                button.classList.add('active');
                text.textContent = '作文模式已开启';
            } else {
                button.classList.remove('active');
                text.textContent = '作文模式';
            }
        }
        
        const body = document.body;
        if (this.essayMode) {
            body.classList.add('essay-mode');
        } else {
            body.classList.remove('essay-mode');
        }
    }
    
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
            
            alert(`对话记录已导出到: ${filename}`);
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
            this.showWelcomeMessage();
        }
    }
    
    containsChinese(text) {
        return /[\u4e00-\u9fff]/.test(text);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    
    // 等待一小段时间确保所有元素都已加载
    setTimeout(() => {
        console.log('Initializing English AI Assistant...');
        window.aiAssistant = new EnglishAIAssistant();
    }, 100);
});
