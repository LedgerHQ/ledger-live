import {
  addKnownSpeculos,
  close as closeBridge,
  findFreePort,
  getEnvs,
  init as initBridge,
  loadConfig,
  openDeeplink,
  removeKnownSpeculos,
  setAutoPickAccount,
  setFeatureFlags,
} from "../../mobile/bridge/server";
import { DEFAULT_MODULAR_DRAWER_FLAGS } from "../config/featureFlags";
import { USERDATA_DIR } from "./paths";

export type BridgeSetupOptions = {
  userdata: string;
  knownSpeculosAddress?: string;
  port?: number;
};

export type BridgeStartResult = {
  port: number;
  ready: Promise<void>;
};

/**
 * Facade over the reused e2e/mobile WebSocket bridge server. It is the single
 * injected seam the session and page objects use to talk to the running app
 * (`ctx.bridge.*`), so Maestro code never imports the bridge server functions
 * directly.
 */
export class E2EBridge {
  /**
   * Opens the bridge on a free port and resolves `ready` once the app has
   * connected and the session-wide setup (config, default flags, known
   * Speculos, broadcast guard) has run.
   */
  async start({
    userdata,
    knownSpeculosAddress,
    port,
  }: BridgeSetupOptions): Promise<BridgeStartResult> {
    const resolvedPort = port ?? (await findFreePort());

    const ready = new Promise<void>((resolve, reject) => {
      initBridge(resolvedPort, () => {
        void this.onAppConnected(userdata, knownSpeculosAddress).then(resolve, reject);
      });
    });

    return { port: resolvedPort, ready };
  }

  private async onAppConnected(userdata: string, knownSpeculosAddress?: string): Promise<void> {
    await loadConfig(userdata, true, { userdataDir: USERDATA_DIR });
    await setFeatureFlags(DEFAULT_MODULAR_DRAWER_FLAGS);
    await this.registerKnownSpeculos(knownSpeculosAddress);
    await this.assertBroadcastDisabled();
  }

  private async registerKnownSpeculos(address?: string): Promise<void> {
    if (address) {
      await addKnownSpeculos(address);
    }
  }

  private async assertBroadcastDisabled(): Promise<void> {
    const envsRaw = await getEnvs();
    const envs: Record<string, unknown> = JSON.parse(envsRaw || "{}");
    if (envs.DISABLE_TRANSACTION_BROADCAST !== true) {
      throw new Error(
        `DISABLE_TRANSACTION_BROADCAST must be true, got ${String(envs.DISABLE_TRANSACTION_BROADCAST)}`,
      );
    }
  }

  // --- Pass-throughs to the bridge server (the injected app-control surface) ---

  async setFeatureFlags(flags: Parameters<typeof setFeatureFlags>[0]): Promise<void> {
    await setFeatureFlags(flags);
  }

  async setAutoPickAccount(enabled: boolean, currencyId?: string): Promise<void> {
    await setAutoPickAccount(enabled, currencyId);
  }

  async openDeeplink(url: string): Promise<void> {
    await openDeeplink(url);
  }

  async removeKnownSpeculos(address: string): Promise<void> {
    await removeKnownSpeculos(address);
  }

  close(): void {
    closeBridge();
  }
}
