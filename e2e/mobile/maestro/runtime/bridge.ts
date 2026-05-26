import { Subject } from "rxjs";
import { setEnv } from "@ledgerhq/live-env";
import {
  addKnownSpeculos,
  close as closeBridge,
  getEnvs,
  init as initBridge,
  loadConfig,
  removeKnownSpeculos,
  setFeatureFlags,
} from "../../bridge/server";
import { ServerData } from "../../../../apps/ledger-live-mobile/e2e/bridge/types";
import { NANO_APP_CATALOG_PATH } from "../../utils/constants";

declare global {
  // eslint-disable-next-line no-var
  var pendingCallbacks: Map<string, { callback: (data: string) => void }>;
}

export function initBridgeGlobals() {
  global.webSocket = {
    wss: undefined,
    ws: undefined,
    messages: {},
    e2eBridgeServer: new Subject<ServerData>(),
  };
  global.pendingCallbacks = new Map();
}

export function setupE2EEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
  setEnv("MOCK", "0");
  setEnv("DETOX", "1"); // Needed to connect to the bridge - maestro uses the same bridge as detox - rename in E2E_BRIDGE ?
  setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  process.env.MOCK = "0";
  process.env.DISABLE_TRANSACTION_BROADCAST = "1";
}

export type BridgeSetupOptions = {
  userdata: string;
  knownSpeculosAddress?: string;
};

export class E2EBridge {
  start({ userdata, knownSpeculosAddress }: BridgeSetupOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      initBridge(8099, () => {
        void (async () => {
          try {
            await loadConfig(userdata, true);
            await setFeatureFlags({
              llmModularDrawer: {
                enabled: true,
                params: {
                  add_account: true,
                  live_app: true,
                  live_apps_allowlist: [],
                  live_apps_blocklist: ["revoke-cash"],
                  receive_flow: true,
                  send_flow: false,
                  enableModularization: true,
                  searchDebounceTime: 300,
                  backendEnvironment: "PROD",
                },
              },
            });
            if (knownSpeculosAddress) {
              await addKnownSpeculos(knownSpeculosAddress);
            }
            await this.assertBroadcastDisabled();
            resolve();
          } catch (error) {
            reject(error);
          }
        })();
      });
    });
  }

  async assertBroadcastDisabled() {
    const envsRaw = await getEnvs();
    const envs: Record<string, unknown> = JSON.parse(envsRaw || "{}");
    if (envs.DISABLE_TRANSACTION_BROADCAST !== true) {
      throw new Error(
        `DISABLE_TRANSACTION_BROADCAST must be true, got ${String(envs.DISABLE_TRANSACTION_BROADCAST)}`,
      );
    }
  }

  async removeKnownSpeculos(address: string) {
    await removeKnownSpeculos(address);
  }

  close() {
    closeBridge();
  }
}
