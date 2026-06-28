/**
 * Native SendFunds flow — the summary / fee screens the swap DEX path hands off
 * to (and the future home for Send specs). The High Fee modal is a generic
 * `ConfirmationModal` shown when network fees exceed a threshold; it appears in
 * both Send and the DEX swap, so it lives here rather than on the swap page.
 */
import { byId } from "../helpers/elements";
import { TIMEOUTS } from "../helpers/timeouts";
import { CommonPage } from "./common.page";

export class SendPage extends CommonPage {
  private readonly highFeeConfirmButton = byId("enabled-confirmation-modal-confirm-button");

  /**
   * Dismiss the High Fee confirmation modal if it appears (network fees >10%
   * of the amount). Silent no-op when the modal isn't shown.
   */
  async dismissHighFeeModal(timeout = TIMEOUTS.XS): Promise<void> {
    try {
      await this.highFeeConfirmButton.tap({ timeout });
    } catch {
      // No high-fee modal shown — proceed.
    }
  }
}
