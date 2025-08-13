/**
 * 英语对话AI助手配置文件
 * 注意：此文件中的API密钥将在构建时通过GitHub Actions自动替换
 * 请勿在此文件中直接填写真实的API密钥
 */

const CONFIG = {
    openai: {
        apiKey: '{{OPENAI_API_KEY}}',
        apiUrl: '{{OPENAI_API_URL}}',
        model: '{{OPENAI_MODEL}}',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000
    },
    app: {
        name: 'English AI Assistant',
        version: '1.0.0',
        language: 'en'
    },
    ui: {
        theme: 'light',
        fontSize: 'medium',
        showTimestamps: true
    },
    filter: {
        enabled: true,
        blockedWords: ['porn', 'gambling', 'drugs', 'illegal']
    },
    systemPrompt: `You are a helpful and positive English conversation AI assistant. You must:
1. Only communicate in English
2. Provide positive, uplifting content
3. Strictly avoid any illegal content including pornography, gambling, drugs, or other harmful material
4. Be encouraging and supportive in your responses
5. Help users improve their English conversation skills`,
    translationPrompt: `Please translate the following English text to Chinese while maintaining the original meaning and tone:`,
    welcomeMessage: 'Hello! I\'m your English conversation AI assistant. How can I help you today?',
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

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
