module.exports = {
  apps: [{
    name: 'ai-content-daily-job',
    script: 'daily-job.js',
    cwd: '/root/.openclaw/workspace-makemoney_jonny/ai-content-factory',
    instances: 1,
    cron_restart: '0 9 * * *',  // 每天9点
    autorestart: false,
    watch: false,
    max_memory_restart: '1G',
    kill_timeout: 30000,
    wait_ready: false,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    env: {
      NODE_ENV: 'production'
      // 在运行环境中注入以下变量：
      // HF_API_KEY=your_huggingface_api_key
      // LLM_API_KEY=your_llm_api_key
      // LLM_BASE_URL=https://your-llm-endpoint/v1
      // LLM_MODEL=your_model_name
      // TELEGRAM_BOT_TOKEN=your_bot_token
      // TELEGRAM_CHAT_ID=your_chat_id
    }
  }]
};
