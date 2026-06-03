import {
  addKnownSpeculos,
  close as closeBridge,
  findFreePort,
  getEnvs,
  init as initBridge,
  loadConfig,
  openDeeplink,
  removeKnownSpeculos,
  setFeatureFlags,
  webviewDriver as runWebviewDriver,
  type WebviewDriverOpPayload,
  type WebviewDriverResult,
} from "../../mobile/bridge/server";
import { DEFAULT_FEATURE_FLAGS } from "../config/featureFlags";
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

export class E2EBridge {
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
    await setFeatureFlags(DEFAULT_FEATURE_FLAGS);
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

  async setFeatureFlags(flags: Parameters<typeof setFeatureFlags>[0]): Promise<void> {
    await setFeatureFlags(flags);
  }

  async removeKnownSpeculos(address: string): Promise<void> {
    await removeKnownSpeculos(address);
  }

  /** Sends a deeplink over the bridge; the app navigates internally (no OS URL dispatch). */
  async openDeeplink(url: string): Promise<void> {
    await openDeeplink(url);
  }

  async webviewDriver(driver: string, op: WebviewDriverOpPayload): Promise<WebviewDriverResult> {
    return runWebviewDriver(driver, op);
  }

  close(): void {
    closeBridge();
  }
}
