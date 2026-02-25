import { DevSettings, NativeModules, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import { MMKV } from "react-native-mmkv";

const STORAGE_KEY = "__dev_server_connected";
const MAX_POLL_RETRIES = 30;

/** Only for iOS physical devices on debug builds, to ensure dev-server pairing on first load */
const shouldActivate = __DEV__ && Platform.OS === "ios" && !DeviceInfo.isEmulatorSync();

/** Dedicated storage for debug */
let storage: MMKV | null = null;
if (shouldActivate) {
  storage = new MMKV({ id: "dev-server-reload" });
}

/** Retrieves the IP address of the development server. */
async function getDevServerIP(): Promise<string> {
  try {
    const scriptURL =
      NativeModules.SourceCode?.scriptURL ||
      NativeModules.SourceCode?.getConstants?.()?.scriptURL ||
      "";

    if (scriptURL.startsWith("file:") || scriptURL.startsWith("/")) {
      const dir = scriptURL.replace(/[^/]*$/, "");
      const res = await fetch(dir + "ip.txt");
      return (await res.text()).trim();
    }

    const match = scriptURL.match(/https?:\/\/([^:/]+)/);
    if (match) return match[1];
  } catch (e) {
    console.error("Unable to find dev-server ip", e);
  }
  return "localhost";
}

/**
 * Polls the Repack dev-server and auto-reloads once it becomes reachable
 * (after granting iOS local network permission). Persists a flag so it
 * only triggers once per install. Called once at startup from index.js.
 * No-op on simulator, Android, or in production.
 */
function initDevServerAutoReload(): void {
  if (!shouldActivate) return;
  if (storage?.getBoolean(STORAGE_KEY)) return;

  const scriptURL =
    NativeModules.SourceCode?.scriptURL ||
    NativeModules.SourceCode?.getConstants?.()?.scriptURL ||
    "";

  if (scriptURL.startsWith("http")) {
    storage?.set(STORAGE_KEY, true);
    return;
  }

  const poll = async () => {
    const ip = await getDevServerIP();
    const port = 8081;

    const check = (retryCount: number) => {
      fetch(`http://${ip}:${port}/status`, { method: "HEAD" })
        .then(() => {
          storage?.set(STORAGE_KEY, true);
          DevSettings.reload();
        })
        .catch(() => {
          if (retryCount < MAX_POLL_RETRIES) {
            setTimeout(() => check(retryCount + 1), 2000);
          }
        });
    };

    setTimeout(() => check(0), 3000);
  };

  poll();
}

export { initDevServerAutoReload };
