// Vercel Serverless Function for chat API
import { createParser } from 'eventsource-parser';

// API配置 - 使用环境变量
const API_CONFIG = {
  api_key: process.env.OPENAI_API_KEY,
  api_url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
};

export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, stream = false, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!API_CONFIG.api_key) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const requestData = {
      model: API_CONFIG.model,
      messages,
      temperature: API_CONFIG.temperature,
      stream
    };

    if (max_tokens) {
      requestData.max_tokens = max_tokens;
    }

    if (stream) {
      // 流式响应
      return await handleStreamResponse(requestData, res);
    } else {
      // 非流式响应
      return await handleNormalResponse(requestData, res);
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleNormalResponse(requestData, res) {
  try {
    const response = await fetch(API_CONFIG.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.api_key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'English-AI-Assistant/1.0'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Normal response error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleStreamResponse(requestData, res) {
  try {
    const response = await fetch(API_CONFIG.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.api_key}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': 'English-AI-Assistant/1.0'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Stream API Error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 创建解析器
    const parser = createParser((event) => {
      if (event.type === 'event') {
        res.write(`data: ${event.data}\n\n`);
      }
    });

    // 流式传输数据
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      parser.feed(chunk);
    }

    res.end();

  } catch (error) {
    console.error('Stream response error:', error);
    return res.status(500).json({ error: error.message });
  }
}
