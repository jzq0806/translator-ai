// Vercel Serverless Function - Groq API代理
// 这个文件将部署到Vercel作为后端API

export default async function handler(req, res) {
    // 设置CORS头 - 允许GitHub Pages访问
    res.setHeader('Access-Control-Allow-Origin', 'https://jzq0806.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // 只允许POST请求
    if (req.method !== 'POST') {
        res.status(405).json({ error: '只允许POST请求' });
        return;
    }
    
    try {
        const { messages, system, model = 'llama-3.1-70b-versatile', temperature = 0.7, max_tokens = 4096 } = req.body;
        
        // 验证必需参数
        if (!messages || !Array.isArray(messages)) {
            res.status(400).json({ error: '缺少messages参数' });
            return;
        }
        
        // 从环境变量获取Groq API密钥
        const apiKey = process.env.GROQ_API_KEY;
        
        if (!apiKey) {
            res.status(500).json({ error: '服务器配置错误：未设置API密钥' });
            return;
        }
        
        // 调用Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    ...(system ? [{ role: 'system', content: system }] : []),
                    ...messages
                ],
                temperature: temperature,
                max_tokens: max_tokens
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Groq API错误:', error);
            res.status(response.status).json({ 
                error: error.error?.message || 'Groq API调用失败' 
            });
            return;
        }
        
        const data = await response.json();
        
        // 返回AI响应
        res.status(200).json({
            response: data.choices[0].message.content,
            model: data.model,
            usage: data.usage
        });
        
    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({ 
            error: '服务器内部错误: ' + error.message 
        });
    }
}
