/**
 * 英语对话AI助手 - 主要应用逻辑
 */

class EnglishAIAssistant {
    constructor() {
        this.chatHistory = [];
        this.isLoading = false;
        this.userSettings = this.loadUserSettings();
        this.conversationStats = this.loadConversationStats();
        this.translationEnabled = true; // 默认启用翻译
        
        this.init();
    }
    
    init() {
        this.loadChatHistory();
        this.setupEventListeners();
        this.applyUserSettings();
        this.updateStats();
        this.showWelcomeMessage();
        
        // 从用户设置加载翻译状态
        this.translationEnabled = this.userSettings.translationEnabled;
        this.updateTranslationButton();
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
            this.addMessage('ai', CONFIG.filter.redirectMessage, '抱歉，我不能讨论不当或违法的话题。让我们专注于积极和建设性的事情吧。您今天想了解什么？');
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
        const messages = [
            { role: 'system', content: CONFIG.systemPrompt },
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
                    'Authorization': `Bearer ${CONFIG.openai.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.choices && result.choices.length > 0) {
                return result.choices[0].message.content;
            } else {
                throw new Error('API返回格式错误');
            }
        } catch (error) {
            console.error('OpenAI API调用失败:', error);
            throw error;
        }
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
                    'Authorization': `Bearer ${CONFIG.openai.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.choices && result.choices.length > 0) {
                return result.choices[0].message.content;
            } else {
                return '翻译失败';
            }
        } catch (error) {
            console.error('翻译失败:', error);
            return '翻译失败';
        }
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
        
        // 限制历史记录长度
        if (this.chatHistory.length > CONFIG.app.maxHistoryLength) {
            this.chatHistory = this.chatHistory.slice(-CONFIG.app.maxHistoryLength);
        }
        
        // 渲染消息
        this.renderMessage(message);
        
        // 自动保存
        if (this.userSettings.autoSave) {
            this.saveChatHistory();
        }
        
        // 滚动到底部
        this.scrollToBottom();
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
        const chatHistory = document.getElementById('chatHistory');
        
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
    }
    
    isInappropriateContent(content) {
        if (!CONFIG.filter.enabled) return false;
        
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
        // 如果这是第一次使用，显示欢迎消息
        if (this.chatHistory.length === 0) {
            this.addMessage('ai', CONFIG.welcomeMessage.english, CONFIG.welcomeMessage.chinese);
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
}

// 全局函数
function showHelp() {
    const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
    helpModal.show();
}

function showStats() {
    const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
    const statsContent = document.getElementById('statsContent');
    
    if (window.aiAssistant) {
        const stats = window.aiAssistant.conversationStats;
        statsContent.innerHTML = `
            <div class="row text-center">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h3>${stats.totalMessages}</h3>
                            <p class="mb-0">总消息数</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h3>${stats.userMessages}</h3>
                            <p class="mb-0">用户消息</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h3>${stats.aiMessages}</h3>
                            <p class="mb-0">AI回复</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-3">
                <p><strong>开始时间：</strong> ${stats.firstMessageTime ? new Date(stats.firstMessageTime).toLocaleString() : '无'}</p>
                <p><strong>最后时间：</strong> ${stats.lastMessageTime ? new Date(stats.lastMessageTime).toLocaleString() : '无'}</p>
            </div>
        `;
    }
    
    statsModal.show();
}

function showSettings() {
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal'));
    settingsModal.show();
}

function saveSettings() {
    if (window.aiAssistant) {
        window.aiAssistant.userSettings.showEnglish = document.getElementById('showEnglish').checked;
        window.aiAssistant.userSettings.showChinese = document.getElementById('showChinese').checked;
        window.aiAssistant.userSettings.autoSave = document.getElementById('autoSave').checked;
        window.aiAssistant.saveUserSettings();
        
        // 重新渲染消息以应用新设置
        const chatHistory = document.getElementById('chatHistory');
        chatHistory.innerHTML = '';
        window.aiAssistant.chatHistory.forEach(msg => window.aiAssistant.renderMessage(msg));
        
        const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        settingsModal.hide();
        
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            设置已保存
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

function exportChat() {
    if (window.aiAssistant && window.aiAssistant.chatHistory.length > 0) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `english_ai_conversation_${timestamp}.txt`;
        
        let content = '英语对话AI助手 - 对话记录\n';
        content += '='.repeat(50) + '\n\n';
        
        window.aiAssistant.chatHistory.forEach(msg => {
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
        
        // 显示成功消息
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success alert-dismissible fade show';
        successDiv.innerHTML = `
            <i class="fas fa-download me-2"></i>
            对话记录已导出到: ${filename}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(successDiv, container.firstChild);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    } else {
        alert('暂无对话记录可导出');
    }
}

function clearChat() {
    if (confirm('确定要清空所有对话历史吗？此操作不可恢复。')) {
        if (window.aiAssistant) {
            window.aiAssistant.chatHistory = [];
            document.getElementById('chatHistory').innerHTML = '';
            window.aiAssistant.saveChatHistory();
            window.aiAssistant.updateStats();
            window.aiAssistant.showWelcomeMessage();
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查配置是否已替换
    if (CONFIG.openai.apiKey === '{{OPENAI_API_KEY}}') {
        console.warn('API配置未替换，请确保已正确配置GitHub Actions');
        document.body.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-warning">
                    <h4>配置未完成</h4>
                    <p>API配置尚未设置，请按照部署说明配置GitHub Secrets和Actions。</p>
                    <p>详细说明请查看项目README文档。</p>
                </div>
            </div>
        `;
        return;
    }
    
    // 初始化AI助手
    window.aiAssistant = new EnglishAIAssistant();
});
