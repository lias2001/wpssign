const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const SIGN_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';
// 截图统一存放screen文件夹，会被actions提交上传github
const SCREEN_DIR = path.join(__dirname, 'screen');
if (!fs.existsSync(SCREEN_DIR)) fs.mkdirSync(SCREEN_DIR, { recursive: true });

// 导出截图路径给actions脚本使用
let finalImgPath = '';

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

  // 第一轮：打开→2s→刷新→关闭
  let page = await context.newPage();
  console.log('✅ 第1次打开页面');
  await page.goto(SIGN_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  console.log('🔄 第1次刷新');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.close();

  // 第二轮
  page = await context.newPage();
  console.log('✅ 第2次打开页面');
  await page.goto(SIGN_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  console.log('🔄 第2次刷新');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.close();

  // 第三轮
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

  console.log('🔥 定位签到按钮，鼠标移入+红点标记');
  const btn = page.locator('div.sign-opera-btn:has-text("点击签到")');
  const isShow = await btn.isVisible();

  finalImgPath = path.join(SCREEN_DIR, `sign_${Date.now()}.png`);
  if (isShow) {
    // 鼠标移动到按钮
    await btn.hover({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // 绘制红色跟随圆点
    await page.evaluate(() => {
      const dot = document.createElement('div');
      dot.style.position = 'fixed';
      dot.style.width = '16px';
      dot.style.height = '16px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = 'red';
      dot.style.zIndex = '9999999';
      dot.style.pointerEvents = 'none';
      document.addEventListener('mousemove', e => {
        dot.style.left = e.clientX - 8 + 'px';
        dot.style.top = e.clientY - 8 + 'px';
      });
      document.body.appendChild(dot);
    });
    await page.waitForTimeout(500);

    // 截图保存
    await page.screenshot({ path: finalImgPath, fullPage: false });
    console.log(`📷 截图已保存:${finalImgPath}`);

    // 点击签到
    await btn.click({ delay: 200, force: true });
    console.log('✅ 签到按钮点击成功');
  } else {
    console.log('✅ 今日已签到（签到按钮不可见）');
    await page.screenshot({ path: finalImgPath });
  }

  await page.waitForTimeout(2000);
  console.log('🔄 签到后刷新页面');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.close();
  await browser.close();
  console.log('🎉 全部流程执行完毕');
})();
