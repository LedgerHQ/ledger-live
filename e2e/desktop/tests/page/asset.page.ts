import { step } from "tests/misc/reporters/step";
import { AppPage } from "tests/page/abstractClasses";

export class AssetPage extends AppPage {
  private readonly buyButton = this.page.getByTestId("asset-detail-action-buy");

  @step("Start buy flow")
  async startBuyFlow() {
    await this.buyButton.click();
  }
}
