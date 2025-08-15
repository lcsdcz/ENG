// Vercel Serverless Function for chat API
import { createParser } from 'eventsource-parser';

// API配置 - 使用环境变量
const API_CONFIG = {
  api_key: process.env.OPENAI_API_KEY,
  api_url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '512', 10),
  request_timeout_ms: parseInt(process.env.UPSTREAM_TIMEOUT_MS || '20000', 10),
  retry_count: parseInt(process.env.UPSTREAM_RETRY || '2', 10)
};

export default async function handler(req, res) {
  // 设置CORS和安全头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

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

    requestData.max_tokens = max_tokens || API_CONFIG.max_tokens;

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
    console.log('发送请求到SoruxGPT:', {
      url: API_CONFIG.api_url,
      model: requestData.model,
      messages: requestData.messages.length,
      stream: requestData.stream,
      temperature: requestData.temperature
    });

    let response = await fetchWithTimeoutAndRetry(API_CONFIG.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.api_key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'English-AI-Assistant/1.0'
      },
      body: JSON.stringify(requestData)
    });

    console.log('SoruxGPT响应状态:', response.status, response.statusText);
    console.log('SoruxGPT响应头:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText = await response.text();
      
      // Sorux 有时把上游 OpenAI 内部错误映射成 400，我们这里对包含 "server_inner_error_openai" 的 400 再做一次快速重试
      if (response.status === 400 && typeof errorText === 'string' && errorText.includes('server_inner_error_openai')) {
        console.warn('检测到 server_inner_error_openai(400)，进行一次快速重试');
        await new Promise(r => setTimeout(r, 600));
        response = await fetchWithTimeoutAndRetry(API_CONFIG.api_url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.api_key}`,
            'Content-Type': 'application/json',
            'User-Agent': 'English-AI-Assistant/1.0'
          },
          body: JSON.stringify(requestData)
        });
        if (response.ok) {
          const result = await response.json();
          console.log('SoruxGPT成功响应(经400重试):', {
            id: result.id,
            model: result.model,
            choices: result.choices ? result.choices.length : 0
          });
          return res.status(200).json(result);
        }
        errorText = await response.text();
      }
      console.error('SoruxGPT API错误:', response.status, errorText);
      
      // 尝试解析错误详情
      try {
        const errorJson = JSON.parse(errorText);
        console.error('解析后的错误JSON:', errorJson);
      } catch (e) {
        console.error('错误响应不是JSON格式');
      }
      
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    console.log('SoruxGPT成功响应:', {
      id: result.id,
      model: result.model,
      choices: result.choices ? result.choices.length : 0,
      content: result.choices && result.choices[0] ? result.choices[0].message?.content?.substring(0, 100) + '...' : 'No content'
    });
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('SoruxGPT API调用异常:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleStreamResponse(requestData, res) {
  try {
    let response = await fetchWithTimeoutAndRetry(API_CONFIG.api_url, {
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
      let errorText = await response.text();
      if (response.status === 400 && typeof errorText === 'string' && errorText.includes('server_inner_error_openai')) {
        console.warn('检测到 server_inner_error_openai(400)-stream，进行一次快速重试');
        await new Promise(r => setTimeout(r, 600));
        response = await fetchWithTimeoutAndRetry(API_CONFIG.api_url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.api_key}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'User-Agent': 'English-AI-Assistant/1.0'
          },
          body: JSON.stringify(requestData)
        });
        if (response.ok) {
          // 继续下面的流式逻辑
        } else {
          errorText = await response.text();
        }
      }
      console.error('OpenAI Stream API Error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
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

// 带超时与重试的fetch（处理 429/5xx/网络错误/超时）
async function fetchWithTimeoutAndRetry(url, options) {
  const retryableStatus = new Set([429, 500, 502, 503, 504]);
  let lastError;

  for (let attempt = 0; attempt <= API_CONFIG.retry_count; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.request_timeout_ms);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok && retryableStatus.has(resp.status) && attempt < API_CONFIG.retry_count) {
        const waitMs = 700 * Math.pow(2, attempt);
        console.warn(`上游返回 ${resp.status}，第${attempt + 1}次重试，等待 ${waitMs}ms`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return resp;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn('上游请求超时，准备重试');
      } else {
        console.warn('上游请求异常，准备重试:', err.message);
      }
      if (attempt < API_CONFIG.retry_count) {
        const waitMs = 700 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('上游请求失败');
}
