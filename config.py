#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置文件 - 英语对话AI助手
"""

import os
from typing import Dict, Any

class Config:
    """配置管理类"""
    
    def __init__(self):
        # OpenAI API配置
        self.openai_config = {
            'api_key': os.getenv('OPENAI_API_KEY', 'sk-FadRRn1rmnl5cBivgMuR7pvppW8bTxo83QAUJ0osdAEnxEXe'),
            'api_url': os.getenv('OPENAI_API_URL', 'https://new1.588686.xyz/v1/chat/completions'),
            'model': os.getenv('OPENAI_MODEL', 'deepseek-ai/DeepSeek-V3-0324-fast'),
            'max_tokens': 1000,
            'temperature': 0.7,
            'timeout': 30
        }
        
        # 对话配置
        self.conversation_config = {
            'max_history_length': 40,  # 最大对话历史长度
            'recent_history_count': 10,  # 发送给API的最近对话轮数
            'enable_translation': True,  # 是否启用中文翻译
            'auto_save_history': True,  # 是否自动保存对话历史
        }
        
        # 内容过滤配置
        self.filter_config = {
            'inappropriate_keywords': [
                '黄', '赌', '毒', '色情', '暴力', '赌博', '吸毒', '违法',
                'porn', 'gambling', 'drugs', 'violence', 'illegal'
            ],
            'redirect_message': "I'm sorry, but I cannot discuss inappropriate or illegal topics. Let's focus on something positive and constructive instead. What would you like to learn about today?"
        }
        
        # UI配置
        self.ui_config = {
            'show_english': True,  # 显示英文回复
            'show_chinese': True,  # 显示中文翻译
            'show_timestamps': False,  # 显示时间戳
            'language': 'zh-CN'  # 界面语言
        }
    
    def get_openai_config(self) -> Dict[str, Any]:
        """获取OpenAI配置"""
        return self.openai_config.copy()
    
    def get_conversation_config(self) -> Dict[str, Any]:
        """获取对话配置"""
        return self.conversation_config.copy()
    
    def get_filter_config(self) -> Dict[str, Any]:
        """获取过滤配置"""
        return self.filter_config.copy()
    
    def get_ui_config(self) -> Dict[str, Any]:
        """获取UI配置"""
        return self.ui_config.copy()
    
    def update_config(self, section: str, key: str, value: Any):
        """更新配置"""
        if hasattr(self, f'{section}_config'):
            config_dict = getattr(self, f'{section}_config')
            if key in config_dict:
                config_dict[key] = value
                return True
        return False
    
    def save_to_file(self, filename: str = 'config.json'):
        """保存配置到文件"""
        try:
            config_data = {
                'openai_config': self.openai_config,
                'conversation_config': self.conversation_config,
                'filter_config': self.filter_config,
                'ui_config': self.ui_config
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                import json
                json.dump(config_data, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"保存配置文件失败: {e}")
            return False
    
    def load_from_file(self, filename: str = 'config.json'):
        """从文件加载配置"""
        try:
            if os.path.exists(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    import json
                    config_data = json.load(f)
                
                # 更新配置
                for section, config_dict in config_data.items():
                    if hasattr(self, f'{section}_config'):
                        current_config = getattr(self, f'{section}_config')
                        current_config.update(config_dict)
                
                return True
        except Exception as e:
            print(f"加载配置文件失败: {e}")
        
        return False

# 全局配置实例
config = Config()

# 尝试加载配置文件
config.load_from_file()
