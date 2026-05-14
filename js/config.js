// 配置文件
const CONFIG = {
    // API配置
    CLAUDE_API_URL: 'https://api.anthropic.com/v1/messages',
    CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
    
    // OCR配置 (可选择使用Google Vision或百度OCR)
    OCR_PROVIDER: 'google', // 'google' 或 'baidu'
    GOOGLE_VISION_API_URL: 'https://vision.googleapis.com/v1/images:annotate',
    BAIDU_OCR_API_URL: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
    
    // 本地存储键名
    STORAGE_KEYS: {
        CLAUDE_API_KEY: 'translator_claude_api_key',
        OCR_API_KEY: 'translator_ocr_api_key',
        HISTORY: 'translator_history',
        FAVORITES: 'translator_favorites',
        SETTINGS: 'translator_settings',
        CONTEXT: 'translator_context'
    },
    
    // 默认设置
    DEFAULT_SETTINGS: {
        incognitoMode: false,
        localStorageOnly: true,
        fontSize: 'medium',
        autoSpeak: false,
        darkMode: false,
        detailLevel: 'normal'
    },
    
    // 限制配置
    LIMITS: {
        MAX_CHAR_COUNT: 5000,
        MAX_HISTORY_ITEMS: 100,
        MAX_FAVORITES: 50,
        MAX_CONTEXT_MESSAGES: 10
    },
    
    // 翻译语言映射
    LANGUAGES: {
        'zh': '中文',
        'en': 'English',
        'auto': '自动检测'
    },
    
    // AI详细程度提示词
    DETAIL_PROMPTS: {
        simple: '请用简单易懂的语言回答，保持简洁。',
        normal: '请提供标准详细程度的回答。',
        detailed: '请提供详细全面的回答，包含更多解释和例子。',
        academic: '请以学术风格回答，包含专业术语和深入分析。'
    }
};

// 工具函数
const Utils = {
    // 获取本地存储
    getStorage(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('读取存储失败:', e);
            return null;
        }
    },
    
    // 设置本地存储
    setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('保存存储失败:', e);
            return false;
        }
    },
    
    // 删除本地存储
    removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('删除存储失败:', e);
            return false;
        }
    },
    
    // 清空所有存储
    clearAllStorage() {
        try {
            Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('清空存储失败:', e);
            return false;
        }
    },
    
    // 获取API密钥
    getApiKey(type = 'claude') {
        const key = type === 'claude' 
            ? CONFIG.STORAGE_KEYS.CLAUDE_API_KEY 
            : CONFIG.STORAGE_KEYS.OCR_API_KEY;
        return this.getStorage(key);
    },
    
    // 保存API密钥
    setApiKey(type, key) {
        const storageKey = type === 'claude' 
            ? CONFIG.STORAGE_KEYS.CLAUDE_API_KEY 
            : CONFIG.STORAGE_KEYS.OCR_API_KEY;
        return this.setStorage(storageKey, key);
    },
    
    // 获取设置
    getSettings() {
        const settings = this.getStorage(CONFIG.STORAGE_KEYS.SETTINGS);
        return settings || CONFIG.DEFAULT_SETTINGS;
    },
    
    // 保存设置
    setSettings(settings) {
        return this.setStorage(CONFIG.STORAGE_KEYS.SETTINGS, settings);
    },
    
    // 获取历史记录
    getHistory() {
        const history = this.getStorage(CONFIG.STORAGE_KEYS.HISTORY);
        return history || [];
    },
    
    // 添加历史记录
    addHistory(item) {
        const settings = this.getSettings();
        if (settings.incognitoMode) return false;
        
        const history = this.getHistory();
        history.unshift({
            ...item,
            timestamp: Date.now(),
            id: Date.now().toString()
        });
        
        // 限制历史记录数量
        if (history.length > CONFIG.LIMITS.MAX_HISTORY_ITEMS) {
            history.pop();
        }
        
        return this.setStorage(CONFIG.STORAGE_KEYS.HISTORY, history);
    },
    
    // 清空历史记录
    clearHistory() {
        return this.setStorage(CONFIG.STORAGE_KEYS.HISTORY, []);
    },
    
    // 获取收藏
    getFavorites() {
        const favorites = this.getStorage(CONFIG.STORAGE_KEYS.FAVORITES);
        return favorites || [];
    },
    
    // 添加收藏
    addFavorite(item) {
        const favorites = this.getFavorites();
        
        // 检查是否已存在
        const exists = favorites.some(fav => 
            fav.input === item.input && fav.output === item.output
        );
        
        if (exists) return false;
        
        favorites.unshift({
            ...item,
            timestamp: Date.now(),
            id: Date.now().toString()
        });
        
        // 限制收藏数量
        if (favorites.length > CONFIG.LIMITS.MAX_FAVORITES) {
            favorites.pop();
        }
        
        return this.setStorage(CONFIG.STORAGE_KEYS.FAVORITES, favorites);
    },
    
    // 删除收藏
    removeFavorite(id) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(fav => fav.id !== id);
        return this.setStorage(CONFIG.STORAGE_KEYS.FAVORITES, filtered);
    },
    
    // 获取上下文
    getContext() {
        const context = this.getStorage(CONFIG.STORAGE_KEYS.CONTEXT);
        return context || [];
    },
    
    // 添加上下文
    addContext(message) {
        const context = this.getContext();
        context.push(message);
        
        // 限制上下文数量
        if (context.length > CONFIG.LIMITS.MAX_CONTEXT_MESSAGES) {
            context.shift();
        }
        
        return this.setStorage(CONFIG.STORAGE_KEYS.CONTEXT, context);
    },
    
    // 清空上下文
    clearContext() {
        return this.setStorage(CONFIG.STORAGE_KEYS.CONTEXT, []);
    },
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
        
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 检测语言
    detectLanguage(text) {
        // 简单的语言检测
        const chineseRegex = /[\u4e00-\u9fa5]/;
        return chineseRegex.test(text) ? 'zh' : 'en';
    },
    
    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    },
    
    // 文本转语音
    speak(text, lang = 'zh-CN') {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
            return true;
        }
        return false;
    },
    
    // 停止语音
    stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    },
    
    // 显示Toast提示
    showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },
    
    // 显示加载动画
    showLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.style.display = 'flex';
    },
    
    // 隐藏加载动画
    hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) loading.style.display = 'none';
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 导出配置和工具
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, Utils };
}
