import { step } from "../misc/reporters/step";
import { AppPage } from "./abstractClasses";
import { isAggregatedAssetsEnabled } from "tests/utils/featureFlagUtils";

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
    if (await isAggregatedAssetsEnabled(this.page)) {
      await this.embeddedSwapContainer.waitFor();
      return;
    }
    await this.legacySwapButton.waitFor();
    await this.legacySwapButton.click();
  }
}
