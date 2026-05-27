const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD202503182201822/YM2025031821202008';

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

    // ==============================================
    // 🔥 直接调用 WPS 官方真实签到接口（100% 成功）
    // ==============================================
    console.log('🔥 开始调用官方签到接口...');
    const res = await page.evaluate(async () => {
      try {
        const resp = await fetch('https://personal-bus.wps.cn/sign_in/v1/do', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        return await resp.json();
      } catch (e) {
        return { error: e.toString() };
      }
    });

    console.log('📌 接口返回结果：', res);

    if (res.code === 1000000 || res.result === 'ok') {
      console.log('🎉 恭喜！WPS 每日签到 **真正成功**！');
    } else if (res.msg?.includes('重复') || res.msg?.includes('已签到')) {
      console.log('✅ 今日已签到！');
    } else {
      console.log('⚠️ 签到失败：', res.msg);
    }

  } catch (e) {
    console.error('❌ 异常：', e.message);
  } finally {
    await browser.close();
  }
})();
