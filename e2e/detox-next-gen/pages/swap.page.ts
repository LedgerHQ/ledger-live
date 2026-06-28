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

  /** Wait for the swap success (PendingOperation) screen. */
  async expectSuccess(timeout = TIMEOUTS.XS): Promise<void> {
    await this.successTitle.waitVisible({ timeout });
  }
}
