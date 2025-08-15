/**
 * 英语对话AI助手 - 完全独立版本（含流式输出与超时控制）
 */

// 主应用类
class EnglishAIAssistant {
    constructor() {
        // 内置配置
        this.config = {
            // API配置现在通过Vercel serverless functions，前端不包含敏感信息
            apiUrl: '/api/chat', // 使用Vercel API路由
            systemPrompt: `You are a helpful English conversation AI assistant. CRITICAL RULE: You must ALWAYS communicate in English ONLY. Never respond in Chinese or any other language.`,
            streaming: true,
            requestTimeoutMs: 30000
        };
        
        this.chatHistory = [];
        this.isLoading = false;
        this.translationEnabled = false; // 默认关闭翻译
        this.essayMode = false;
        
        console.log('EnglishAIAssistant initialized');
        this.init();
    }
    
    init() {
        console.log('Initializing...');
        this.setupApp();
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
        console.log('Found elements:', elements.found);
        
        // 设置事件监听器
        this.setupEventListeners(elements);
        
        // 确保加载状态被重置
        this.showLoading(false);
        
        // 加载历史记录
        this.loadChatHistory();
        
        // 显示欢迎消息
        this.showWelcomeMessage();
        
        // 清理可能残留的光标
        this.removeAllCursors();
        
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
        
        console.log('checkElements result:', { found, missing });
        
        return {
            allFound: missing.length === 0,
            found,
            missing
        };
    }
    
    setupEventListeners(elements) {
        // 兼容性获取，避免因某些原因未取到元素
        let sendButton = (elements && elements.found && elements.found.sendButton) || document.getElementById('sendButton');
        let userInput = (elements && elements.found && elements.found.userInput) || document.getElementById('userInput');

        if (!sendButton || !userInput) {
            console.error('setupEventListeners: missing elements', {
                hasElementsObj: !!elements,
                keysInFound: elements && elements.found ? Object.keys(elements.found) : null,
                sendButton,
                userInput
            });
            return; // 直接返回，避免后续报错
        }
        
        // 发送按钮点击事件
        if (typeof sendButton.addEventListener === 'function') {
            sendButton.addEventListener('click', () => this.sendMessage());
        } else {
            console.error('sendButton.addEventListener is not a function', sendButton);
        }
        
        // 输入框事件
        if (typeof userInput.addEventListener === 'function') {
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            userInput.addEventListener('input', (e) => {
                this.updateCharCount(e.target.value.length);
            });
        } else {
            console.error('userInput.addEventListener is not a function', userInput);
        }
        
        // 翻译开关（已禁用）
        const translationToggle = document.getElementById('translationToggle');
        if (translationToggle && typeof translationToggle.addEventListener === 'function') {
            translationToggle.addEventListener('click', () => this.toggleTranslation());
            // 隐藏翻译按钮
            translationToggle.style.display = 'none';
        }
        
        // 作文模式开关
        const essayModeToggle = document.getElementById('essayModeToggle');
        if (essayModeToggle && typeof essayModeToggle.addEventListener === 'function') {
            essayModeToggle.addEventListener('click', () => this.toggleEssayMode());
        }
        
        // 功能按钮
        const exportChatBtn = document.getElementById('exportChatBtn');
        if (exportChatBtn && typeof exportChatBtn.addEventListener === 'function') {
            exportChatBtn.addEventListener('click', () => this.exportChat());
        }
        
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn && typeof clearChatBtn.addEventListener === 'function') {
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
            // 强制使用流式输出，实现实时显示
            await this.callOpenAIAPIStream(message);
            // 流式输出已经通过updateStreamMessage实时显示，不需要再addMessage
        } catch (error) {
            console.error('API调用错误:', error);
            this.showError('网络错误，请检查网络连接后重试');
        } finally {
            // 确保在所有情况下都重置加载状态
            this.showLoading(false);
            console.log('Loading state reset to false');
        }
    }
    
    // 非流式回退（简化版，仅用于错误处理）
    async callOpenAIAPINonStream(userMessage) {
        const systemPrompt = this.essayMode ? this.getEssaySystemPrompt() : this.config.systemPrompt;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.getRecentHistory(),
            { role: 'user', content: userMessage }
        ];
        const requestData = {
            messages,
            stream: false
        };
        try {
            const { response } = await this.fetchWithTimeout(this.config.apiUrl, {
                method: 'POST',
                headers: {
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
                if (this.containsChinese(aiResponse)) {
                    return "I apologize, but I can only provide responses in English. Please ask me to write about this topic in English.";
                }
                return aiResponse;
            }
            throw new Error('API返回格式错误');
        } catch (error) {
            console.error('OpenAI API（非流式）调用失败:', error);
            return this.getLocalFallbackResponse(userMessage);
        }
    }

    // 流式输出（实时显示）
    async callOpenAIAPIStream(userMessage) {
        const systemPrompt = this.essayMode ? this.getEssaySystemPrompt() : this.config.systemPrompt;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.getRecentHistory(),
            { role: 'user', content: userMessage }
        ];
        const requestData = {
            messages,
            stream: true
        };

        // 先在界面放一个占位的AI消息
        const placeholder = this.createAIMessagePlaceholder();
        console.log('创建流式消息占位符:', placeholder.id);
        let fullText = '';

        try {
            const { response, controller, timeoutId } = await this.fetchWithTimeout(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'User-Agent': 'English-AI-Assistant/1.0'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok || !response.body) {
                clearTimeout(timeoutId);
                controller.abort();
                console.warn('流式返回不可用，回退到非流式');
                const nonStream = await this.callOpenAIAPINonStream(userMessage);
                this.updateStreamMessage(placeholder.id, nonStream);
                this.finalizeStreamMessage(placeholder.id, nonStream);
                return; // 不返回文本，避免重复显示
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split('\n');
                // 保留最后一条不完整的行
                buffer = lines.pop() || '';

                for (const raw of lines) {
                    const line = raw.trim();
                    if (!line) continue;
                    if (line.startsWith('data:')) {
                        const data = line.replace(/^data:\s*/, '');
                        if (data === '[DONE]') {
                            break;
                        }
                        try {
                            const json = JSON.parse(data);
                            // 兼容OpenAI SSE格式：choices[0].delta.content
                            const delta = json.choices && json.choices[0] && json.choices[0].delta ? json.choices[0].delta.content : '';
                            if (delta) {
                                fullText += delta;
                                this.updateStreamMessage(placeholder.id, fullText);
                            }
                        } catch (e) {
                            // 某些代理返回非JSON心跳/注释行，忽略
                        }
                    }
                }
            }

            clearTimeout(timeoutId);
            if (this.containsChinese(fullText)) {
                fullText = "I apologize, but I can only provide responses in English. Please ask me to write about this topic in English.";
                this.updateStreamMessage(placeholder.id, fullText);
            }
            
            // 流式输出完成，将最终消息添加到历史记录
            console.log('流式输出完成，最终文本长度:', fullText.length);
            this.finalizeStreamMessage(placeholder.id, fullText || '...');
            
        } catch (error) {
            console.error('OpenAI API（流式）调用失败，回退到非流式:', error);
            try {
                const nonStream = await this.callOpenAIAPINonStream(userMessage);
                this.updateStreamMessage(placeholder.id, nonStream);
                this.finalizeStreamMessage(placeholder.id, nonStream);
            } catch (fallbackError) {
                console.error('回退到非流式也失败:', fallbackError);
                const fallbackResponse = this.getLocalFallbackResponse(userMessage);
                this.updateStreamMessage(placeholder.id, fallbackResponse);
                this.finalizeStreamMessage(placeholder.id, fallbackResponse);
            }
        }
    }

    // 发起带超时控制的fetch
    async fetchWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
        const response = await fetch(url, { ...options, signal: controller.signal });
        return { response, controller, timeoutId };
    }

    // 创建一个AI消息占位，用于流式更新
    createAIMessagePlaceholder() {
        // 使用addMessage但不添加到历史记录
        const messageId = Date.now();
        const message = {
            id: messageId,
            role: 'ai',
            content: '',
            translation: '',
            timestamp: new Date().toISOString()
        };
        
        // 只渲染到界面，不添加到历史记录
        this.renderMessage(message);
        this.scrollToBottom();
        return message;
    }

    // 根据ID更新已渲染的消息文本（流式）
    updateStreamMessage(messageId, text) {
        const el = document.getElementById(`message-${messageId}`);
        if (!el) return;
        const textDiv = el.querySelector('.message-text');
        if (!textDiv) return;
        
        // 实时更新文本内容
        textDiv.innerHTML = this.formatMessageText(text);
        
        // 自动滚动到底部，确保用户能看到最新的回复
        this.scrollToBottom();
        
        // 添加打字机效果的光标（只在流式输出过程中显示）
        if (text && !text.endsWith('\n')) {
            textDiv.innerHTML += '<span class="typing-cursor">|</span>';
        }
    }

    // 流式输出完成后，将消息添加到历史记录并移除光标
    finalizeStreamMessage(messageId, finalText) {
        const el = document.getElementById(`message-${messageId}`);
        if (!el) return;
        const textDiv = el.querySelector('.message-text');
        if (!textDiv) return;
        
        // 移除打字光标，显示最终文本
        textDiv.innerHTML = this.formatMessageText(finalText);
        
            // 确保移除所有光标
    const cursors = textDiv.querySelectorAll('.typing-cursor');
    cursors.forEach(cursor => cursor.remove());
    
    // 全局清理所有光标（以防万一）
    this.removeAllCursors();
        
        // 将消息添加到历史记录（只添加一次）
        const message = {
            id: messageId,
            role: 'ai',
            content: finalText,
            translation: '',
            timestamp: new Date().toISOString()
        };
        
        // 检查是否已经在历史记录中
        const existingIndex = this.chatHistory.findIndex(msg => msg.id === messageId);
        if (existingIndex >= 0) {
            // 更新现有消息
            this.chatHistory[existingIndex] = message;
        } else {
            // 添加新消息
            this.chatHistory.push(message);
        }
        
        // 保存历史记录
        this.saveChatHistory();
        
        // 滚动到底部
        this.scrollToBottom();
        
        console.log('流式消息已完成:', finalText.substring(0, 50) + '...');
    }

    // 移除所有打字光标
    removeAllCursors() {
        const allCursors = document.querySelectorAll('.typing-cursor');
        allCursors.forEach(cursor => cursor.remove());
        console.log('已移除所有打字光标');
    }

    getEssaySystemPrompt() {
        return `${this.config.systemPrompt}

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
    

    
    addMessage(role, content, translation = '', addToHistory = true) {
        const message = {
            id: Date.now(),
            role: role,
            content: content,
            translation: translation,
            timestamp: new Date().toISOString()
        };
        
        if (addToHistory) {
            this.chatHistory.push(message);
            console.log('Message added to history:', message);
        }
        
        // 渲染消息
        this.renderMessage(message);
        
        if (addToHistory) {
            // 保存历史记录
            this.saveChatHistory();
        }
        
        // 滚动到底部
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const chatHistory = document.getElementById('chatHistory');
        if (!chatHistory) {
            console.error('chatHistory element not found in renderMessage');
            return;
        }
        
        // 检查是否已经存在相同ID的消息
        const existingMessage = document.getElementById(`message-${message.id}`);
        if (existingMessage) {
            console.log('消息已存在，跳过渲染:', message.id);
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
        
        // 不再显示翻译
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        chatHistory.appendChild(messageDiv);
        console.log('Message rendered successfully:', message.id);
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
        console.log('showLoading called with:', show);
        
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
            console.log('Send button updated:', show ? 'loading' : 'ready');
        } else {
            console.error('sendButton element not found in showLoading');
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
                ''
            );
        }
    }
    
    toggleTranslation() {
        // 翻译功能已禁用
        console.log('Translation feature is disabled');
    }
    
    toggleEssayMode() {
        this.essayMode = !this.essayMode;
        this.updateEssayModeButton();
    }
    
    updateTranslationButton() {
        // 翻译功能已禁用，按钮已隐藏
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
                    // 不再显示翻译
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
    
    // 强制重置加载状态（用于调试和修复）
    forceResetLoading() {
        console.log('Force resetting loading state');
        this.isLoading = false;
        this.hideThinkingIndicator();
        
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane me-1"></i>发送';
            console.log('Send button force reset to ready state');
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    
    // 等待一小段时间确保所有元素都已加载
    setTimeout(() => {
        console.log('Initializing English AI Assistant...');
        window.aiAssistant = new EnglishAIAssistant();
        
        // 额外的安全检查：确保加载状态被正确重置
        setTimeout(() => {
            if (window.aiAssistant && window.aiAssistant.isLoading) {
                console.warn('Loading state was still true after initialization, forcing reset');
                window.aiAssistant.forceResetLoading();
            }
        }, 1000);
    }, 100);
});
