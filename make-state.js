const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // 启动浏览器，打开你已经登录的网站
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 打开你的签到页（此时你在浏览器里已经登录）
  await page.goto('https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b');

  console.log('✅ 确认页面是已登录状态后，按回车生成 state.json');
  await new Promise(r => process.stdin.once('data', r));

  // 关键：把当前登录状态（Cookies+localStorage）保存成 state.json
  const state = await context.storageState();
  fs.writeFileSync('state.json', JSON.stringify(state, null, 2));
  console.log('🎉 已生成 state.json（包含登录Cookie）');

  await browser.close();
})();