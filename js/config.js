/**
 * 英语对话AI助手配置文件
 * 注意：此文件中的API密钥将在构建时通过GitHub Actions自动替换
 * 请勿在此文件中直接填写真实的API密钥
 */

const CONFIG = {
    openai: {
        apiKey: 'sk-oQ5JuAiv2D9SQZ0Y48LvJEUvqfuxjPR2weQJMOnF0IR7fkMQ',
        apiUrl: 'https://gpt.soruxgpt.com/api/api/v1/chat/completions',
        model: 'gpt-4o',
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
    systemPrompt: `You are a helpful English conversation AI assistant. CRITICAL RULE: You must ALWAYS communicate in English ONLY. Never respond in Chinese or any other language.

Key requirements:
1. ALWAYS respond in English - this is mandatory
2. You can understand Chinese input but must reply in English
3. Provide positive, uplifting content
4. Help users improve their English conversation skills
5. Always respond directly to what the user asks
6. Engage in natural conversation

This is a strict rule that cannot be violated. You are an English AI assistant.`,
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

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = {
        openai: {
            apiKey: 'sk-oQ5JuAiv2D9SQZ0Y48LvJEUvqfuxjPR2weQJMOnF0IR7fkMQ',
            apiUrl: 'https://gpt.soruxgpt.com/api/api/v1/chat/completions',
            model: 'gpt-4o',
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
        systemPrompt: `You are a helpful English conversation AI assistant. CRITICAL RULE: You must ALWAYS communicate in English ONLY. Never respond in Chinese or any other language.

Key requirements:
1. ALWAYS respond in English - this is mandatory
2. You can understand Chinese input but must reply in English
3. Provide positive, uplifting content
4. Help users improve their English conversation skills
5. Always respond directly to what the user asks
6. Engage in natural conversation

This is a strict rule that cannot be violated. You are an English AI assistant.`,
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
