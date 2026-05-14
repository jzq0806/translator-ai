// OCR 功能集成 - 使用Tesseract.js（免费）
const OCR = {
    // 使用Tesseract.js进行OCR（免费客户端OCR）
    async tesseractOCR(imageBase64) {
        try {
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js未加载');
            }
            
            Utils.showLoading();
            
            const { data: { text } } = await Tesseract.recognize(
                imageBase64,
                'eng+chi_sim', // 英文和简体中文
                {
                    logger: m => {
                        // 显示进度
                        if (m.status === 'recognizing text') {
                            console.log(`OCR进度: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            return text.trim();
        } catch (error) {
            console.error('Tesseract OCR错误:', error);
            throw new Error('OCR识别失败: ' + error.message);
        }
    },
    
    // 使用Google Vision API进行OCR（备用）
    async googleVisionOCR(imageBase64) {
        const apiKey = Utils.getApiKey('ocr');
        
        if (!apiKey) {
            // 如果没有API密钥，使用Tesseract
            return await this.tesseractOCR(imageBase64);
        }
        
        try {
            const response = await fetch(`${CONFIG.GOOGLE_VISION_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        image: {
                            content: imageBase64.split(',')[1] // 移除data:image/...;base64,前缀
                        },
                        features: [{
                            type: 'TEXT_DETECTION',
                            maxResults: 1
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                throw new Error('OCR识别失败');
            }
            
            const data = await response.json();
            const textAnnotations = data.responses[0]?.textAnnotations;
            
            if (!textAnnotations || textAnnotations.length === 0) {
                throw new Error('未识别到文字');
            }
            
            return textAnnotations[0].description;
        } catch (error) {
            console.error('Google Vision OCR错误:', error);
            throw error;
        }
    },
    
    // 使用百度OCR API
    async baiduOCR(imageBase64) {
        const apiKey = Utils.getApiKey('ocr');
        
        if (!apiKey) {
            throw new Error('请先在设置中配置OCR API密钥');
        }
        
        try {
            // 百度OCR需要先获取access_token
            // 这里简化处理，实际使用时需要先获取token
            const imageData = imageBase64.split(',')[1];
            
            const response = await fetch(CONFIG.BAIDU_OCR_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `image=${encodeURIComponent(imageData)}&access_token=${apiKey}`
            });
            
            if (!response.ok) {
                throw new Error('OCR识别失败');
            }
            
            const data = await response.json();
            
            if (data.error_code) {
                throw new Error(data.error_msg || 'OCR识别失败');
            }
            
            // 合并所有识别的文字
            const text = data.words_result.map(item => item.words).join('\n');
            return text;
        } catch (error) {
            console.error('百度OCR错误:', error);
            throw error;
        }
    },
    
    // 主OCR函数（优先使用免费的Tesseract.js）
    async recognizeText(imageBase64) {
        try {
            // 优先使用免费的Tesseract.js
            return await this.tesseractOCR(imageBase64);
        } catch (error) {
            console.error('Tesseract OCR失败，尝试备用方案:', error);
            
            // 如果Tesseract失败，尝试使用Google Vision（如果有API密钥）
            const apiKey = Utils.getApiKey('ocr');
            if (apiKey && CONFIG.OCR_PROVIDER === 'google') {
                try {
                    return await this.googleVisionOCR(imageBase64);
                } catch (e) {
                    console.error('Google Vision OCR也失败:', e);
                }
            }
            
            // 如果都失败，抛出错误
            throw new Error('OCR识别失败，请确保图片清晰且包含文字');
        }
    },
    
    
    // 图片预处理（提高OCR准确率）
    preprocessImage(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 转换为灰度图
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
        
        // 增加对比度
        const contrast = 1.5;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },
    
    // 检测图片中的文字区域
    detectTextRegions(canvas) {
        // 这是一个简化的文字区域检测
        // 实际应用中可能需要更复杂的算法
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 返回整个图片作为文字区域（简化处理）
        return [{
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        }];
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OCR;
}
