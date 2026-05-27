const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const TARGET_URL = '你的签到地址';

(async () => {
  if (!fs.existsSync(STATE_PATH)) {
    console.error('❌ state.json 不存在');
    process.exit(1);
  }

  // 👇 关键：不用 launchPersistentContext，只用 newContext + storageState
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    storageState: STATE_PATH, // 只靠这个带登录态
    locale: 'zh-CN',
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    await page.goto(TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(5000);

    const signBtn = page.locator('div.sign-opera-btn:has-text("点击签到")');
    if (await signBtn.isVisible()) {
      await signBtn.click({ delay: 300 });
      console.log('✅ 签到成功');
    } else {
      console.log('ℹ️ 已签到或按钮未找到');
    }
  } catch (e) {
    console.error('❌ 出错：', e.message);
  } finally {
    await browser.close();
  }
})();
