# 智能翻译助手 - AI Translator

一个伪装成翻译器的智能AI助手网页应用，专为留学生课堂辅助学习设计。

## 🌟 核心功能

### 1. 文字输入模式
- **翻译模式**: 纯中英文互译，类似有道翻译
- **AI搜题模式**: 输入问题获得AI中英文双语答案
- **单词释义**: 点击英文单词显示中文释义
- **答案改写**: 生成不同表达方式的答案，避免雷同
- **详细程度调节**: 简单/标准/详细/学术四种答案风格

### 2. 图片翻译模式（伪装AI答案）
- 上传图片，OCR识别题目内容
- AI分析并生成答案
- 答案以"翻译"形式覆盖在原图上
- 模仿微信/有道的图片翻译效果
- 支持下载处理后的图片

### 3. 文档自动完成功能
- 上传Word文档（.doc/.docx）
- AI自动完成作业内容
- 直接生成完成后的文档供下载
- 可选保持原格式、添加参考来源

### 4. 额外功能
- 历史记录和收藏夹
- 快速清除历史
- 隐身模式（不保存记录）
- 夜间模式
- 语音朗读
- 上下文记忆（AI记住对话）
- 常用短语快捷输入
- 拖拽上传文件

## 🚀 快速开始

### 在线使用（GitHub Pages）

1. 访问部署的网站：`https://你的用户名.github.io/translator-ai/`

### 本地使用

1. 克隆或下载此项目
2. 用浏览器打开 `index.html` 文件
3. 在设置中配置API密钥

## ⚙️ 配置说明

### 必需配置

#### Claude API密钥
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 创建API密钥
3. 在应用设置中输入密钥（格式：`sk-ant-...`）

#### OCR API密钥（可选）
选择以下任一服务：

**Google Vision API**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 启用 Vision API
3. 创建API密钥

**百度OCR API**
1. 访问 [百度AI开放平台](https://ai.baidu.com/)
2. 创建OCR应用
3. 获取Access Token

### 配置文件修改

编辑 `js/config.js` 选择OCR提供商：

```javascript
OCR_PROVIDER: 'google', // 'google' 或 'baidu'
```

## 📦 部署到GitHub Pages

### 方法一：通过GitHub网页界面

1. 在GitHub上创建新仓库（例如：`translator-ai`）
2. 上传所有项目文件到仓库
3. 进入仓库设置 → Pages
4. Source选择 `main` 分支
5. 点击Save，等待部署完成
6. 访问 `https://你的用户名.github.io/translator-ai/`

### 方法二：通过Git命令行

```bash
# 初始化Git仓库
cd translator-ai
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/translator-ai.git

# 推送到GitHub
git push -u origin main
```

然后在GitHub仓库设置中启用Pages。

## 📁 项目结构

```
translator-ai/
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── config.js          # 配置和工具函数
│   ├── claude-api.js      # Claude API集成
│   ├── ocr.js             # OCR功能
│   ├── canvas.js          # 图片处理
│   ├── docx-handler.js    # 文档处理
│   └── app.js             # 主应用逻辑
└── README.md              # 说明文档
```

## 🔒 隐私与安全

- **本地存储**: 所有数据（API密钥、历史记录、收藏）存储在浏览器本地
- **隐身模式**: 启用后不保存任何历史记录
- **数据加密**: API密钥安全存储
- **无服务器**: 纯前端应用，数据不上传到任何服务器

## 💡 使用技巧

### 课堂使用建议

1. **伪装性**: 界面设计类似翻译软件，不易被察觉
2. **快捷操作**: 使用 `Ctrl/Cmd + Enter` 快速提交
3. **快速清除**: 课后使用"快速清除"按钮清空历史
4. **图片模式**: 拍照后生成的"翻译"图片看起来很自然

### 提高答案质量

1. **详细程度**: 根据题目难度选择合适的答案详细程度
2. **答案改写**: 使用改写功能生成多个版本，避免与同学雷同
3. **上下文记忆**: AI会记住之前的对话，可以追问细节
4. **添加参考**: 文档模式可选择添加参考来源，增加可信度

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **AI服务**: Claude API (Anthropic)
- **OCR**: Google Vision API / 百度OCR API
- **文档处理**: docx.js, PizZip
- **图标**: Font Awesome
- **部署**: GitHub Pages

## ⚠️ 注意事项

1. **API费用**: Claude API和OCR API可能产生费用，请注意使用量
2. **学术诚信**: 本工具仅供学习辅助，请遵守学校的学术诚信政策
3. **浏览器兼容**: 建议使用Chrome、Firefox、Safari等现代浏览器
4. **网络要求**: 需要稳定的网络连接来调用API

## 🐛 常见问题

### API调用失败
- 检查API密钥是否正确配置
- 确认网络连接正常
- 查看浏览器控制台的错误信息

### OCR识别不准确
- 确保图片清晰，文字可读
- 尝试调整图片亮度和对比度
- 考虑使用不同的OCR提供商

### 文档处理失败
- 确认文档格式为 .docx
- 检查文档大小是否超过10MB
- 尝试简化文档内容

### 图片翻译效果不理想
- 图片分辨率不要太低
- 文字区域尽量清晰
- 可以手动调整Canvas处理参数

## 📝 更新日志

### v1.0.0 (2026-05-13)
- ✨ 初始版本发布
- ✅ 实现文字翻译和AI问答功能
- ✅ 实现图片OCR和翻译覆盖
- ✅ 实现Word文档自动完成
- ✅ 添加历史记录和收藏功能
- ✅ 支持夜间模式和多种界面设置

## 📄 许可证

MIT License - 自由使用和修改

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题或建议，请通过GitHub Issues联系。

---

**免责声明**: 本工具仅供学习和研究使用。使用者应遵守所在学校和机构的相关规定，对使用本工具产生的任何后果自行负责。
# Force deployment
