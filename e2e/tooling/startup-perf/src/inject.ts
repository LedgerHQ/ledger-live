import { readFile } from "node:fs/promises";
import path from "node:path";
import { type Bridge, startBridge } from "./bridge.ts";
import { log, sleep } from "./exec.ts";
import type { Platform, Side, Userdata } from "./types.ts";

const APP_CONNECT_TIMEOUT_MS = 180_000;
// Lets the client finish its handshake before the first message.
const HANDSHAKE_MS = 2000;
const ACK_TIMEOUT_MS = 60_000;
const ENVS_TIMEOUT_MS = 15_000;
// The store saves settings only once its save effect is mounted: they are sent again after this.
const SAVE_EFFECT_MOUNT_MS = 10_000;
// For the settings sent again to be saved before the app stops.
const SETTINGS_SAVE_MS = 10_000;

/**
 * Merges the userdata files of a scenario: settings and post-onboarding come from the first.
 * `names` lists the file names, comma-separated, without .json.
 */
export async function loadUserdata({
  dir,
  names,
}: {
  dir: string;
  names: string;
}): Promise<Userdata> {
  const files = names
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  let settings: Record<string, unknown> = {};
  let postOnboarding: unknown;
  const accounts: Userdata["accounts"] = [];
  const seen = new Set<string>();
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

/** Imports a scenario's userdata into a fresh install through the E2E bridge. */
export function createInjector({
  platform: P,
  devices,
  port,
}: {
  platform: Platform;
  devices: string[];
  port: number;
}) {
  return async function inject({
    device,
    userdata,
    side,
  }: {
    device: string;
    userdata: Userdata;
    side: Side;
  }): Promise<void> {
    const bridge = startBridge(port, m => log(`  [bridge] ${m}`));
    await bridge.listening;
    const sent: Array<{ type: string; id: string }> = [];
    const send = (type: string, payload?: unknown) =>
      sent.push({ type, id: bridge.send(type, payload) });
    const acknowledged = async () => {
      for (const { type, id } of sent.splice(0)) {
        await bridge.waitFor({ id, type: "ACK", timeoutMs: ACK_TIMEOUT_MS }).catch(() => {
          throw new Error(`injection on ${device}: the app did not acknowledge ${type}`);
        });
      }
    };
    try {
      // Both devices reach the bridge on the same host port.
      for (const d of devices) await P.stop(d);
      await P.clearDialogs(device);
      await P.launch(device, { wsPort: port, wsToken: "startup-perf" });
      await bridge.waitForClient(APP_CONNECT_TIMEOUT_MS);
      await sleep(HANDSHAKE_MS);
      send("acceptTerms");
      send("importSettings", userdata.settings);
      send("navigate", "Base");
      if (userdata.accounts.length) send("importAccounts", userdata.accounts);
      if (userdata.postOnboarding) send("importPostOnboarding", userdata.postOnboarding);
      await acknowledged();
      await sleep(SAVE_EFFECT_MOUNT_MS);
      send("acceptTerms");
      send("importSettings", { ...userdata.settings });
      await acknowledged();
      await checkTestModes({ bridge, device, side });
      await sleep(SETTINGS_SAVE_MS);
      await P.stop(device);
    } finally {
      await bridge.close();
    }
  };
}

/** The app's environment variables, or null when it does not answer. */
async function readAppEnvs(bridge: Bridge): Promise<Record<string, unknown> | null> {
  try {
    // Builds before mid-September 2026 reply without the message id.
    const from = bridge.received.length;
    const id = bridge.send("getEnvs");
    await bridge.waitFor({ id, type: "ACK", timeoutMs: ENVS_TIMEOUT_MS });
    const reply = bridge.received
      .slice(from)
      .find(m => m.type === "appEnvs" && (m.id === id || m.id === undefined));
    return reply ? JSON.parse(reply.payload as string) : null;
  } catch {
    return null;
  }
}

/** Fails when the app reports MOCK or DETOX on. */
async function checkTestModes({
  bridge,
  device,
  side,
}: {
  bridge: Bridge;
  device: string;
  side: Side;
}): Promise<void> {
  const envs = await readAppEnvs(bridge);
  if (!envs) throw new Error(`build ${side}: MOCK and DETOX could not be read`);
  const on = (name: string) => Boolean(envs[name]) && envs[name] !== "0";
  log(
    `  ${device}: build ${side} runs with MOCK ${on("MOCK") ? "on" : "off"}, DETOX ${on("DETOX") ? "on" : "off"}`,
  );
  if (on("MOCK") || on("DETOX")) throw new Error(`build ${side} runs with MOCK or DETOX on`);
}
