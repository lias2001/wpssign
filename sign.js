const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, 'state.json');
const TARGET_URL = 'https://personal-act.wps.cn/rubik2/portal/HD2025031821201822/YM2025031821202008?cs_from=web_vipcenter_banner_inpublic&mk_key=JkVKmMVj6h1ZuPwEIlZmVef5hIIZ0Em91FRo&position=pc_aty_ban3_kaixue_test_b';

const log = (...args) => console.log('[sign.js]', ...args);
const error = (...args) => console.error('[sign.js]', ...args);

(async () => {
  if (!fs.existsSync(STATE_PATH)) {
    error('state.json 不存在，请先执行 make-state.js');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 300,
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

  // 修复：给回调函数加上 async
  page.on('response', async (res) => {
    if (res.url().includes('checkin') || res.url().includes('sign') || res.url().includes('daily')) {
      log('⬅️ 签到接口响应:', res.url(), '状态码:', res.status());
      if (res.status() === 200) {
        try {
          const json = await res.json();
          log('响应体:', json);
        } catch (e) {
          log('响应体非JSON:', await res.text());
        }
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

    const signBtn = page.locator('div.sign-opera-btn:has-text("点击签到")');

    if (await signBtn.isVisible()) {
      log('✅ 找到【点击签到】按钮，准备点击');

      let clicked = false;
      try {
        await signBtn.click({ delay: 200 });
        clicked = true;
        log('方案1：普通点击完成');
      } catch (e) {
        log('方案1失败，尝试方案2（force）');
      }

      if (!clicked) {
        try {
          await signBtn.click({ force: true, delay: 200 });
          clicked = true;
          log('方案2：force 点击完成');
        } catch (e) {
          log('方案2失败，尝试方案3（JS 原生点击）');
        }
      }

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
        await page.waitForTimeout(5000);

        const btnText = await signBtn.textContent().catch(() => '');
        log('点击后按钮文案：', btnText.trim());

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
    log('结束，关闭浏览器');
    await browser.close();
  }
})();
