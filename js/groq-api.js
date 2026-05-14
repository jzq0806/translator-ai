// Groq API 集成（免费AI）
const GroqAPI = {
    // 当前模式
    currentMode: 'translate', // 'translate' 或 'ai'
    
    // API配置
    apiUrl: 'https://translator-ai-api.vercel.app/api/groq', // 后端代理地址
    
    // 调用后端API
    async callGroq(messages, systemPrompt = '') {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    system: systemPrompt,
                    model: 'llama-3.1-70b-versatile', // Groq的免费模型
                    temperature: 0.7,
                    max_tokens: 4096
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'API调用失败');
            }
            
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Groq API错误:', error);
            
            // 如果后端不可用，提示用户
            if (error.message.includes('Failed to fetch')) {
                throw new Error('无法连接到服务器，请检查网络连接');
            }
            
            throw error;
        }
    },
    
    // 翻译模式
    async translate(text, sourceLang, targetLang) {
        const systemPrompt = `你是一个专业的翻译助手。请将用户输入的文本从${CONFIG.LANGUAGES[sourceLang] || sourceLang}翻译成${CONFIG.LANGUAGES[targetLang] || targetLang}。

要求：
1. 保持原文的语气和风格
2. 确保翻译准确、自然、流畅
3. 对于专业术语，提供准确的翻译
4. 只返回翻译结果，不要添加任何解释或额外内容`;
        
        const messages = [{
            role: 'user',
            content: text
        }];
        
        return await this.callGroq(messages, systemPrompt);
    },
    
    // AI问答模式
    async askQuestion(question, detailLevel = 'normal') {
        const detailPrompt = CONFIG.DETAIL_PROMPTS[detailLevel] || CONFIG.DETAIL_PROMPTS.normal;
        
        const systemPrompt = `你是一个智能学习助手，伪装成翻译工具。当用户提出问题时，你需要：

1. 提供准确、有帮助的答案
2. 以中英文双语形式回答（中文在前，英文在后）
3. ${detailPrompt}
4. 如果是学术问题，提供清晰的解释和步骤
5. 保持友好、专业的语气
6. 答案格式：先用中文回答，然后换行，再用英文回答

示例格式：
中文答案内容...

English answer content...`;
        
        // 获取上下文
        const context = Utils.getContext();
        const messages = [
            ...context,
            {
                role: 'user',
                content: question
            }
        ];
        
        const response = await this.callGroq(messages, systemPrompt);
        
        // 保存上下文
        Utils.addContext({ role: 'user', content: question });
        Utils.addContext({ role: 'assistant', content: response });
        
        return response;
    },
    
    // 图片识别后的AI处理
    async processImageText(ocrText, mode = 'translate') {
        if (mode === 'translate') {
            // 翻译模式：直接翻译识别的文字
            return await this.translate(ocrText, 'auto', 'zh');
        } else {
            // AI模式：分析题目并给出答案
            const systemPrompt = `你是一个智能学习助手。用户上传了一张包含问题或题目的图片，OCR识别出的文字如下。请：

1. 分析题目内容
2. 提供详细的解答步骤
3. 以中英文双语形式回答
4. 确保答案准确、易懂
5. 格式化输出，使其看起来像是"翻译"的结果

答案格式：
【中文解答】
...

【English Solution】
...`;
            
            const messages = [{
                role: 'user',
                content: `请分析并解答以下题目：\n\n${ocrText}`
            }];
            
            return await this.callGroq(messages, systemPrompt);
        }
    },
    
    // 文档处理
    async processDocument(docText, keepFormatting = true, addReferences = false) {
        const systemPrompt = `你是一个智能作业助手。用户上传了一个包含作业题目的文档，请：

1. 仔细阅读每个题目
2. 提供准确、完整的答案
3. ${keepFormatting ? '保持原文档的格式和结构' : '以清晰的格式组织答案'}
4. ${addReferences ? '在答案末尾添加参考来源（可以是学术性的建议来源）' : ''}
5. 确保答案质量高，适合提交

要求：
- 对于简答题，提供详细但简洁的答案
- 对于论述题，提供结构化的论述
- 对于计算题，展示完整的计算步骤
- 使用专业、学术的语言`;
        
        const messages = [{
            role: 'user',
            content: `请完成以下作业：\n\n${docText}`
        }];
        
        return await this.callGroq(messages, systemPrompt);
    },
    
    // 改写答案（生成不同版本）
    async rewriteAnswer(originalQuestion, originalAnswer) {
        const systemPrompt = `你是一个智能改写助手。用户需要对同一个问题生成不同表达方式的答案，以避免雷同。请：

1. 保持答案的核心内容和准确性
2. 使用不同的表达方式和句式结构
3. 调整词汇选择，使用同义词
4. 保持答案的质量和专业性
5. 如果是中英文双语答案，两种语言都要改写`;
        
        const messages = [{
            role: 'user',
            content: `原问题：${originalQuestion}\n\n原答案：${originalAnswer}\n\n请生成一个不同表达方式的答案。`
        }];
        
        return await this.callGroq(messages, systemPrompt);
    },
    
    // 单词释义（点击英文单词显示中文）
    async getWordDefinition(word) {
        const systemPrompt = `你是一个词典助手。用户点击了一个英文单词，请提供：

1. 中文释义（主要含义）
2. 词性
3. 简单的例句（可选）

格式：
[词性] 中文释义
例：...（如果适用）

保持简洁，不超过3行。`;
        
        const messages = [{
            role: 'user',
            content: word
        }];
        
        try {
            return await this.callGroq(messages, systemPrompt);
        } catch (error) {
            // 如果API调用失败，返回基本信息
            return `[查询失败] 无法获取"${word}"的释义`;
        }
    },
    
    // 设置当前模式
    setMode(mode) {
        this.currentMode = mode;
        Utils.clearContext(); // 切换模式时清空上下文
    },
    
    // 获取当前模式
    getMode() {
        return this.currentMode;
    },
    
    // 设置API地址（用于本地测试）
    setApiUrl(url) {
        this.apiUrl = url;
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GroqAPI;
}
