const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
// 这里必须写完整的 URL，不能写中文占位符
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

(async () => {
  if (!fs.existsSync(STATE_PATH)) {
    console.error('❌ state.json 不存在');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const context = await browser.newContext({
    storageState: STATE_PATH,
    locale: 'zh-CN',
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('✅ 打开签到页面');
    await page.goto(TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(5000);

    const signBtn = page.locator('div.sign-opera-btn:has-text("点击签到")');
    if (await signBtn.isVisible()) {
      await signBtn.click({ delay: 300 });
      console.log('✅ 签到成功！');
    } else {
      console.log('ℹ️ 今日已签到或按钮未找到');
    }
  } catch (e) {
    console.error('❌ 出错：', e.message);
  } finally {
    await browser.close();
  }
})();
