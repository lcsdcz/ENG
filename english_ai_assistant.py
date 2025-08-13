#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
英语对话AI助手
功能：
1. 只使用英语与用户对话
2. 内容积极正面，禁止黄赌毒等违法内容
3. 将AI回复翻译成中文
"""

import os
import json
import requests
from typing import Dict, List, Optional
import time

class EnglishAIAssistant:
    def __init__(self):
        # 从环境变量或配置文件加载API配置
        self.api_key = os.getenv('OPENAI_API_KEY', 'sk-FadRRn1rmnl5cBivgMuR7pvppW8bTxo83QAUJ0osdAEnxEXe')
        self.api_url = os.getenv('OPENAI_API_URL', 'https://new1.588686.xyz/v1/chat/completions')
        self.model = os.getenv('OPENAI_MODEL', 'deepseek-ai/DeepSeek-V3-0324-fast')
        
        # 对话历史
        self.conversation_history = []
        
        # 系统提示词 - 确保AI只使用英语且内容积极正面
        self.system_prompt = """You are a helpful and positive English conversation AI assistant. 

IMPORTANT RULES:
1. ALWAYS respond in ENGLISH ONLY - never use any other language
2. Keep all content POSITIVE, UPLIFTING, and EDUCATIONAL
3. STRICTLY FORBIDDEN: pornography, gambling, drugs, violence, hate speech, or any illegal content
4. Focus on helpful topics like: learning English, personal development, positive thinking, education, hobbies, travel, culture, science, technology, health, and motivation
5. Be encouraging, supportive, and inspiring in your responses
6. If someone asks about inappropriate topics, politely redirect to positive alternatives
7. Maintain a warm, friendly, and professional tone
8. Help users improve their English skills through natural conversation

Start every response with a warm greeting and maintain engaging conversation."""

    def add_to_history(self, role: str, content: str):
        """添加对话到历史记录"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": time.time()
        })
        
        # 保持对话历史在合理范围内（最多20轮对话）
        if len(self.conversation_history) > 40:
            self.conversation_history = self.conversation_history[-40:]

    def call_openai_api(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """调用OpenAI API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7,
            "stream": False
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            if 'choices' in result and len(result['choices']) > 0:
                return result['choices'][0]['message']['content']
            else:
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"API调用错误: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            return None

    def translate_to_chinese(self, english_text: str) -> str:
        """将英文文本翻译成中文"""
        # 这里使用简单的翻译提示词，您也可以集成专门的翻译API
        translation_prompt = f"""Please translate the following English text to Chinese (Simplified). 
        Only provide the Chinese translation, no explanations:
        
        {english_text}"""
        
        messages = [
            {"role": "system", "content": "You are a professional English to Chinese translator. Provide only the Chinese translation."},
            {"role": "user", "content": translation_prompt}
        ]
        
        chinese_text = self.call_openai_api(messages)
        return chinese_text if chinese_text else "翻译失败"

    def chat(self, user_input: str) -> Dict[str, str]:
        """主要的对话方法"""
        # 检查用户输入是否包含不当内容
        inappropriate_keywords = ['黄', '赌', '毒', '色情', '暴力', '赌博', '吸毒', '违法']
        if any(keyword in user_input for keyword in inappropriate_keywords):
            english_response = "I'm sorry, but I cannot discuss inappropriate or illegal topics. Let's focus on something positive and constructive instead. What would you like to learn about today?"
            chinese_response = "抱歉，我不能讨论不当或违法的话题。让我们专注于积极和建设性的事情吧。您今天想了解什么？"
            
            self.add_to_history("user", user_input)
            self.add_to_history("assistant", english_response)
            
            return {
                "english": english_response,
                "chinese": chinese_response
            }
        
        # 构建对话消息
        messages = [{"role": "system", "content": self.system_prompt}]
        
        # 添加对话历史（最近几轮）
        recent_history = self.conversation_history[-10:] if len(self.conversation_history) > 10 else self.conversation_history
        for msg in recent_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # 添加当前用户输入
        messages.append({"role": "user", "content": user_input})
        
        # 调用API获取英文回复
        english_response = self.call_openai_api(messages)
        
        if not english_response:
            english_response = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment."
            chinese_response = "抱歉，我现在连接有问题。请稍后再试。"
        else:
            # 翻译成中文
            chinese_response = self.translate_to_chinese(english_response)
        
        # 添加到对话历史
        self.add_to_history("user", user_input)
        self.add_to_history("assistant", english_response)
        
        return {
            "english": english_response,
            "chinese": chinese_response
        }

    def start_conversation(self):
        """启动对话界面"""
        print("=" * 60)
        print("🌟 欢迎使用英语对话AI助手！")
        print("🌟 Welcome to English Conversation AI Assistant!")
        print("=" * 60)
        print("💡 提示：AI将用英语回复，并自动翻译成中文")
        print("💡 Tip: AI will respond in English and auto-translate to Chinese")
        print("=" * 60)
        print("🚫 禁止内容：黄赌毒等违法内容")
        print("🚫 Forbidden: inappropriate or illegal content")
        print("=" * 60)
        print("输入 'quit' 或 '退出' 结束对话")
        print("Type 'quit' or '退出' to end conversation")
        print("=" * 60)
        
        while True:
            try:
                user_input = input("\n👤 您 (You): ").strip()
                
                if user_input.lower() in ['quit', '退出', 'exit', 'q']:
                    print("\n👋 感谢使用英语对话AI助手！再见！")
                    print("👋 Thank you for using English Conversation AI Assistant! Goodbye!")
                    break
                
                if not user_input:
                    print("请输入内容...")
                    continue
                
                print("\n🤖 AI助手正在思考中...")
                response = self.chat(user_input)
                
                print(f"\n🤖 AI助手 (English):")
                print(f"   {response['english']}")
                print(f"\n🤖 AI助手 (中文):")
                print(f"   {response['chinese']}")
                
            except KeyboardInterrupt:
                print("\n\n👋 对话被中断，再见！")
                break
            except Exception as e:
                print(f"\n❌ 发生错误: {e}")
                print("请重试...")

def main():
    """主函数"""
    try:
        assistant = EnglishAIAssistant()
        assistant.start_conversation()
    except Exception as e:
        print(f"程序启动失败: {e}")
        print("请检查API配置是否正确")

if __name__ == "__main__":
    main()
