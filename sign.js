const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
// 换成你真实的活动页 URL
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

// 简单日志工具
const log = (...args) => console.log('[sign.js]', ...args);
const error = (...args) => console.error('[sign.js]', ...args);

(async () => {
  if (!fs.existsSync(STATE_PATH)) {
    error('state.json 不存在，请先执行 make-state.js');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,         // 先可视化跑，看到底点没点
    slowMo: 300,             // 每个操作慢 300ms，看得清楚
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

  // ---------- 网络日志：抓所有请求/响应 ----------
  page.on('request', req => {
    if (req.url().includes('checkin') || req.url().includes('sign') || req.url().includes('daily')) {
      log('➡️ 发起签到相关请求:', req.method(), req.url());
    }
  });
  page.on('response', res => {
    if (res.url().includes('checkin') || res.url().includes('sign') || res.url().includes('daily')) {
      log('⬅️ 签到接口响应:', res.url(), '状态码:', res.status());
      if (res.status() === 200) {
        try {
          const json = await res.json();
          log('响应体:', json);
        } catch (e) { /* 非 JSON 就不打 */ }
      }
    }
  });

  try {
    log('打开签到页面');
    await page.goto(TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });
    await page.waitForTimeout(3000);

    // 按钮定位器（你给的 class + 文字）
    const signBtn = page.locator('div.sign-opera-btn:has-text("点击签到")');

    // 先检查按钮是否存在可见
    if (await signBtn.isVisible()) {
      log('✅ 找到【点击签到】按钮，准备点击');

      // ---------- 方案1：普通点击 ----------
      let clicked = false;
      try {
        await signBtn.click({ delay: 200 });
        clicked = true;
        log('方案1：普通点击完成');
      } catch (e) {
        log('方案1失败，尝试方案2（force）');
      }

      // ---------- 方案2：force 强制点击 ----------
      if (!clicked) {
        try {
          await signBtn.click({ force: true, delay: 200 });
          clicked = true;
          log('方案2：force 点击完成');
        } catch (e) {
          log('方案2失败，尝试方案3（JS 原生点击）');
        }
      }

      // ---------- 方案3：JS 原生点击（终极） ----------
      if (!clicked) {
        try {
          await signBtn.evaluate(el => el.click());
          clicked = true;
          log('方案3：JS 原生点击完成');
        } catch (e) {
          error('所有点击方案均失败', e.message);
          await page.screenshot({ path: 'click_failed.png' });
        }
      }

      if (clicked) {
        // 点击后等待一会儿，让请求发出去
        await page.waitForTimeout(5000);

        // 再检查按钮文案是否变化（已签到/已领取等）
        const btnText = await signBtn.textContent().catch(() => '');
        log('点击后按钮文案：', btnText.trim());

        // 截图留档
        await page.screenshot({ path: 'sign_done.png' });

        if (!btnText.includes('点击签到')) {
          log('🎉 按钮文案变化，大概率签到成功');
        } else {
          log('⚠️ 按钮还是“点击签到”，可能后端没成功/风控');
        }
      }

    } else {
      log('ℹ️ 未找到【点击签到】按钮，可能：今日已签到/未加载完成/被隐藏');
      await page.screenshot({ path: 'no_button.png' });
    }

  } catch (e) {
    error('❌ 脚本异常：', e.message);
    await page.screenshot({ path: 'error.png' });
  } finally {
    log('结束，5秒后关闭浏览器（方便你看最后状态）');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
