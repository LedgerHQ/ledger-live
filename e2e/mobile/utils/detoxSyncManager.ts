import { device } from "detox";
import { log } from "detox";

type SyncState = "idle" | "busy" | "streaming";

class DetoxSyncManager {
  private static instance: DetoxSyncManager;
  private currentState: SyncState = "idle";
  private syncDisabled = false;
  private stateChangePromise: Promise<void> | null = null;

  static getInstance(): DetoxSyncManager {
    if (!DetoxSyncManager.instance) {
      DetoxSyncManager.instance = new DetoxSyncManager();
    }
    return DetoxSyncManager.instance;
  }

  async setState(newState: SyncState): Promise<void> {
    if (this.stateChangePromise) {
      await this.stateChangePromise;
    }

    if (this.currentState === newState) {
      return;
    }

    this.stateChangePromise = this.performStateChange(newState);
    await this.stateChangePromise;
    this.stateChangePromise = null;
  }

  private async performStateChange(newState: SyncState): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(global as any).detox) {
      log.info(`DetoxSync: Skipping sync management (not in test environment)`);
      this.currentState = newState;
      return;
    }

    try {
      const previousState = this.currentState;

      if (newState !== "idle" && previousState === "idle" && !this.syncDisabled) {
        await device.disableSynchronization();
        this.syncDisabled = true;
        log.info(`🔄 DetoxSync: Disabled synchronization (${previousState} → ${newState})`);
      }

      if (newState === "idle" && previousState !== "idle" && this.syncDisabled) {
        await device.enableSynchronization();
        this.syncDisabled = false;
        log.info(`✅ DetoxSync: Enabled synchronization (${previousState} → ${newState})`);
      }

      this.currentState = newState;
      log.info(`📊 DetoxSync: State changed to ${newState}`);
    } catch (error) {
      log.warn(`⚠️ DetoxSync: State change failed (${this.currentState} → ${newState}):`, error);
    }
  }

  getState(): SyncState {
    return this.currentState;
  }

  isIdle(): boolean {
    return this.currentState === "idle";
  }

  isBusy(): boolean {
    return this.currentState === "busy";
  }

  isStreaming(): boolean {
    return this.currentState === "streaming";
  }

  async reset(): Promise<void> {
    log.info("🔄 DetoxSync: Resetting to idle state");
    await this.setState("idle");
  }

  async forceEnableSync(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(global as any).detox) return;

    try {
      await device.enableSynchronization();
      this.syncDisabled = false;
      this.currentState = "idle";
      log.info("✅ DetoxSync: Force enabled synchronization");
    } catch (error) {
      log.warn("⚠️ DetoxSync: Force enable failed:", error);
    }
  }
}

export const detoxSync = DetoxSyncManager.getInstance();
export type { SyncState };
