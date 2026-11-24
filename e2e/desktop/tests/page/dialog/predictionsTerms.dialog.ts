import type { Page } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { PredictionsDialog } from "tests/page/dialog/predictions.dialog";

export class PredictionsTermsDialog extends PredictionsDialog {
  constructor(page: Page) {
    super(page, "terms");
  }

  @step("Verify the Predictions terms dialog shows the risk disclaimer")
  async expectRiskDisclaimer() {
    await this.softExpect(async soft => {
      await soft(this.dialog).toContainText("total loss of funds");
      await soft(this.dialog).toContainText("market and resolution risk");
      await soft(this.dialog).toContainText("liquidity risk");
      await soft(this.dialog).toContainText("smart contract risk");
    });
  }
}
