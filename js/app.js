// 主应用逻辑
class TranslatorApp {
    constructor() {
        this.currentMode = 'translate';
        this.currentTab = 'text';
        this.processedDocBlob = null;
        this.init();
    }
    
    // 初始化应用
    init() {
        this.loadSettings();
        this.bindEvents();
        this.loadHistory();
        this.loadFavorites();
    }
    
    // 加载设置
    loadSettings() {
        const settings = Utils.getSettings();
        
        // 应用字体大小
        document.body.className = `font-${settings.fontSize}`;
        
        // 应用夜间模式
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeBtn').innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // 加载API密钥到设置表单（如果元素存在）
        const claudeKeyInput = document.getElementById('claudeApiKey');
        const ocrKeyInput = document.getElementById('ocrApiKey');
        if (claudeKeyInput) {
            const claudeKey = Utils.getApiKey('claude');
            if (claudeKey) claudeKeyInput.value = claudeKey;
        }
        if (ocrKeyInput) {
            const ocrKey = Utils.getApiKey('ocr');
            if (ocrKey) ocrKeyInput.value = ocrKey;
        }
        
        // 加载其他设置
        document.getElementById('incognitoMode').checked = settings.incognitoMode;
        document.getElementById('localStorageOnly').checked = settings.localStorageOnly;
        document.getElementById('fontSize').value = settings.fontSize;
        document.getElementById('autoSpeak').checked = settings.autoSpeak;
    }
    
    // 绑定事件
    bindEvents() {
        // iOS风格滑动开关
        document.getElementById('modeToggle').addEventListener('click', () => this.toggleMode());
        
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
        });
        
        // 文字输入相关
        document.getElementById('inputText').addEventListener('input', (e) => this.updateCharCount(e.target.value));
        document.getElementById('translateBtn').addEventListener('click', () => this.handleTranslate());
        document.getElementById('clearInputBtn').addEventListener('click', () => this.clearInput());
        document.getElementById('swapLangBtn').addEventListener('click', () => this.swapLanguages());
        
        // 输出控制
        document.getElementById('speakBtn').addEventListener('click', () => this.speakOutput());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyOutput());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToFavorites());
        document.getElementById('rewriteBtn').addEventListener('click', () => this.rewriteAnswer());
        
        // 图片上传
        document.getElementById('imageUploadArea').addEventListener('click', () => document.getElementById('imageInput').click());
        document.getElementById('imageInput').addEventListener('change', (e) => this.handleImageUpload(e.target.files[0]));
        document.getElementById('removeImageBtn').addEventListener('click', () => this.removeImage());
        document.getElementById('processImageBtn').addEventListener('click', () => this.processImage());
        document.getElementById('downloadImageBtn').addEventListener('click', () => this.downloadImage());
        
        // 摄像头功能
        document.getElementById('openCameraBtn').addEventListener('click', () => this.openCamera());
        document.getElementById('takePictureBtn').addEventListener('click', () => this.takePicture());
        document.getElementById('switchCameraBtn').addEventListener('click', () => this.switchCamera());
        document.getElementById('closeCameraBtn').addEventListener('click', () => this.closeCamera());
        
        // 照片编辑
        document.getElementById('editPhotoBtn').addEventListener('click', () => this.togglePhotoEditor());
        document.getElementById('rotateLeftBtn').addEventListener('click', () => this.rotatePhoto(-90));
        document.getElementById('rotateRightBtn').addEventListener('click', () => this.rotatePhoto(90));
        document.getElementById('flipHorizontalBtn').addEventListener('click', () => this.flipPhoto('horizontal'));
        document.getElementById('flipVerticalBtn').addEventListener('click', () => this.flipPhoto('vertical'));
        document.getElementById('brightnessBtn').addEventListener('click', () => this.adjustBrightness());
        document.getElementById('contrastBtn').addEventListener('click', () => this.adjustContrast());
        
        // 文档上传
        document.getElementById('docUploadArea').addEventListener('click', () => document.getElementById('docInput').click());
        document.getElementById('docInput').addEventListener('change', (e) => this.handleDocUpload(e.target.files[0]));
        document.getElementById('removeDocBtn').addEventListener('click', () => this.removeDoc());
        document.getElementById('processDocBtn').addEventListener('click', () => this.processDoc());
        document.getElementById('downloadDocBtn').addEventListener('click', () => this.downloadDoc());
        
        // 快捷短语
        document.querySelectorAll('.phrase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('inputText').value = e.target.dataset.text;
                this.updateCharCount(e.target.dataset.text);
            });
        });
        
        // 侧边栏
        document.getElementById('historyBtn').addEventListener('click', () => this.toggleSidebar('history'));
        document.getElementById('favoriteBtn').addEventListener('click', () => this.toggleSidebar('favorite'));
        document.getElementById('closeHistoryBtn').addEventListener('click', () => this.closeSidebar('history'));
        document.getElementById('closeFavoriteBtn').addEventListener('click', () => this.closeSidebar('favorite'));
        
        // 设置
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetSettings());
        
        // 其他
        document.getElementById('darkModeBtn').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearAllHistory());
        
        // 拖拽上传
        this.setupDragAndDrop();
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    // 切换模式（iOS滑动开关）
    toggleMode() {
        const toggle = document.getElementById('modeToggle');
        const isActive = toggle.classList.contains('active');
        
        if (isActive) {
            // 切换到翻译模式
            this.switchMode('translate');
            toggle.classList.remove('active');
        } else {
            // 切换到AI模式
            this.switchMode('ai');
            toggle.classList.add('active');
        }
    }
    
    // 切换模式
    switchMode(mode) {
        this.currentMode = mode;
        GroqAPI.setMode(mode);
        
        // 显示/隐藏AI选项
        const aiOptions = document.getElementById('aiOptions');
        const rewriteBtn = document.getElementById('rewriteBtn');
        if (mode === 'ai') {
            aiOptions.style.display = 'flex';
            rewriteBtn.style.display = 'inline-flex';
        } else {
            aiOptions.style.display = 'none';
            rewriteBtn.style.display = 'none';
        }
        
        // 更新按钮文字
        const translateBtn = document.getElementById('translateBtn');
        translateBtn.innerHTML = mode === 'translate' 
            ? '<i class="fas fa-paper-plane"></i> 翻译' 
            : '<i class="fas fa-paper-plane"></i> 提问';
    }
    
    // 切换标签页
    switchTab(tab) {
        this.currentTab = tab;
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        document.getElementById(`${tab}Panel`).classList.add('active');
    }
    
    // 其他方法保持不变...
    updateCharCount(text) {
        const count = text.length;
        document.getElementById('charCount').textContent = count;
        
        const charCountEl = document.querySelector('.char-count');
        if (count > CONFIG.LIMITS.MAX_CHAR_COUNT) {
            charCountEl.style.color = 'var(--danger-color)';
        } else {
            charCountEl.style.color = 'var(--text-secondary)';
        }
    }
    
    async handleTranslate() {
        const inputText = document.getElementById('inputText').value.trim();
        
        if (!inputText) {
            Utils.showToast('请输入内容');
            return;
        }
        
        try {
            Utils.showLoading();
            
            let result;
            if (this.currentMode === 'translate') {
                const sourceLang = document.getElementById('sourceLang').value;
                const targetLang = document.getElementById('targetLang').value;
                result = await GroqAPI.translate(inputText, sourceLang, targetLang);
            } else {
                const detailLevel = document.getElementById('detailLevel').value;
                result = await GroqAPI.askQuestion(inputText, detailLevel);
            }
            
            this.displayOutput(result);
            Utils.addHistory({ mode: this.currentMode, input: inputText, output: result });
            
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('处理失败: ' + error.message);
        }
    }
    
    displayOutput(text) {
        const outputSection = document.getElementById('outputSection');
        const outputText = document.getElementById('outputText');
        outputText.textContent = text;
        outputSection.style.display = 'block';
    }
    
    clearInput() {
        document.getElementById('inputText').value = '';
        this.updateCharCount('');
    }
    
    swapLanguages() {
        const sourceLang = document.getElementById('sourceLang');
        const targetLang = document.getElementById('targetLang');
        const temp = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = temp;
    }
    
    speakOutput() {
        const text = document.getElementById('outputText').textContent;
        if (text) Utils.speak(text);
    }
    
    async copyOutput() {
        const text = document.getElementById('outputText').textContent;
        if (text) {
            const success = await Utils.copyToClipboard(text);
            Utils.showToast(success ? '已复制' : '复制失败');
        }
    }
    
    saveToFavorites() {
        const input = document.getElementById('inputText').value;
        const output = document.getElementById('outputText').textContent;
        if (input && output) {
            Utils.addFavorite({ mode: this.currentMode, input, output });
            Utils.showToast('已收藏');
        }
    }
    
    async rewriteAnswer() {
        const input = document.getElementById('inputText').value;
        const output = document.getElementById('outputText').textContent;
        if (!input || !output) return;
        
        try {
            Utils.showLoading();
            const result = await GroqAPI.rewriteAnswer(input, output);
            this.displayOutput(result);
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('重写失败');
        }
    }
    
    async handleImageUpload(file) {
        if (!file) return;
        try {
            const canvas = document.getElementById('imageCanvas');
            await CanvasHandler.loadImageToCanvas(file, canvas);
            document.getElementById('imageUploadArea').style.display = 'none';
            document.getElementById('imagePreview').style.display = 'block';
        } catch (error) {
            Utils.showToast('加载失败');
        }
    }
    
    removeImage() {
        document.getElementById('imageUploadArea').style.display = 'block';
        document.getElementById('imagePreview').style.display = 'none';
    }
    
    async processImage() {
        try {
            Utils.showLoading();
            const canvas = document.getElementById('imageCanvas');
            const imageBase64 = CanvasHandler.getCanvasBase64(canvas);
            const ocrText = await OCR.recognizeText(imageBase64);
            const aiResult = await GroqAPI.processImageText(ocrText, this.currentMode);
            CanvasHandler.overlayTranslation(canvas, ocrText, aiResult);
            document.getElementById('downloadImageBtn').style.display = 'inline-flex';
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('处理失败');
        }
    }
    
    downloadImage() {
        const canvas = document.getElementById('imageCanvas');
        CanvasHandler.downloadCanvas(canvas);
    }
    
    async openCamera() {
        try {
            await Camera.init();
            await Camera.open();
            document.getElementById('imageUploadArea').style.display = 'none';
            document.getElementById('cameraContainer').style.display = 'block';
        } catch (error) {
            Utils.showToast('摄像头打开失败');
        }
    }
    
    async takePicture() {
        try {
            const photoData = Camera.takePhoto();
            Camera.close();
            document.getElementById('cameraContainer').style.display = 'none';
            
            const canvas = document.getElementById('imageCanvas');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext('2d').drawImage(img, 0, 0);
                PhotoEditor.init(canvas);
                document.getElementById('imagePreview').style.display = 'block';
            };
            img.src = photoData;
        } catch (error) {
            Utils.showToast('拍照失败');
        }
    }
    
    async switchCamera() {
        try {
            await Camera.switchCamera();
        } catch (error) {
            Utils.showToast('切换失败');
        }
    }
    
    closeCamera() {
        Camera.close();
        document.getElementById('cameraContainer').style.display = 'none';
        document.getElementById('imageUploadArea').style.display = 'block';
    }
    
    togglePhotoEditor() {
        const editor = document.getElementById('photoEditor');
        editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
    }
    
    rotatePhoto(degrees) {
        PhotoEditor.rotate(degrees);
    }
    
    flipPhoto(direction) {
        if (direction === 'horizontal') PhotoEditor.flipHorizontal();
        else PhotoEditor.flipVertical();
    }
    
    adjustBrightness() {
        PhotoEditor.adjustBrightness(1.2);
    }
    
    adjustContrast() {
        PhotoEditor.adjustContrast(1.2);
    }
    
    async handleDocUpload(file) {
        if (!file) return;
        try {
            const text = await DocxHandler.readDocx(file);
            document.getElementById('docContent').textContent = text;
            document.getElementById('docUploadArea').style.display = 'none';
            document.getElementById('docPreview').style.display = 'block';
        } catch (error) {
            Utils.showToast('文档加载失败');
        }
    }
    
    removeDoc() {
        document.getElementById('docUploadArea').style.display = 'block';
        document.getElementById('docPreview').style.display = 'none';
    }
    
    async processDoc() {
        try {
            Utils.showLoading();
            const file = document.getElementById('docInput').files[0];
            const text = await DocxHandler.readDocx(file);
            const aiResponse = await GroqAPI.processDocument(text, true, false);
            const blob = await DocxHandler.createDocx(aiResponse, text);
            this.processedDocBlob = blob;
            document.getElementById('downloadDocBtn').style.display = 'inline-flex';
            Utils.hideLoading();
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast('处理失败');
        }
    }
    
    downloadDoc() {
        if (this.processedDocBlob) {
            DocxHandler.downloadDocx(this.processedDocBlob);
        }
    }
    
    toggleSidebar(type) {
        const sidebar = document.getElementById(`${type}Sidebar`);
        sidebar.classList.toggle('active');
        if (type === 'history') this.loadHistory();
        else this.loadFavorites();
    }
    
    closeSidebar(type) {
        document.getElementById(`${type}Sidebar`).classList.remove('active');
    }
    
    loadHistory() {
        const history = Utils.getHistory();
        const content = document.getElementById('historyContent');
        if (history.length === 0) {
            content.innerHTML = '<p class="empty-message">暂无历史记录</p>';
        } else {
            content.innerHTML = history.map(item => `
                <div class="history-item">
                    <div>${item.input.substring(0, 50)}</div>
                </div>
            `).join('');
        }
    }
    
    loadFavorites() {
        const favorites = Utils.getFavorites();
        const content = document.getElementById('favoriteContent');
        if (favorites.length === 0) {
            content.innerHTML = '<p class="empty-message">暂无收藏</p>';
        } else {
            content.innerHTML = favorites.map(item => `
                <div class="favorite-item">
                    <div>${item.input.substring(0, 50)}</div>
                </div>
            `).join('');
        }
    }
    
    clearAllHistory() {
        if (confirm('确定清空历史记录吗？')) {
            Utils.clearHistory();
            this.loadHistory();
        }
    }
    
    openSettings() {
        document.getElementById('settingsModal').classList.add('active');
    }
    
    closeSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }
    
    saveSettings() {
        const settings = {
            incognitoMode: document.getElementById('incognitoMode').checked,
            localStorageOnly: document.getElementById('localStorageOnly').checked,
            fontSize: document.getElementById('fontSize').value,
            autoSpeak: document.getElementById('autoSpeak').checked,
            darkMode: document.body.classList.contains('dark-mode')
        };
        Utils.setSettings(settings);
        this.closeSettings();
        Utils.showToast('设置已保存');
    }
    
    resetSettings() {
        if (confirm('确定重置设置吗？')) {
            Utils.setSettings(CONFIG.DEFAULT_SETTINGS);
            this.loadSettings();
        }
    }
    
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
    }
    
    setupDragAndDrop() {
        ['imageUploadArea', 'docUploadArea'].forEach(id => {
            const area = document.getElementById(id);
            area.addEventListener('dragover', (e) => e.preventDefault());
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                    if (id === 'imageUploadArea') this.handleImageUpload(file);
                    else this.handleDocUpload(file);
                }
            });
        });
    }
    
    handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            this.handleTranslate();
        }
        if (e.key === 'Escape') {
            this.closeSettings();
            this.closeSidebar('history');
            this.closeSidebar('favorite');
        }
    }
}

// 初始化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TranslatorApp();
});
