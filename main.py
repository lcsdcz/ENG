#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
英语对话AI助手 - 主程序
改进版本，集成配置管理和更多功能
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Optional

# 导入配置和助手类
from config import config
from english_ai_assistant import EnglishAIAssistant

class EnhancedEnglishAIAssistant(EnglishAIAssistant):
    """增强版英语对话AI助手"""
    
    def __init__(self):
        super().__init__()
        # 使用配置文件中的设置
        openai_config = config.get_openai_config()
        self.api_key = openai_config['api_key']
        self.api_url = openai_config['api_url']
        self.model = openai_config['model']
        
        # 对话配置
        conv_config = config.get_conversation_config()
        self.max_history_length = conv_config['max_history_length']
        self.recent_history_count = conv_config['recent_history_count']
        self.enable_translation = conv_config['enable_translation']
        self.auto_save_history = conv_config['auto_save_history']
        
        # 过滤配置
        filter_config = config.get_filter_config()
        self.inappropriate_keywords = filter_config['inappropriate_keywords']
        self.redirect_message = filter_config['redirect_message']
        
        # UI配置
        ui_config = config.get_ui_config()
        self.show_english = ui_config['show_english']
        self.show_chinese = ui_config['show_chinese']
        self.show_timestamps = ui_config['show_timestamps']
        
        # 对话历史文件
        self.history_file = 'conversation_history.json'
        
        # 加载对话历史
        self.load_conversation_history()
    
    def add_to_history(self, role: str, content: str):
        """添加对话到历史记录"""
        timestamp = datetime.now().isoformat()
        
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": timestamp
        })
        
        # 保持对话历史在合理范围内
        if len(self.conversation_history) > self.max_history_length:
            self.conversation_history = self.conversation_history[-self.max_history_length:]
        
        # 自动保存历史
        if self.auto_save_history:
            self.save_conversation_history()
    
    def save_conversation_history(self):
        """保存对话历史到文件"""
        try:
            with open(self.history_file, 'w', encoding='utf-8') as f:
                json.dump(self.conversation_history, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"保存对话历史失败: {e}")
    
    def load_conversation_history(self):
        """从文件加载对话历史"""
        try:
            if os.path.exists(self.history_file):
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    self.conversation_history = json.load(f)
                print(f"✅ 已加载 {len(self.conversation_history)} 条对话历史")
            else:
                self.conversation_history = []
                print("📝 开始新的对话")
        except Exception as e:
            print(f"加载对话历史失败: {e}")
            self.conversation_history = []
    
    def export_conversation(self, filename: str = None):
        """导出对话记录"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"conversation_export_{timestamp}.txt"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("英语对话AI助手 - 对话记录\n")
                f.write("=" * 50 + "\n\n")
                
                for msg in self.conversation_history:
                    timestamp = msg.get('timestamp', '')
                    role = msg['role']
                    content = msg['content']
                    
                    if self.show_timestamps and timestamp:
                        f.write(f"[{timestamp}] ")
                    
                    if role == 'user':
                        f.write(f"👤 您: {content}\n")
                    else:
                        f.write(f"🤖 AI: {content}\n")
                    
                    f.write("\n")
            
            print(f"✅ 对话记录已导出到: {filename}")
            return True
        except Exception as e:
            print(f"导出对话记录失败: {e}")
            return False
    
    def show_statistics(self):
        """显示对话统计信息"""
        total_messages = len(self.conversation_history)
        user_messages = len([msg for msg in self.conversation_history if msg['role'] == 'user'])
        ai_messages = len([msg for msg in self.conversation_history if msg['role'] == 'assistant'])
        
        print("\n📊 对话统计信息:")
        print(f"   总消息数: {total_messages}")
        print(f"   用户消息: {user_messages}")
        print(f"   AI回复: {ai_messages}")
        
        if self.conversation_history:
            first_msg_time = self.conversation_history[0].get('timestamp', '')
            last_msg_time = self.conversation_history[-1].get('timestamp', '')
            if first_msg_time and last_msg_time:
                print(f"   开始时间: {first_msg_time}")
                print(f"   最后时间: {last_msg_time}")
    
    def chat(self, user_input: str) -> Dict[str, str]:
        """主要的对话方法"""
        # 检查用户输入是否包含不当内容
        if any(keyword.lower() in user_input.lower() for keyword in self.inappropriate_keywords):
            english_response = self.redirect_message
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
        recent_history = self.conversation_history[-self.recent_history_count*2:] if len(self.conversation_history) > self.recent_history_count*2 else self.conversation_history
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
            if self.enable_translation:
                chinese_response = self.translate_to_chinese(english_response)
            else:
                chinese_response = "翻译功能已禁用"
        
        # 添加到对话历史
        self.add_to_history("user", user_input)
        self.add_to_history("assistant", english_response)
        
        return {
            "english": english_response,
            "chinese": chinese_response
        }
    
    def start_conversation(self):
        """启动对话界面"""
        self.print_welcome_message()
        
        while True:
            try:
                user_input = input("\n👤 您 (You): ").strip()
                
                if user_input.lower() in ['quit', '退出', 'exit', 'q']:
                    self.print_goodbye_message()
                    break
                
                if user_input.lower() in ['help', '帮助', 'h']:
                    self.show_help()
                    continue
                
                if user_input.lower() in ['stats', '统计', 's']:
                    self.show_statistics()
                    continue
                
                if user_input.lower() in ['export', '导出', 'e']:
                    self.export_conversation()
                    continue
                
                if user_input.lower() in ['clear', '清空', 'c']:
                    self.clear_conversation()
                    continue
                
                if not user_input:
                    print("请输入内容...")
                    continue
                
                print("\n🤖 AI助手正在思考中...")
                response = self.chat(user_input)
                
                # 显示回复
                if self.show_english:
                    print(f"\n🤖 AI助手 (English):")
                    print(f"   {response['english']}")
                
                if self.show_chinese:
                    print(f"\n🤖 AI助手 (中文):")
                    print(f"   {response['chinese']}")
                
            except KeyboardInterrupt:
                print("\n\n👋 对话被中断，再见！")
                break
            except Exception as e:
                print(f"\n❌ 发生错误: {e}")
                print("请重试...")
    
    def print_welcome_message(self):
        """打印欢迎信息"""
        print("=" * 70)
        print("🌟 欢迎使用英语对话AI助手！")
        print("🌟 Welcome to English Conversation AI Assistant!")
        print("=" * 70)
        print("💡 提示：AI将用英语回复，并自动翻译成中文")
        print("💡 Tip: AI will respond in English and auto-translate to Chinese")
        print("=" * 70)
        print("🚫 禁止内容：黄赌毒等违法内容")
        print("🚫 Forbidden: inappropriate or illegal content")
        print("=" * 70)
        print("📚 可用命令:")
        print("   help/帮助/h - 显示帮助信息")
        print("   stats/统计/s - 显示对话统计")
        print("   export/导出/e - 导出对话记录")
        print("   clear/清空/c - 清空对话历史")
        print("   quit/退出/q - 结束对话")
        print("=" * 70)
    
    def print_goodbye_message(self):
        """打印告别信息"""
        print("\n👋 感谢使用英语对话AI助手！再见！")
        print("👋 Thank you for using English Conversation AI Assistant! Goodbye!")
        
        # 保存对话历史
        if self.auto_save_history:
            self.save_conversation_history()
            print("💾 对话历史已自动保存")
    
    def show_help(self):
        """显示帮助信息"""
        print("\n📚 帮助信息:")
        print("=" * 40)
        print("这是一个英语对话AI助手，具有以下功能：")
        print("1. 纯英语对话 - AI只使用英语回复")
        print("2. 内容过滤 - 自动过滤不当内容")
        print("3. 中文翻译 - 自动将AI回复翻译成中文")
        print("4. 对话历史 - 自动保存和加载对话记录")
        print("5. 统计功能 - 查看对话统计信息")
        print("6. 导出功能 - 导出对话记录到文件")
        print("\n💡 建议话题：")
        print("   - 英语学习")
        print("   - 个人发展")
        print("   - 积极思考")
        print("   - 教育文化")
        print("   - 兴趣爱好")
        print("   - 旅行探索")
        print("   - 科学技术")
        print("   - 健康生活")
        print("   - 励志激励")
    
    def clear_conversation(self):
        """清空对话历史"""
        confirm = input("确定要清空所有对话历史吗？(y/N): ").strip().lower()
        if confirm in ['y', 'yes', '是']:
            self.conversation_history = []
            if os.path.exists(self.history_file):
                os.remove(self.history_file)
            print("✅ 对话历史已清空")
        else:
            print("❌ 操作已取消")

def main():
    """主函数"""
    try:
        print("🚀 正在启动英语对话AI助手...")
        assistant = EnhancedEnglishAIAssistant()
        assistant.start_conversation()
    except Exception as e:
        print(f"❌ 程序启动失败: {e}")
        print("请检查API配置是否正确")
        print("请确保已安装所需的依赖包：pip install requests")

if __name__ == "__main__":
    main()
