import { ElectronApplication, Page, TestInfo } from "@playwright/test";
import { promisify } from "util";
import { readFile } from "fs";
import { takeScreenshot, drainSpeculosScreenshots } from "@ledgerhq/live-common/e2e/speculos";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { listen } from "@ledgerhq/logs";
import * as allure from "allure-js-commons";
import { isLastRetry } from "tests/utils/testInfoUtils";
import { WebviewLogCollector } from "tests/utils/webviewLogCollector";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";

const readFileAsync = promisify(readFile);

async function attachIfExists(
  testInfo: TestInfo,
  name: string,
  filePath: string,
  contentType: string,
) {
  try {
    const data = await readFileAsync(filePath);
    await testInfo.attach(name, { body: data, contentType });
  } catch {
    // File does not exist → silently ignore
  }
}

export async function runCliStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return allure.step(`CLI: ${label}`, async () => {
    const start = Date.now();
    const httpTrace: string[] = [];
    const prevNetworkLogs = getEnv("ENABLE_NETWORK_LOGS");
    setEnv("ENABLE_NETWORK_LOGS", true);
    // log `message` only — `data` may carry JWTs/secrets
    const unsubscribe = listen(({ type, message, date }) => {
      if (type.startsWith("network")) {
        httpTrace.push(`${date.toISOString()} [${type}] ${message ?? ""}`);
      }
    });
    try {
      const result = await fn();
      await reportCliOutcome(label, "result", start, () => redactSecrets(result), httpTrace);
      return result;
    } catch (error) {
      await reportCliOutcome(label, "FAILED", start, () => serializeCliError(error), httpTrace);
      throw error;
    } finally {
      try {
        unsubscribe();
      } catch {
        // ignore
      }
      setEnv("ENABLE_NETWORK_LOGS", prevNetworkLogs);
    }
  });
}

const SECRET_KEYS = new Set(["privatekey", "privateKey", "walletSyncEncryptionKey"]);

function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.stringify(redactSecrets(JSON.parse(value)), null, 2);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, SECRET_KEYS.has(k) ? "[REDACTED]" : redactSecrets(v)]),
    );
  }
  return value;
}

// reporting must never flip the command's pass/fail outcome, so payload building runs here too
async function reportCliOutcome(
  label: string,
  status: string,
  start: number,
  buildPayload: () => unknown,
  httpTrace: string[],
) {
  try {
    const payload = buildPayload();
    console.log(`CLI ${label} — ${status}: `, payload);
    const title = `CLI ${label} — ${status} (${Date.now() - start}ms)`;
    if (typeof payload === "string") {
      await allure.attachment(title, payload, "text/plain");
    } else {
      await allure.attachment(title, JSON.stringify(payload ?? null, null, 2), "application/json");
    }
    if (httpTrace.length) {
      await allure.attachment(`CLI ${label} — HTTP trace`, httpTrace.join("\n"), "text/plain");
    }
  } catch {
    // ignore
  }
}

function serializeCliError(error: unknown) {
  // status/url/method are own-enumerable on LedgerAPI5xx; message is not
  const fields = error && typeof error === "object" ? { ...error } : {};
  return {
    message: error instanceof Error ? error.message : String(error),
    ...fields,
  };
}

export async function addTmsLink(ids: string[]) {
  for (const id of ids) {
    await allure.tms(id);
  }
}

export async function addBugLink(ids: string[]) {
  for (const id of ids) {
    await allure.issue(id);
  }
}

export async function addTeamOwner(team: Team) {
  const teamString = team.toString();
  await allure.owner(teamString);
  await allure.parentSuite(teamString);
  await allure.feature(teamString);
}

export async function attachMergedFeatureFlags(
  testInfo: TestInfo,
  mergedFeatureFlags: unknown,
): Promise<void> {
  await testInfo.attach("Merged Feature Flags", {
    body: Buffer.from(JSON.stringify(mergedFeatureFlags, null, 2)),
    contentType: "application/json",
  });
}

async function attachSpeculosScreenshots(testInfo: TestInfo): Promise<void> {
  const speculosPort = getEnv("SPECULOS_API_PORT");
  const navigatedScreenshots = drainSpeculosScreenshots(speculosPort);

  let screenshots: Buffer[];
  if (navigatedScreenshots.length > 0) {
    screenshots = navigatedScreenshots;
  } else {
    const fallback = await takeScreenshot();
    screenshots = fallback ? [fallback] : [];
  }

  if (screenshots.length === 0) {
    console.warn(
      "[captureArtifacts] No Speculos screenshots available — Speculos may be unreachable",
    );
  } else if (screenshots.length === 1) {
    await testInfo.attach("Speculos Screenshot", {
      body: screenshots[0],
      contentType: "image/png",
    });
  } else {
    const images = screenshots
      .map(
        (s, i) =>
          `<figure>
            <figcaption>Screen ${i + 1} / ${screenshots.length}</figcaption>
            <img src="data:image/png;base64,${s.toString("base64")}" />
          </figure>`,
      )
      .join("\n");
    const html = `<!DOCTYPE html><html><head><style>
      body { background:#1a1a1a; margin:0; padding:12px; display:flex; flex-wrap:wrap; gap:12px; font-family:monospace; }
      figure { margin:0; }
      figcaption { color:#aaa; font-size:11px; text-align:center; padding:4px 0; }
      img { display:block; image-rendering:pixelated; border:1px solid #444; }
    </style></head><body>${images}</body></html>`;
    await testInfo.attach("Speculos Screenshots", {
      body: Buffer.from(html),
      contentType: "text/html",
    });
  }
}

export async function captureArtifacts(
  page: Page,
  testInfo: TestInfo,
  electronApp: ElectronApplication,
  takeSpeculosScreenshot: boolean,
  webviewCollector?: WebviewLogCollector,
) {
  const screenshot = await page.screenshot();
  await testInfo.attach("Screenshot", { body: screenshot, contentType: "image/png" });

  if (takeSpeculosScreenshot) {
    await attachSpeculosScreenshots(testInfo);
  }

  if (isLastRetry(testInfo)) {
    const filePath = `tests/artifacts/${testInfo.title.replace(/[^a-zA-Z0-9]/g, " ")}.json`;

    await page.evaluate(filePath => {
      window.saveLogs(filePath);
    }, filePath);

    await testInfo.attach("Test logs", {
      path: filePath,
      contentType: "application/json",
    });

    await attachIfExists(
      testInfo,
      "Network failures",
      testInfo.outputPath("network.log"),
      "text/plain",
    );
  }

  if (webviewCollector) {
    await testInfo.attach("Webview Console Logs", {
      body: Buffer.from(webviewCollector.getFormattedConsoleLogs()),
      contentType: "text/plain",
    });

    await testInfo.attach("Webview Network Logs", {
      body: Buffer.from(webviewCollector.getFormattedNetworkLogs()),
      contentType: "application/json",
    });
  }

  const video = page.video();
  const videoPath = video ? await video.path() : null;
  if (videoPath) {
    await electronApp.close();
    console.log(`Video for test recorded at: ${videoPath}\n`);
    const videoData = await readFileAsync(videoPath);
    await testInfo.attach("Test Video", { body: videoData, contentType: "video/webm" });
  }
}
