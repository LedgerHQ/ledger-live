const { _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const os = require("os");

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lld-debug2-"));
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
    const reactRoot = document.querySelector("#react-root");
    const children = Array.from(reactRoot.children);

    // Inspect all direct children of react-root
    const childDetails = children.map(el => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: (el.className || "").toString().substring(0, 80),
        bg: cs.backgroundColor,
        rect: `${rect.width}x${rect.height} at (${rect.left},${rect.top})`,
        position: cs.position,
        zIndex: cs.zIndex,
        display: cs.display,
        opacity: cs.opacity,
        innerHTML: el.innerHTML.substring(0, 200),
      };
    });

    // What's at coordinates (100, 100)?
    const elemAtCenter = document.elementFromPoint(100, 100);
    function getBg(el) {
      if (!el) return null;
      const bg = getComputedStyle(el).backgroundColor;
      const rect = el.getBoundingClientRect();
      return { tag: el.tagName, id: el.id, className: (el.className || "").toString().substring(0, 60), bg, rect: `${rect.width}x${rect.height} at (${rect.left},${rect.top})` };
    }

    // Walk UP from pixel (100,100) to find what's painting there
    const elementsAt100 = [];
    let el = elemAtCenter;
    while (el && el !== document.documentElement) {
      elementsAt100.push(getBg(el));
      el = el.parentElement;
    }

    // Check the second child (sc-iQqcaB fMHFOt) specifically
    const secondChild = children[1];
    const secondChildDetails = secondChild ? {
      tag: secondChild.tagName,
      className: (secondChild.className || "").toString(),
      bg: getComputedStyle(secondChild).backgroundColor,
      rect: (() => { const r = secondChild.getBoundingClientRect(); return `${r.width}x${r.height} at (${r.left},${r.top})`; })(),
      position: getComputedStyle(secondChild).position,
      zIndex: getComputedStyle(secondChild).zIndex,
      innerHTML_full: secondChild.innerHTML.substring(0, 500),
      styleAttr: secondChild.getAttribute('style'),
    } : null;

    // Get ALL injected style rules containing background
    const sheets = Array.from(document.styleSheets);
    const bgRules = [];
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.style && rule.style.backgroundColor && rule.selectorText) {
            bgRules.push({ selector: rule.selectorText, bg: rule.style.backgroundColor });
          }
        }
      } catch(e) {}
    }

    return { childDetails, elementsAt100, secondChildDetails, bgRules };
  });

  console.log("=== Direct children of #react-root ===");
  console.log(JSON.stringify(info.childDetails, null, 2));
  console.log("\n=== Element at (100,100) - walk to root ===");
  console.log(JSON.stringify(info.elementsAt100, null, 2));
  console.log("\n=== Second child details ===");
  console.log(JSON.stringify(info.secondChildDetails, null, 2));
  console.log("\n=== CSS rules with background-color ===");
  console.log(JSON.stringify(info.bgRules.slice(0, 30), null, 2));

  await window.screenshot({ path: "/tmp/lld-debug2.png" });
  console.log("\nDebug screenshot saved to /tmp/lld-debug2.png");

  await electronApp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
