import path from "path";
import { Subject } from "rxjs";
import { setEnv } from "@ledgerhq/live-env";
import {
  addKnownSpeculos,
  close as closeBridge,
  findFreePort,
  getEnvs,
  init as initBridge,
  loadConfig,
  removeKnownSpeculos,
  setAutoPickAccount,
  setFeatureFlags,
} from "../../mobile/bridge/server";
import { ServerData } from "../../../apps/ledger-live-mobile/e2e/bridge/types";
import { NANO_APP_CATALOG_PATH } from "../../mobile/utils/constants";

declare global {
  // eslint-disable-next-line no-var
  var pendingCallbacks: Map<string, { callback: (data: string) => void }>;
}

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const USERDATA_DIR = path.join(PACKAGE_ROOT, "userdata");
const ARTIFACTS_DIR = path.join(PACKAGE_ROOT, "artifacts");

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
  // Legacy alias: shared libs (speculos-transport, hw actions, etc.) still
  // gate behavior on getEnv("DETOX"). Keep setting DETOX until those callers
  // are migrated. E2E_BRIDGE only lives in process.env for now (no live-env
  // schema entry), so shared libs ignore it but the mobile app's
  // Config.E2E_BRIDGE / Config.DETOX shim still picks one of them up.
  setEnv("DETOX", "1");
  setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  process.env.E2E_BRIDGE = "1";
  process.env.DETOX = "1";
  process.env.MOCK = "0";
  process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  if (!process.env.SPECULOS_TRACKING_FILE) {
    process.env.SPECULOS_TRACKING_FILE = path.join(ARTIFACTS_DIR, "speculos-instances.json");
  }
}

export type BridgeSetupOptions = {
  userdata: string;
  knownSpeculosAddress?: string;
  port?: number;
};

export type BridgeStartResult = {
  port: number;
  /**
   * Resolves once the app has connected to the bridge AND the in-app side has
   * imported settings/accounts (`loadConfig`), applied the default feature
   * flags, registered the known Speculos device, and confirmed broadcast is
   * disabled. Callers must launch the app between receiving `port` and
   * awaiting `ready`, otherwise nothing will ever connect to the bridge.
   */
  ready: Promise<void>;
};

export class E2EBridge {
  private resolvedPort?: number;

  async start({
    userdata,
    knownSpeculosAddress,
    port,
  }: BridgeSetupOptions): Promise<BridgeStartResult> {
    const resolvedPort = port ?? (await findFreePort());
    this.resolvedPort = resolvedPort;

    const ready = new Promise<void>((resolve, reject) => {
      initBridge(resolvedPort, () => {
        void (async () => {
          try {
            await loadConfig(userdata, true, { userdataDir: USERDATA_DIR });
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

    return { port: resolvedPort, ready };
  }

  get port(): number | undefined {
    return this.resolvedPort;
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

  async setFeatureFlags(flags: Parameters<typeof setFeatureFlags>[0]) {
    await setFeatureFlags(flags);
  }

  async setAutoPickAccount(enabled: boolean) {
    await setAutoPickAccount(enabled);
  }

  async removeKnownSpeculos(address: string) {
    await removeKnownSpeculos(address);
  }

  close() {
    closeBridge();
  }
}
