# 每日自动运行方案

## 🏗️ 需要的支撑

### 服务器要求
**最低配置：**
- CPU: 2核
- 内存: 4GB
- 存储: 20GB
- 操作系统: Linux（Ubuntu 20.04+）

**推荐配置：**
- CPU: 4核
- 内存: 8GB
- 存储: 50GB
- 操作系统: Ubuntu 22.04 LTS

---

### 软件环境
**必需：**
- Node.js 18+（已有）
- Docker（可选，用于TTS）
- Git（代码管理）

**可选：**
- Nginx（Web服务器）
- PM2（进程管理）
- Cron（定时任务）

---

### 网络要求
**带宽：**
- 最低: 10Mbps
- 推荐: 100Mbps

**流量：**
- 如果每天生成100张图片 + 100段语音
- 每月约：30GB流量

---

### 成本估算
#### 云服务器
**国内服务器（推荐）：**
- 阿里云：2核4GB = 约 50-80元/月
- 腾讯云：2核4GB = 约 60-90元/月
- 华为云：2核4GB = 约 50-70元/月

**国外服务器：**
- DigitalOcean: $6-12/月（42-86元/月）
- Vultr: $5-10/月（35-70元/月）
- Linode: $5-10/月（35-70元/月）

#### 额外成本
- 域名: 10-50元/年
- SSL证书: 0元（Let's Encrypt免费）
- 备份: 10-20元/月（可选）

**总成本：** 约 50-150元/月

---

## 🚀 自动化方案

### 方案1：Cron定时任务（推荐）

#### 每日定时任务
```bash
# 编辑crontab
crontab -e

# 添加以下行（每天早上9点运行）
0 9 * * * cd /root/.openclaw/workspace-makemoney_jonny/ai-content-factory && node daily-job.js >> logs/daily.log 2>&1
```

#### 优势
- ✅ 系统自带，无需额外安装
- ✅ 稳定可靠
- ✅ 资源占用小

#### 缺点
- ⚠️ 只能按时间运行
- ⚠️ 不支持复杂调度

---

### 方案2：PM2进程管理（推荐）

#### 安装PM2
```bash
npm install -g pm2
```

#### 创建PM2配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'daily-content-generator',
    script: 'daily-job.js',
    cwd: '/root/.openclaw/workspace-makemoney_jonny/ai-content-factory',
    instances: 1,
    cron: '0 9 * * *',  // 每天9点
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      HF_API_KEY: 'your_huggingface_api_key'
    }
  }]
};
```

#### 启动
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 开机自启
```

#### 优势
- ✅ 自动重启
- ✅ 日志管理
- ✅ 资源监控
- ✅ 开机自启

---

### 方案3：GitHub Actions（推荐）

#### 创建workflow文件
```yaml
# .github/workflows/daily-content.yml
name: Daily Content Generation
on:
  schedule:
    - cron: '0 1 * * *'  # UTC 1点 = 北京9点
  workflow_dispatch:  # 手动触发

jobs:
  generate-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Generate daily content
        env:
          HF_API_KEY: ${{ secrets.HF_API_KEY }}
        run: node daily-job.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: generated-content
          path: output/*
```

#### 优势
- ✅ 完全免费
- ✅ 不需要服务器
- ✅ 日志完整
- ✅ 可以手动触发

---

## 📋 每日任务清单

### 生成任务（每日早上9点）
```javascript
// daily-job.js
const { ImageService } = require('./dist/index.js');

async function dailyTask() {
  console.log('=================================');
  console.log('每日内容生成任务');
  console.log(`开始时间：${new Date().toLocaleString('zh-CN')}`);
  console.log('=================================\n');

  const imageService = new ImageService(process.env.HF_API_KEY);

  // 1. 生成5张产品封面图
  console.log('📋 任务1：生成5张产品封面图');
  const products = ['智能手表', '无线耳机', '蓝牙音箱', '充电宝', '数据线'];
  
  for (const product of products) {
    await imageService.generateProductCover(product, 'modern');
    console.log(`   ✅ ${product} 封面图生成完成`);
    await sleep(2000);  // 避免速率限制
  }

  // 2. 生成5张不同风格封面
  console.log('\n📋 任务2：生成5张不同风格封面');
  const styles = ['modern', 'cute', 'luxury', 'minimalist', 'modern'];
  for (let i = 0; i < 5; i++) {
    await imageService.generateProductCover(`产品${i+1}`, styles[i]);
    console.log(`   ✅ ${styles[i]} 风格生成完成`);
    await sleep(2000);
  }

  console.log('\n=================================');
  console.log('✅ 每日任务完成！');
  console.log('=================================\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

dailyTask().catch(console.error);
```

---

## 🔔 通知方案

### Telegram通知
```javascript
// 发送到Telegram
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(message) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    })
  });
}

// 在daily-job.js中使用
await sendTelegramMessage(`
<b>✅ 每日内容生成完成</b>

📊 <b>统计：</b>
• 生成图片：10张
• 总大小：5MB
• 耗时时间：15分钟

📁 <b>位置：</b>
/root/.openclaw/workspace-makemoney_jonny/ai-content-factory/output

⏰ <b>时间：</b>
${new Date().toLocaleString('zh-CN')}
`);
```

### 邮件通知
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your@qq.com',
    pass: 'your-password'
  }
});

await transporter.sendMail({
  from: 'your@qq.com',
  to: 'recipient@example.com',
  subject: '每日内容生成完成',
  text: '已生成10张图片，5段语音'
});
```

---

## 📊 监控方案

### 简单日志
```bash
# 查看今日日志
tail -f logs/daily.log

# 查看错误
grep "ERROR" logs/daily.log
```

### PM2监控
```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs daily-content-generator

# 重启
pm2 restart daily-content-generator
```

---

## 💡 推荐方案

### 对于个人使用
**使用GitHub Actions**
- ✅ 完全免费
- ✅ 不需要服务器
- ✅ 易于维护

### 对于商业化
**使用VPS + PM2**
- ✅ 完全控制
- ✅ 稳定可靠
- ✅ 可以扩容

---

## 🚀 快速开始

### 步骤1：准备服务器（如果还没有）
```bash
# 选择一个VPS提供商
# 阿里云: https://ecs.console.aliyun.com/
# 腾讯云: https://console.cloud.tencent.com/cvm
# Vultr: https://www.vultr.com/

# 创建2核4GB的服务器（Ubuntu 22.04）
# 成本：约50-100元/月
```

### 步骤2：SSH登录服务器
```bash
ssh root@your-server-ip
```

### 步骤3：部署项目
```bash
# 克隆项目
git clone <your-repo> ai-content-factory
cd ai-content-factory

# 安装依赖
npm install

# 安装PM2
npm install -g pm2
```

### 步骤4：配置每日任务
```bash
# 创建配置文件
# (复制上面的 ecosystem.config.js)

# 启动
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 步骤5：测试
```bash
# 手动运行一次测试
node daily-job.js

# 查看PM2状态
pm2 status

# 查看日志
pm2 logs daily-content-generator
```

---

## 📁 文件结构（部署后）
```
ai-content-factory/
├── daily-job.js              📋 每日任务脚本
├── ecosystem.config.js      ⚙️ PM2配置
├── logs/                    📊 日志目录
│   ├── daily.log          每日日志
│   └── error.log           错误日志
├── output/                   📁 生成的内容
└── ...                     (其他文件）
```

---

## 🎯 总结

### 你需要：
1. **服务器** - 2核4GB VPS（50-100元/月）
2. **域名** - 可选（10-50元/年）
3. **Telegram Bot** - 可选（用于通知）

### 我会帮你：
1. 创建每日任务脚本
2. 配置自动化
3. 添加通知功能
4. 设置监控

**告诉我：你已经有服务器了吗？还是需要我推荐一个？**
