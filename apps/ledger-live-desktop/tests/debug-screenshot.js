const { _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const os = require("os");

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lld-debug-"));
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

  // Deep DOM inspection
  const info = await window.evaluate(() => {
    const reactRoot = document.querySelector("#react-root");
    const body = document.body;
    const html = document.documentElement;

    function getBg(el) {
      if (!el) return "null";
      return getComputedStyle(el).backgroundColor;
    }

    function getRect(el) {
      if (!el) return "null";
      const r = el.getBoundingClientRect();
      return `${r.width}x${r.height} at (${r.left},${r.top})`;
    }

    const firstChild = reactRoot ? reactRoot.firstElementChild : null;
    const firstChildFirstChild = firstChild ? firstChild.firstElementChild : null;
    const firstChildFirstChildFirstChild = firstChildFirstChild ? firstChildFirstChild.firstElementChild : null;

    // Walk up to 8 levels deep, collecting all elements
    function walkDom(el, depth) {
      if (!el || depth > 8) return [];
      const result = [{
        tag: el.tagName,
        id: el.id || "",
        className: (el.className || "").toString().substring(0, 60),
        bg: getBg(el),
        rect: getRect(el),
        childCount: el.children.length,
      }];
      if (el.firstElementChild) {
        result.push(...walkDom(el.firstElementChild, depth + 1));
      }
      return result;
    }

    // Also get all elements with non-transparent background
    const allElements = document.querySelectorAll("*");
    const opaqueElements = [];
    for (const el of allElements) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) {
          opaqueElements.push({
            tag: el.tagName,
            id: el.id || "",
            className: (el.className || "").toString().substring(0, 60),
            bg,
            rect: `${rect.width}x${rect.height} at (${rect.left},${rect.top})`,
          });
        }
      }
    }

    return {
      html: getBg(html),
      body: getBg(body),
      reactRoot: getBg(reactRoot),
      reactRootRect: getRect(reactRoot),
      firstChild: firstChild ? { tag: firstChild.tagName, id: firstChild.id, className: (firstChild.className || "").toString().substring(0, 80), bg: getBg(firstChild), rect: getRect(firstChild) } : null,
      firstChildFirstChild: firstChildFirstChild ? { tag: firstChildFirstChild.tagName, id: firstChildFirstChild.id, className: (firstChildFirstChild.className || "").toString().substring(0, 80), bg: getBg(firstChildFirstChild), rect: getRect(firstChildFirstChild) } : null,
      firstChildFirstChildFirstChild: firstChildFirstChildFirstChild ? { tag: firstChildFirstChildFirstChild.tagName, id: firstChildFirstChildFirstChild.id, className: (firstChildFirstChildFirstChild.className || "").toString().substring(0, 80), bg: getBg(firstChildFirstChildFirstChild), rect: getRect(firstChildFirstChildFirstChild) } : null,
      reactRootHTML: reactRoot ? reactRoot.outerHTML.substring(0, 800) : "null",
      bodyHTML: body.outerHTML.substring(0, 400),
      opaqueElements: opaqueElements.slice(0, 20),
      domWalk: walkDom(reactRoot, 0),
    };
  });

  console.log("=== DOM INSPECTION ===");
  console.log("html bg:", info.html);
  console.log("body bg:", info.body);
  console.log("reactRoot bg:", info.reactRoot);
  console.log("reactRoot rect:", info.reactRootRect);
  console.log("firstChild:", JSON.stringify(info.firstChild, null, 2));
  console.log("firstChild.firstChild:", JSON.stringify(info.firstChildFirstChild, null, 2));
  console.log("firstChild.firstChild.firstChild:", JSON.stringify(info.firstChildFirstChildFirstChild, null, 2));
  console.log("\n=== reactRoot outerHTML (first 800 chars) ===");
  console.log(info.reactRootHTML);
  console.log("\n=== body outerHTML (first 400 chars) ===");
  console.log(info.bodyHTML);
  console.log("\n=== DOM walk from #react-root ===");
  console.log(JSON.stringify(info.domWalk, null, 2));
  console.log("\n=== Opaque large elements ===");
  console.log(JSON.stringify(info.opaqueElements, null, 2));

  await window.screenshot({ path: "/tmp/lld-debug.png" });
  console.log("\nDebug screenshot saved to /tmp/lld-debug.png");

  await electronApp.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
