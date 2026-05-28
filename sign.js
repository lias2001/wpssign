const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');

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
    console.log('✅ 打开 WPS 签到主页');
    await page.goto('https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b', {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(5000);

    // 等待页面加载完成后，执行真实点击（最稳）
    console.log('🔥 查找并点击签到按钮');
    
    // 你提供的真实按钮
    const btn = page.locator('div.sign-opera-btn:has-text("点击签到")');
    if (await btn.isVisible()) {
      await btn.click({ delay: 200, force: true });
      console.log('✅ 按钮点击成功 → 正在等待签到完成...');
      await page.waitForTimeout(5000);
      console.log('🎉 签到流程全部完成！');
    } else {
      console.log('✅ 今日已签到（按钮不存在）');
    }

  } catch (e) {
    console.error('❌ 错误：', e.message);
  } finally {
    await browser.close();
  }
})();
