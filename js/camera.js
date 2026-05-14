// 摄像头功能模块
const Camera = {
    stream: null,
    currentFacingMode: 'environment', // 'user' 或 'environment'
    videoElement: null,
    
    // 初始化摄像头
    async init() {
        this.videoElement = document.getElementById('cameraVideo');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('您的浏览器不支持摄像头功能');
        }
    },
    
    // 打开摄像头
    async open(facingMode = 'environment') {
        try {
            // 如果已有流，先关闭
            if (this.stream) {
                this.close();
            }
            
            this.currentFacingMode = facingMode;
            
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.stream;
            
            return true;
        } catch (error) {
            console.error('打开摄像头失败:', error);
            
            if (error.name === 'NotAllowedError') {
                throw new Error('摄像头权限被拒绝，请在浏览器设置中允许访问摄像头');
            } else if (error.name === 'NotFoundError') {
                throw new Error('未找到摄像头设备');
            } else if (error.name === 'NotReadableError') {
                throw new Error('摄像头正在被其他应用使用');
            } else {
                throw new Error('无法访问摄像头: ' + error.message);
            }
        }
    },
    
    // 切换前后摄像头
    async switchCamera() {
        const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
        await this.open(newFacingMode);
    },
    
    // 拍照
    takePhoto() {
        if (!this.videoElement || !this.stream) {
            throw new Error('摄像头未打开');
        }
        
        // 创建临时canvas
        const canvas = document.createElement('canvas');
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        
        // 返回base64图片数据
        return canvas.toDataURL('image/jpeg', 0.95);
    },
    
    // 连续拍照
    async takeContinuousPhotos(count = 3, interval = 500) {
        const photos = [];
        
        for (let i = 0; i < count; i++) {
            photos.push(this.takePhoto());
            
            if (i < count - 1) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        
        return photos;
    },
    
    // 关闭摄像头
    close() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
    },
    
    // 获取可用摄像头列表
    async getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('获取摄像头列表失败:', error);
            return [];
        }
    },
    
    // 检查是否有多个摄像头
    async hasMultipleCameras() {
        const cameras = await this.getAvailableCameras();
        return cameras.length > 1;
    },
    
    // 获取摄像头状态
    isOpen() {
        return this.stream !== null && this.stream.active;
    },
    
    // 获取视频尺寸
    getVideoSize() {
        if (!this.videoElement) {
            return { width: 0, height: 0 };
        }
        
        return {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
        };
    }
};

// 照片编辑器
const PhotoEditor = {
    canvas: null,
    ctx: null,
    originalImageData: null,
    currentRotation: 0,
    currentFlipH: false,
    currentFlipV: false,
    
    // 初始化编辑器
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.saveOriginal();
    },
    
    // 保存原始图片
    saveOriginal() {
        if (this.canvas && this.ctx) {
            this.originalImageData = this.ctx.getImageData(
                0, 0, 
                this.canvas.width, 
                this.canvas.height
            );
        }
    },
    
    // 恢复原始图片
    restore() {
        if (this.originalImageData) {
            this.ctx.putImageData(this.originalImageData, 0, 0);
            this.currentRotation = 0;
            this.currentFlipH = false;
            this.currentFlipV = false;
        }
    },
    
    // 旋转图片
    rotate(degrees) {
        this.currentRotation = (this.currentRotation + degrees) % 360;
        this.applyTransformations();
    },
    
    // 水平翻转
    flipHorizontal() {
        this.currentFlipH = !this.currentFlipH;
        this.applyTransformations();
    },
    
    // 垂直翻转
    flipVertical() {
        this.currentFlipV = !this.currentFlipV;
        this.applyTransformations();
    },
    
    // 应用所有变换
    applyTransformations() {
        if (!this.originalImageData) return;
        
        // 创建临时canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.originalImageData.width;
        tempCanvas.height = this.originalImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(this.originalImageData, 0, 0);
        
        // 清空主canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存当前状态
        this.ctx.save();
        
        // 移动到中心点
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // 应用旋转
        this.ctx.rotate((this.currentRotation * Math.PI) / 180);
        
        // 应用翻转
        const scaleX = this.currentFlipH ? -1 : 1;
        const scaleY = this.currentFlipV ? -1 : 1;
        this.ctx.scale(scaleX, scaleY);
        
        // 绘制图片
        this.ctx.drawImage(
            tempCanvas,
            -tempCanvas.width / 2,
            -tempCanvas.height / 2
        );
        
        // 恢复状态
        this.ctx.restore();
    },
    
    // 裁剪图片
    crop(x, y, width, height) {
        const imageData = this.ctx.getImageData(x, y, width, height);
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.putImageData(imageData, 0, 0);
        this.saveOriginal();
    },
    
    // 调整亮度
    adjustBrightness(value = 1.2) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * value);     // R
            data[i + 1] = Math.min(255, data[i + 1] * value); // G
            data[i + 2] = Math.min(255, data[i + 2] * value); // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.saveOriginal();
    },
    
    // 调整对比度
    adjustContrast(value = 1.2) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;         // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.saveOriginal();
    },
    
    // 转为灰度
    grayscale() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.saveOriginal();
    },
    
    // 锐化
    sharpen() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 锐化卷积核
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            sum += tempData[idx] * kernel[kernelIdx];
                        }
                    }
                    const idx = (y * width + x) * 4 + c;
                    data[idx] = Math.max(0, Math.min(255, sum));
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.saveOriginal();
    },
    
    // 重置所有编辑
    reset() {
        this.restore();
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Camera, PhotoEditor };
}
