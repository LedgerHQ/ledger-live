/**
 * Transfer quick-action drawer (Receive / Send / Swap / Buy entry points).
 */
import { byId } from "../helpers/elements";
import { CommonPage } from "./common.page";

export class TransferMenuDrawer extends CommonPage {
  private readonly receiveAction = byId("transfer-action-receive");

  /** Choose "Receive" from the transfer menu. */
  async tapReceive(): Promise<void> {
    await this.receiveAction.tap();
  }
}
