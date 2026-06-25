/**
 * Wallet 4.0 home (portfolio root + quick actions).
 */
import { byId, byText } from "../helpers/elements";
import { CommonPage } from "./common.page";

export class WalletPage extends CommonPage {
  private readonly quickActionsCtas = byId("quick-actions-ctas");
  private readonly transferButton = byId("quick-action-transfer");
  /** "Discover" bottom-tab label — uniquely visible on the Wallet 4.0 root. */
  private readonly discoverTab = byText("Discover");

  /** Wait until the wallet root has mounted. */
  async expectReady(): Promise<void> {
    await this.discoverTab.waitVisible();
  }

  /** Open the Transfer quick-action menu (gates on the quick-actions bar first). */
  async openTransferMenu(): Promise<void> {
    await this.quickActionsCtas.waitVisible();
    await this.transferButton.tap();
  }
}
