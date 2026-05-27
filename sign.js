const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const USER_DATA_DIR = path.join(__dirname, 'pw_cache');

const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

(async () => {
  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 720 },
    locale: 'zh-CN',
    storageState: STATE_PATH,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  try {
    console.log('✅ 打开签到页面');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 点击你提供的签到按钮
    const signBtn = page.locator('div[data-v-82ca2e75]:text("点击签到")');
    if (await signBtn.count() > 0) {
      await signBtn.click({ delay: 300 });
      console.log('✅ 签到成功！');
    } else {
      console.log('ℹ️ 今日已签到');
    }
  } catch (e) {
    console.error('❌ 出错：', e.message);
  } finally {
    await browser.close();
  }
})();
