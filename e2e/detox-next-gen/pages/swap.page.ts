/**
 * Swap — native screens around the swap webview (success / pending
 * operation, history, …). The in-webview form lives in
 * {@link SwapLiveAppPage}; this page covers the native chrome.
 */
import { byId } from "../helpers/elements";
import { TIMEOUTS } from "../helpers/timeouts";
import { CommonPage } from "./common.page";

export class SwapPage extends CommonPage {
  private readonly successTitle = byId("swap-success-title");
  private readonly highFeeConfirmButton = byId("enabled-confirmation-modal-confirm-button");

  /** Wait for the swap success (PendingOperation) screen. */
  async expectSuccess(timeout = TIMEOUTS.L): Promise<void> {
    await this.successTitle.waitVisible({ timeout });
  }

  /**
   * Dismiss the High Fee confirmation modal if it appears (network fees >10%
   * of a small swap amount). Silent no-op when the modal isn't shown.
   */
  async dismissHighFeeModal(timeout = TIMEOUTS.XS): Promise<void> {
    try {
      await this.highFeeConfirmButton.tap({ timeout });
    } catch {
      // No high-fee modal shown — proceed.
    }
  }
}
