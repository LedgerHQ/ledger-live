const { _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const os = require("os");

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lld-debug3-"));
  const userdataSrc = path.join(__dirname, "userdata", "1AccountBTC1AccountETH.json");
  const userdataDst = path.join(tmpDir, "app.json");

  const rawData = JSON.parse(fs.readFileSync(userdataSrc, "utf-8"));
  const userData = Object.assign({}, rawData, {
    data: Object.assign({}, rawData.data, {
      settings: Object.assign({}, rawData.data && rawData.data.settings, {
        shareAnalytics: true,
        hasSeenAnalyticsOptInPrompt: true,
        lastAnalyticsConsentDate: new Date().toISOString(),
        privacyPolicyVersion: 99999999,
      }),
    }),
  });
  fs.writeFileSync(userdataDst, JSON.stringify(userData));

  const mainBundle = path.join(__dirname, "../.webpack/main.bundle.js");

  const electronApp = await electron.launch({
    args: [
      mainBundle,
      `--user-data-dir=${tmpDir}`,
      "--force-device-scale-factor=1",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--enable-logging",
    ],
    env: Object.assign({}, process.env, {
      VERBOSE: "true",
      MOCK: "true",
      MOCK_COUNTERVALUES: "true",
      HIDE_DEBUG_MOCK: "true",
      PLAYWRIGHT_RUN: "true",
      CRASH_ON_INTERNAL_CRASH: "true",
      LEDGER_MIN_HEIGHT: "768",
      FEATURE_FLAGS: JSON.stringify({ lwdWallet40: { enabled: false } }),
    }),
    colorScheme: "dark",
    locale: "en-US",
    executablePath: require("electron/index.js"),
    timeout: 120000,
  });

  const window = await electronApp.firstWindow();
  window.setDefaultTimeout(120000);
  await window.waitForLoadState("domcontentloaded");
  await window.waitForSelector("#loader-container", { state: "hidden", timeout: 60000 });
  await window.waitForSelector("#react-root", { state: "visible", timeout: 60000 });
  await window.waitForTimeout(3000);

  const info = await window.evaluate(() => {
    function getBg(el) {
      if (!el) return null;
      const bg = getComputedStyle(el).backgroundColor;
      const rect = el.getBoundingClientRect();
      return { tag: el.tagName, id: el.id, className: (el.className || "").toString().substring(0, 80), bg, rect: `${rect.width}x${rect.height} at (${rect.left},${rect.top})` };
    }

    // Walk from various pixels upward
    function walkFrom(x, y) {
      const chain = [];
      let el = document.elementFromPoint(x, y);
      while (el && el !== document.documentElement) {
        chain.push(getBg(el));
        el = el.parentElement;
      }
      return chain;
    }

    // Get computed CSS variables on :root / body / html
    const root = document.documentElement;
    const rootStyles = getComputedStyle(root);
    const cssVars = [
      '--color-dark-grey-050',
      '--color-light-grey-050',
      '--color-background-canvas',
      '--background-canvas',
      '--background-base',
    ].map(v => ({ var: v, val: rootStyles.getPropertyValue(v) }));

    // Also get all elements that use bg-canvas or bg-base class
    const canvasEls = Array.from(document.querySelectorAll('[class*="bg-canvas"], [class*="bg-base"]'));
    const canvasDetails = canvasEls.slice(0, 10).map(el => {
      const rect = el.getBoundingClientRect();
      return { className: (el.className || "").toString().substring(0, 80), bg: getComputedStyle(el).backgroundColor, rect: `${rect.width}x${rect.height} at (${rect.left},${rect.top})` };
    });

    // Find all elements with large area and dark background
    const allEls = document.querySelectorAll("*");
    const darkEls = [];
    for (const el of allEls) {
      const bg = getComputedStyle(el).backgroundColor;
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 200 && bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && bg !== "rgb(0, 255, 0)") {
        darkEls.push({ tag: el.tagName, id: el.id, className: (el.className || "").toString().substring(0, 80), bg, rect: `${rect.width}x${rect.height} at (${rect.left},${rect.top})` });
      }
    }

    return {
      at_100_100: walkFrom(100, 100).slice(0, 5),
      at_600_200: walkFrom(600, 200).slice(0, 8),
      at_600_400: walkFrom(600, 400).slice(0, 8),
      cssVars,
      canvasDetails,
      darkEls: darkEls.slice(0, 15),
    };
  });

  console.log("=== Pixel (100,100) walk ===");
  console.log(JSON.stringify(info.at_100_100, null, 2));
  console.log("\n=== Pixel (600,200) walk ===");
  console.log(JSON.stringify(info.at_600_200, null, 2));
  console.log("\n=== Pixel (600,400) walk ===");
  console.log(JSON.stringify(info.at_600_400, null, 2));
  console.log("\n=== CSS variables on :root ===");
  console.log(JSON.stringify(info.cssVars, null, 2));
  console.log("\n=== Elements with bg-canvas/bg-base class ===");
  console.log(JSON.stringify(info.canvasDetails, null, 2));
  console.log("\n=== Large dark elements (not green) ===");
  console.log(JSON.stringify(info.darkEls, null, 2));

  await electronApp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
