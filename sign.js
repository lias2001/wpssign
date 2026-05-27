const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const TARGET_URL = 'https://personal-act.wps.cn/';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    storageState: STATE_PATH,
    locale: 'zh-CN'
  });

  const page = await context.newPage();

  try {
    console.log('✅ 打开页面');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);

    console.log('🔥 调用官方签到接口...');
    const res = await page.evaluate(async () => {
      try {
        const resp = await fetch('https://personal-bus.wps.cn/sign_in/v1/do', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        return await resp.json();
      } catch (e) {
        return { error: e.message };
      }
    });

    console.log('📌 结果：', res);

    if (res.code === 1000000 || res.result === 'ok') {
      console.log('🎉 签到成功！');
    } else if (res.msg?.includes('已签到') || res.msg?.includes('重复')) {
      console.log('✅ 今日已签到');
    } else {
      console.log('⚠️ 签到结果：', res.msg);
    }

  } catch (e) {
    console.error('❌ 错误：', e.message);
  } finally {
    await browser.close();
  }
})();
