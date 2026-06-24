const { _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs");
const os = require("os");
const zlib = require("zlib");
// (fs and zlib already required above — no duplicate needed below)

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lld-green-"));
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
      "--disable-gpu",
      "--disable-gpu-compositing",
      "--enable-software-rasterizer",
      "--disable-software-rasterizer=false",
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

  const bg = await window.evaluate(() =>
    getComputedStyle(document.querySelector("#react-root")).backgroundColor
  );
  console.log("Background color:", bg);
  if (!bg.includes("0, 255, 0") && !bg.includes("#00ff00") && !bg.toLowerCase().includes("green")) {
    throw new Error(`Background color assertion FAILED: got ${bg}`);
  }

  await window.screenshot({ path: "/tmp/lld-green-screenshot.png" });
  console.log("Screenshot saved to /tmp/lld-green-screenshot.png");
  await electronApp.close();
}

function checkPixels() {
  const buf = fs.readFileSync("/tmp/lld-green-screenshot.png");
  const width = buf.readUInt32BE(16), height = buf.readUInt32BE(20), colorType = buf[25];
  console.log(`Image: ${width}x${height} colorType=${colorType}`);
  let pos = 8, idatData = Buffer.alloc(0);
  while (pos < buf.length - 4) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos+4, pos+8).toString("ascii");
    if (type === "IDAT") idatData = Buffer.concat([idatData, buf.slice(pos+8, pos+8+len)]);
    if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(idatData);
  const channels = (colorType === 2) ? 3 : 4;
  const rowSize = 1 + width * channels;

  // Apply PNG filter reconstruction
  function recon(filter, x, a, b, c) {
    if (filter === 0) return x;
    if (filter === 1) return (x + a) & 0xFF;
    if (filter === 2) return (x + b) & 0xFF;
    if (filter === 3) return (x + ((a + b) >> 1)) & 0xFF;
    if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      return (x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xFF;
    }
    return x;
  }

  // Decode all rows
  const rows = [];
  for (let y = 0; y < height; y++) {
    const base = y * rowSize;
    const filter = raw[base];
    const prev = rows[y - 1] || new Uint8Array(width * channels);
    const row = new Uint8Array(width * channels);
    for (let i = 0; i < width * channels; i++) {
      const x = raw[base + 1 + i];
      const a = i >= channels ? row[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      row[i] = recon(filter, x, a, b, c);
    }
    rows.push(row);
  }

  let greenCount = 0, blackCount = 0, total = 0;
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const idx = x * channels;
      const r = rows[y][idx], g = rows[y][idx+1], b = rows[y][idx+2];
      if (g > 200 && r < 100 && b < 100) greenCount++;
      if (r < 20 && g < 20 && b < 20) blackCount++;
      total++;
    }
  }

  console.log("Green pixel ratio:", (greenCount/total*100).toFixed(1) + "%");
  console.log("Black pixel ratio:", (blackCount/total*100).toFixed(1) + "%");

  // Sample specific pixels
  for (const [px, py] of [[100,100],[300,50],[500,300],[600,400]]) {
    const idx = px * channels;
    console.log(`  Pixel (${px},${py}): R=${rows[py][idx]} G=${rows[py][idx+1]} B=${rows[py][idx+2]}`);
  }

  if (greenCount/total < 0.30) {
    throw new Error(`FAIL: pixels are not green! ratio=${(greenCount/total*100).toFixed(1)}%`);
  }
  console.log("PASS: screenshot is visually green");
}

main()
  .then(() => checkPixels())
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });
