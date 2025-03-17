import { DeviceManagementKit } from "@ledgerhq/device-management-kit";

const REFRESHER_ENABLING_DELAY = 3000;

/**
 * A singleton to manage disabling and re‑enabling the device session refresher.
 *
 * - When an exchange starts, disableIfNeeded() is called:
 *    • If the stored session ID is different from the new one (and the refresher is disabled),
 *      forceEnable() is called first to clear the old state.
 *    • Then it increments a pending counter and disables the refresher (if not already disabled),
 *      storing the blockerId.
 *
 * - When an exchange finishes, maybeEnable() is called to decrement the counter.
 *    • If the counter reaches zero, a timer is set (if not already scheduled) to enable the refresher.
 *
 * - forceEnable() immediately calls the stored enable function (using the stored blockerId)
 *   and resets the manager.
 *
 * - reset() clears any stale state so that a new disable call creates a new blockerId.
 */
export class SessionRefresherManager {
  private static instance: SessionRefresherManager;
  // "enabled" means the refresher is active; "disabled" means a disable call has been made.
  private state: "enabled" | "disabled" = "enabled";
  private currentSessionId: string | null = null;
  private blockerId: string | null = null;
  private pendingCount: number = 0;
  private enableFn: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): SessionRefresherManager {
    if (!SessionRefresherManager.instance) {
      SessionRefresherManager.instance = new SessionRefresherManager();
    }
    return SessionRefresherManager.instance;
  }

  // resets the manager so that a new session starts with no stale state.
  reset(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.state = "enabled";
    this.currentSessionId = null;
    this.blockerId = null;
    this.pendingCount = 0;
    this.enableFn = null;
  }

  // called when an exchange is about to start.
  // if the incoming sessionId differs from the stored one and we are disabled,
  // we force-enable the old refresher first.
  disableIfNeeded(sdk: DeviceManagementKit, sessionId: string): void {
    if (this.state === "disabled" && this.currentSessionId && this.currentSessionId !== sessionId) {
      this.forceEnable();
    }
    this.currentSessionId = sessionId;
    this.pendingCount++;
    // Cancel any scheduled enable timer.
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.state === "enabled") {
      this.blockerId = "someBlockerId" + Math.random().toString(36).substring(2);
      this.enableFn = sdk.disableDeviceSessionRefresher({ sessionId, blockerId: this.blockerId });
      this.state = "disabled";
    }
  }

  // called when an exchange finishes.
  maybeEnable(): void {
    if (this.pendingCount > 0) {
      this.pendingCount--;
    } else {
      this.pendingCount = 0;
    }
    // cancel any existing timer.
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // if no exchanges are pending and we're disabled, schedule an enable after 3000ms.
    if (this.pendingCount === 0 && this.state === "disabled" && this.enableFn) {
      this.timer = setTimeout(() => {
        if (this.pendingCount === 0 && this.state === "disabled" && this.enableFn) {
          this.enableFn();
          this.state = "enabled";
          this.enableFn = null;
          this.blockerId = null;
          this.currentSessionId = null;
          this.pendingCount = 0;
        }
        this.timer = null;
      }, REFRESHER_ENABLING_DELAY);
    }
  }

  // immediately force-enables the refresher (using the stored blockerId) and resets the state.
  forceEnable(): void {
    if (this.state === "disabled" && this.enableFn) {
      this.enableFn();
      this.state = "enabled";
      this.enableFn = null;
      this.blockerId = null;
      this.pendingCount = 0;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.currentSessionId = null;
    }
  }
}
