const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const SIGN_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    storageState: STATE_PATH,
    locale: 'zh-CN',
    viewport: { width: 1659, height: 3085 }
  });

  // 第1轮：打开→等2s→刷新→关闭
  let page = await context.newPage();
  console.log('✅ 第1次打开页面');
  await page.goto(SIGN_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  console.log('🔄 第1次刷新');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.close();

  // 第2轮
  page = await context.newPage();
  console.log('✅ 第2次打开页面');
  await page.goto(SIGN_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  console.log('🔄 第2次刷新');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.close();

  // 第3轮
  page = await context.newPage();
  console.log('✅ 第3次打开页面');
  await page.goto(SIGN_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  console.log('🔄 第3次刷新');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.close();

  // 最终签到页面
  page = await context.newPage();
  console.log('✅ 最终次打开页面，准备签到');
  await page.goto(SIGN_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);

  console.log('🔥 查找并点击签到按钮');
  const btn = page.locator('div.sign-opera-btn:has-text("点击签到")');
  if (await btn.isVisible()) {
    await btn.click({ delay: 200, force: true });
    console.log('✅ 签到按钮点击成功');
  } else {
    console.log('✅ 今日已签到（签到按钮不可见）');
  }

  await page.waitForTimeout(2000);
  console.log('🔄 签到后刷新页面');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.close();
  await browser.close();
  console.log('🎉 全部流程执行完毕');
})();
