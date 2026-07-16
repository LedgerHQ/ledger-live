import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";

export class AssetPage extends AppPage {
  // Buy CTA differs between the legacy Asset page (`asset-page-buy-button`) and the Wallet 4.0
  // AssetDetail page (`asset-detail-action-buy`). Only one variant is mounted at a time.
  private readonly buyButton = this.page
    .getByTestId("asset-page-buy-button")
    .or(this.page.getByTestId("asset-detail-action-buy"));
  // Legacy Asset page exposes a dedicated swap CTA. The AssetDetail page (aggregatedAssets ON) has
  // no swap CTA; swap is the always-mounted embedded rail instead.
  private readonly legacySwapButton = this.page.getByTestId("asset-page-swap-button");
  private readonly embeddedSwapContainer = this.page.getByTestId("embedded-swap-container");

  @step("Start buy flow")
  async startBuyFlow() {
    await this.buyButton.click();
  }

  @step("Start swap flow")
  async startSwapFlow() {
    // Wait for whichever swap entry the rendered page exposes, then click only the legacy CTA.
    // On AssetDetail the embedded rail is already mounted, so there is nothing to click and the
    // caller's swap-readiness wait takes over from here.
    await this.legacySwapButton
      .or(this.embeddedSwapContainer)
      .first()
      .waitFor({ state: "visible" });
    if (await this.legacySwapButton.isVisible()) {
      await this.legacySwapButton.click();
    }
  }
}
