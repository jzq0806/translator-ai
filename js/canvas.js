// Canvas 图片处理功能
const CanvasHandler = {
    // 当前图片数据
    currentImage: null,
    originalImageData: null,
    
    // 加载图片到Canvas
    loadImageToCanvas(file, canvas) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // 设置canvas尺寸
                    const maxWidth = 800;
                    const maxHeight = 600;
                    let width = img.width;
                    let height = img.height;
                    
                    // 保持宽高比缩放
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 绘制图片
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 保存原始图片数据
                    this.currentImage = img;
                    this.originalImageData = ctx.getImageData(0, 0, width, height);
                    
                    resolve(canvas);
                };
                
                img.onerror = () => {
                    reject(new Error('图片加载失败'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsDataURL(file);
        });
    },
    
    // 获取Canvas的Base64数据
    getCanvasBase64(canvas) {
        return canvas.toDataURL('image/png');
    },
    
    // 在图片上叠加翻译文字（模仿微信/有道翻译效果）
    overlayTranslation(canvas, originalText, translatedText) {
        const ctx = canvas.getContext('2d');
        
        // 恢复原始图片
        if (this.originalImageData) {
            ctx.putImageData(this.originalImageData, 0, 0);
        }
        
        // 检测文字区域（简化处理，使用整个图片）
        const textRegions = this.detectTextRegions(canvas, originalText);
        
        // 为每个文字区域添加翻译
        textRegions.forEach(region => {
            this.drawTranslationOverlay(ctx, region, translatedText);
        });
        
        return canvas;
    },
    
    // 检测文字区域（简化版本）
    detectTextRegions(canvas, text) {
        // 简化处理：将整个图片作为一个文字区域
        // 实际应用中可以使用更复杂的算法来检测具体的文字位置
        const padding = 20;
        return [{
            x: padding,
            y: padding,
            width: canvas.width - padding * 2,
            height: canvas.height - padding * 2,
            text: text
        }];
    },
    
    // 绘制翻译覆盖层
    drawTranslationOverlay(ctx, region, translatedText) {
        const { x, y, width, height } = region;
        
        // 1. 模糊原文区域
        this.blurRegion(ctx, x, y, width, height);
        
        // 2. 添加半透明背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x, y, width, height);
        
        // 3. 绘制翻译文字
        this.drawMultilineText(ctx, translatedText, x, y, width, height);
    },
    
    // 模糊指定区域
    blurRegion(ctx, x, y, width, height) {
        // 获取区域图像数据
        const imageData = ctx.getImageData(x, y, width, height);
        const data = imageData.data;
        
        // 简单的模糊算法（平均值模糊）
        const blurRadius = 3;
        const tempData = new Uint8ClampedArray(data);
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                    for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                        const nx = px + dx;
                        const ny = py + dy;
                        
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const idx = (ny * width + nx) * 4;
                            r += tempData[idx];
                            g += tempData[idx + 1];
                            b += tempData[idx + 2];
                            count++;
                        }
                    }
                }
                
                const idx = (py * width + px) * 4;
                data[idx] = r / count;
                data[idx + 1] = g / count;
                data[idx + 2] = b / count;
            }
        }
        
        ctx.putImageData(imageData, x, y);
    },
    
    // 绘制多行文字
    drawMultilineText(ctx, text, x, y, maxWidth, maxHeight) {
        // 设置字体样式
        const fontSize = 16;
        ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = '#2C3E50';
        ctx.textBaseline = 'top';
        
        // 分割文字为多行
        const lines = this.wrapText(ctx, text, maxWidth - 20);
        const lineHeight = fontSize * 1.5;
        const totalHeight = lines.length * lineHeight;
        
        // 垂直居中
        const startY = y + (maxHeight - totalHeight) / 2;
        
        // 绘制每一行
        lines.forEach((line, index) => {
            const lineY = startY + index * lineHeight;
            const textWidth = ctx.measureText(line).width;
            const lineX = x + (maxWidth - textWidth) / 2; // 水平居中
            
            ctx.fillText(line, lineX, lineY);
        });
    },
    
    // 文字换行处理
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        
        return lines;
    },
    
    // 下载Canvas为图片
    downloadCanvas(canvas, filename = 'translated-image.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    },
    
    // 重置Canvas
    resetCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        if (this.originalImageData) {
            ctx.putImageData(this.originalImageData, 0, 0);
        }
    },
    
    // 添加水印（可选）
    addWatermark(canvas, text = '智能翻译') {
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        const padding = 10;
        ctx.fillText(text, canvas.width - padding, canvas.height - padding);
        
        ctx.restore();
    },
    
    // 调整图片亮度
    adjustBrightness(canvas, brightness = 1.2) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * brightness);
            data[i + 1] = Math.min(255, data[i + 1] * brightness);
            data[i + 2] = Math.min(255, data[i + 2] * brightness);
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },
    
    // 调整图片对比度
    adjustContrast(canvas, contrast = 1.2) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },
    
    // 清除当前图片数据
    clear() {
        this.currentImage = null;
        this.originalImageData = null;
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasHandler;
}
