import { readFile } from "node:fs/promises";
import path from "node:path";
import { startBridge } from "./bridge.mjs";
import { log, sleep } from "./exec.mjs";

/** @import { Platform, Userdata } from "./types.mjs" */

/**
 * Merges the userdata files of a scenario: settings and post-onboarding come from the first.
 * @param {string} dir
 * @param {string} names comma-separated file names, without .json
 * @returns {Promise<Userdata>}
 */
export async function loadUserdata(dir, names) {
  const files = names
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  let settings = {};
  let postOnboarding;
  const accounts = [];
  const seen = new Set();
  for (const [index, name] of files.entries()) {
    const { data } = JSON.parse(await readFile(path.join(dir, `${name}.json`), "utf8"));
    if (index === 0) {
      settings = data.settings ?? {};
      postOnboarding = data.postOnboarding;
    }
    for (const account of data.accounts ?? []) {
      const id = account?.data?.id;
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      accounts.push(account);
    }
  }
  // Defaults of loadConfig in e2e/mobile/bridge/server.ts; no feature flags: production Firebase's.
  return {
    names: files,
    settings: { shareAnalytics: false, hasSeenAnalyticsOptInPrompt: true, ...settings },
    accounts,
    postOnboarding,
  };
}

/**
 * Imports a scenario's userdata into a fresh install through the E2E bridge.
 * @param {{ platform: Platform, devices: string[], port: number }} options
 */
export function createInjector({ platform: P, devices, port }) {
  /**
   * @param {string} device
   * @param {Userdata} userdata
   * @param {"A" | "B"} side
   */
  return async function inject(device, userdata, side) {
    const bridge = startBridge(port, m => log(`  [bridge] ${m}`));
    await bridge.listening;
    const sent = [];
    const send = (type, payload) => sent.push({ type, id: bridge.send(type, payload) });
    const acknowledged = async () => {
      for (const { type, id } of sent.splice(0)) {
        await bridge.waitFor(id, "ACK", 60_000).catch(() => {
          throw new Error(`injection on ${device}: the app did not acknowledge ${type}`);
        });
      }
    };
    try {
      // Both devices reach the bridge on the same host port.
      for (const d of devices) await P.stop(d);
      await P.clearDialogs(device);
      await P.launch(device, { wsPort: port, wsToken: "startup-perf" });
      await bridge.waitForClient(180_000);
      await sleep(2000);
      send("acceptTerms");
      send("importSettings", userdata.settings);
      send("navigate", "Base");
      if (userdata.accounts.length) send("importAccounts", userdata.accounts);
      if (userdata.postOnboarding) send("importPostOnboarding", userdata.postOnboarding);
      await acknowledged();
      // Settings are saved only once the store's save effect is mounted: send them again.
      await sleep(10_000);
      send("acceptTerms");
      send("importSettings", { ...userdata.settings });
      await acknowledged();
      await checkTestModes(bridge, device, side);
      await sleep(10_000);
      await P.stop(device);
    } finally {
      await bridge.close();
    }
  };
}

/**
 * Fails when the app reports MOCK or DETOX on.
 * @param {ReturnType<typeof startBridge>} bridge
 * @param {string} device
 * @param {"A" | "B"} side
 */
async function checkTestModes(bridge, device, side) {
  let envs = null;
  try {
    // Builds before mid-September 2026 reply without the message id.
    const from = bridge.received.length;
    const id = bridge.send("getEnvs");
    await bridge.waitFor(id, "ACK", 15_000);
    const reply = bridge.received
      .slice(from)
      .find(m => m.type === "appEnvs" && (m.id === id || m.id === undefined));
    envs = reply ? JSON.parse(reply.payload) : null;
  } catch {}
  if (!envs) throw new Error(`build ${side}: MOCK and DETOX could not be read`);
  const on = name => Boolean(envs[name]) && envs[name] !== "0";
  log(
    `  ${device}: build ${side} runs with MOCK ${on("MOCK") ? "on" : "off"}, DETOX ${on("DETOX") ? "on" : "off"}`,
  );
  if (on("MOCK") || on("DETOX")) throw new Error(`build ${side} runs with MOCK or DETOX on`);
}
