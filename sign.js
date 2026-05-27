const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 登录状态文件（含Cookies）
const STATE_PATH = path.join(__dirname, 'state.json');
// 浏览器缓存目录
const USER_DATA_DIR = path.join(__dirname, 'pw_cache');
// 你的签到页
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

if (!fs.existsSync(STATE_PATH)) {
  console.error('❌ 缺少 state.json，请先本地运行 login-once.js 生成');
  process.exit(1);
}

(async () => {
  // 随机延迟 0~120 分钟 → 北京时间 6:00~8:00
  const delayMin = Math.floor(Math.random() * 120);
  console.log(`⏱ 随机延迟 ${delayMin} 分钟`);
  await new Promise(r => setTimeout(r, delayMin * 60 * 1000));

  // 加载Cookie状态 + 持久化浏览器缓存
  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: true,
    viewport: { width: 1280, height: 720 },
    locale: 'zh-CN',
    storageState: STATE_PATH, // 关键：注入登录Cookies
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  try {
    console.log('🌍 打开签到页（已带登录Cookie）');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 精准点击：<div data-v-82ca2e75="">点击签到</div>
    const signBtn = page.locator('div[data-v-82ca2e75]:text("点击签到")');
    if (await signBtn.count() > 0) {
      await signBtn.click({ delay: 300 });
      console.log('✅ 签到成功（Cookie自动登录）');
      await page.waitForTimeout(3000);
    } else {
      console.log('ℹ️ 未找到按钮（已签/未登录）');
    }
  } catch (e) {
    console.error('❌ 出错：', e.message);
  } finally {
    await browser.close();
  }
})();