// Word文档处理功能
const DocxHandler = {
    // 当前文档数据
    currentDocText: '',
    currentDocName: '',
    
    // 读取Word文档
    async readDocx(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    
                    // 使用PizZip解压docx文件
                    const zip = new PizZip(arrayBuffer);
                    
                    // 提取document.xml
                    const documentXml = zip.file('word/document.xml').asText();
                    
                    // 解析XML并提取文本
                    const text = this.extractTextFromXml(documentXml);
                    
                    this.currentDocText = text;
                    this.currentDocName = file.name;
                    
                    resolve(text);
                } catch (error) {
                    console.error('读取文档失败:', error);
                    reject(new Error('文档格式不支持或文件损坏'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    },
    
    // 从XML中提取文本
    extractTextFromXml(xml) {
        // 创建DOM解析器
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        
        // 提取所有文本节点
        const textNodes = xmlDoc.getElementsByTagName('w:t');
        let text = '';
        
        for (let i = 0; i < textNodes.length; i++) {
            text += textNodes[i].textContent;
            
            // 在段落之间添加换行
            const nextNode = textNodes[i].parentNode;
            if (nextNode && nextNode.nodeName === 'w:r') {
                const paragraph = nextNode.parentNode;
                if (paragraph && paragraph.nodeName === 'w:p' && i < textNodes.length - 1) {
                    text += '\n';
                }
            }
        }
        
        return text.trim();
    },
    
    // 创建新的Word文档
    async createDocx(content, originalText = '') {
        try {
            // 使用docx库创建文档
            if (typeof docx === 'undefined') {
                throw new Error('docx库未加载');
            }
            
            const { Document, Packer, Paragraph, TextRun } = docx;
            
            // 分割内容为段落
            const paragraphs = content.split('\n').filter(line => line.trim() !== '');
            
            // 创建文档段落
            const docParagraphs = paragraphs.map(text => {
                return new Paragraph({
                    children: [
                        new TextRun({
                            text: text,
                            font: 'Arial',
                            size: 24 // 12pt
                        })
                    ],
                    spacing: {
                        after: 200
                    }
                });
            });
            
            // 创建文档
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docParagraphs
                }]
            });
            
            // 生成blob
            const blob = await Packer.toBlob(doc);
            return blob;
        } catch (error) {
            console.error('创建文档失败:', error);
            // 降级方案：创建简单的文本文件
            return this.createTextFile(content);
        }
    },
    
    // 创建文本文件（降级方案）
    createTextFile(content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        return blob;
    },
    
    // 下载文档
    downloadDocx(blob, filename = 'completed-assignment.docx') {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },
    
    // 处理文档（读取、AI处理、生成新文档）
    async processDocument(file, keepFormatting = true, addReferences = false) {
        try {
            // 1. 读取文档
            Utils.showLoading();
            const text = await this.readDocx(file);
            
            if (!text || text.trim() === '') {
                throw new Error('文档内容为空');
            }
            
            // 2. 使用AI处理
            const aiResponse = await ClaudeAPI.processDocument(text, keepFormatting, addReferences);
            
            // 3. 创建新文档
            const blob = await this.createDocx(aiResponse, text);
            
            Utils.hideLoading();
            
            return {
                originalText: text,
                processedText: aiResponse,
                blob: blob
            };
        } catch (error) {
            Utils.hideLoading();
            throw error;
        }
    },
    
    // 格式化文档内容用于显示
    formatForDisplay(text, maxLength = 500) {
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength) + '...\n\n[文档内容过长，仅显示前' + maxLength + '字符]';
    },
    
    // 分析文档结构
    analyzeDocument(text) {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        return {
            totalLines: lines.length,
            totalChars: text.length,
            totalWords: text.split(/\s+/).length,
            hasQuestions: /[?？]/.test(text),
            hasNumbers: /\d+/.test(text),
            language: Utils.detectLanguage(text)
        };
    },
    
    // 清除当前文档数据
    clear() {
        this.currentDocText = '';
        this.currentDocName = '';
    },
    
    // 验证文档格式
    validateDocx(file) {
        const validExtensions = ['.doc', '.docx'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!isValid) {
            throw new Error('仅支持 .doc 和 .docx 格式的文档');
        }
        
        // 检查文件大小（限制为10MB）
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('文件大小不能超过10MB');
        }
        
        return true;
    },
    
    // 提取文档中的问题
    extractQuestions(text) {
        const lines = text.split('\n');
        const questions = [];
        
        lines.forEach((line, index) => {
            // 检测问题标记
            if (/^\d+[\.)、]/.test(line) || /[?？]$/.test(line)) {
                questions.push({
                    number: questions.length + 1,
                    text: line.trim(),
                    lineNumber: index + 1
                });
            }
        });
        
        return questions;
    },
    
    // 合并原文档和AI答案
    mergeDocumentWithAnswers(originalText, answers) {
        const questions = this.extractQuestions(originalText);
        let result = '';
        
        if (questions.length === 0) {
            // 如果没有检测到问题，直接返回答案
            return answers;
        }
        
        // 为每个问题添加答案
        questions.forEach((question, index) => {
            result += `${question.text}\n\n`;
            
            // 尝试从AI答案中提取对应的答案
            const answerLines = answers.split('\n');
            if (answerLines[index]) {
                result += `答案：${answerLines[index]}\n\n`;
            }
        });
        
        return result;
    }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocxHandler;
}
