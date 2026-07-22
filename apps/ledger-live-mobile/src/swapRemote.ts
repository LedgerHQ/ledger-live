import { Platform } from "react-native";
import { registerRemotes } from "@module-federation/enhanced/runtime";
import { selectFeature } from "@shared/feature-flags";
import { store } from "~/state-manager/configureStore";

const DEV_BASE_URL = "http://localhost:9000";
// How long to wait for a manifest to answer before treating that host as unavailable.
const PROBE_TIMEOUT_MS = 1500;

let resolving: Promise<boolean> | undefined;
let registeredEntry: string | undefined;

const manifestUrl = (baseUrl: string): string => `${baseUrl}/${Platform.OS}/mf-manifest.json`;

const prodManifestUrl = (): string => {
  const feature = selectFeature(store.getState(), "ptxSwapMfe");
  return manifestUrl(feature?.params?.baseUrl ?? "");
};

/** Whether a manifest URL is actually being served (server up + manifest built). */
async function isReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    return res.ok;
  } catch {
    // Connection refused (server not started), unreachable host, or timeout.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveEntry(): Promise<string | undefined> {
  const candidates = __DEV__ ? [manifestUrl(DEV_BASE_URL), prodManifestUrl()] : [prodManifestUrl()];
  for (const url of candidates) {
    if (await isReachable(url)) return url;
  }
  return undefined;
}

export function ensureSwapRemote(): Promise<boolean> {
  if (registeredEntry) return Promise.resolve(true);
  if (!resolving) {
    resolving = (async () => {
      const entry = await resolveEntry();
      if (!entry) return false; // neither dev nor prod reachable → do not load the remote
      registerRemotes([{ name: "swap", entry }], { force: true });
      registeredEntry = entry;
      return true;
    })();
  }
  return resolving;
}
