/**
 * Swap — native screens around the swap webview (the success / PendingOperation
 * screen). The in-webview form lives in {@link SwapLiveAppPage}; this page
 * covers the native chrome. (The High Fee modal the DEX path can hit is part of
 * the native SendFunds flow → {@link SendPage}, since it's shared with Send.)
 */
import { byId } from "../helpers/elements";
import { TIMEOUTS } from "../helpers/timeouts";
import { CommonPage } from "./common.page";

export class SwapPage extends CommonPage {
  private readonly successTitle = byId("swap-success-title");
  // Generic device-action error screen (same testID e2e/mobile races against).
  private readonly deviceActionError = byId("error-description-deviceAction");

  /**
   * Wait for the swap to complete (the PendingOperation success screen), racing
   * it against the device-action error screen so a failure fails fast. Budget is
   * {@link TIMEOUTS.L}: sign → broadcast → settle → render is a real long async op
   * and Detox sync is disabled here, so an explicit wait is required. The race is
   * the generic {@link NativeHandle.waitVisibleOrError} — other flows reuse it
   * with their own success/error locators.
   */
  async expectSuccess(timeout = TIMEOUTS.L): Promise<void> {
    await this.successTitle.waitVisibleOrError(this.deviceActionError, {
      timeout,
      errorLabel: "Swap",
    });
  }
}
