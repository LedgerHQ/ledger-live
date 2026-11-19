import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";
import { Dialog } from "tests/component/dialog.component";

export class PredictionsDialog extends Dialog {
  private readonly termsDialog = this.page.getByRole("dialog", { name: "Terms & Conditions" });
  private readonly consentDialog = this.page.getByRole("dialog", {
    name: "Clear signed trade on Polymarket via MoonPay",
  });

  private readonly termsClose = this.termsDialog.getByRole("button", { name: "Close" });
  private readonly consentClose = this.consentDialog.getByRole("button", { name: "Close" });
  private readonly termsCheckbox = this.termsDialog.getByRole("checkbox");
  private readonly termsCta = this.termsDialog.getByRole("button", { name: "Agree and Continue" });
  private readonly consentCheckbox = this.consentDialog.getByRole("checkbox");
  private readonly consentCta = this.consentDialog.getByRole("button", {
    name: "Continue",
    exact: true,
  });

  private readonly assetSelection = this.page.getByTestId("modular-dialog-screen-ASSET_SELECTION");

  @step("Verify the terms dialog is shown and not accepted")
  async expectTermsNotAccepted() {
    await expect(this.termsDialog).toBeVisible();
    await expect(this.termsCheckbox).not.toBeChecked();
    await expect(this.termsCta).toBeDisabled();
  }

  @step("Verify the terms dialog shows the risk disclaimer")
  async expectRiskDisclaimer() {
    await this.softExpect(async soft => {
      await soft(this.termsDialog).toContainText("total loss of funds");
      await soft(this.termsDialog).toContainText("market and resolution risk");
      await soft(this.termsDialog).toContainText("liquidity risk");
      await soft(this.termsDialog).toContainText("smart contract risk");
    });
  }

  @step("Close the terms dialog")
  async closeTerms() {
    await this.termsClose.click();
    await expect(this.termsDialog).toBeHidden();
  }

  @step("Acknowledge the terms")
  async acknowledgeTerms() {
    await this.termsCheckbox.check();
    await expect(this.termsCta).toBeEnabled();
  }

  @step("Click Agree and Continue")
  async agreeAndContinue() {
    await this.termsCta.click();
  }

  @step("Verify the terms dialog is not shown")
  async expectTermsHidden() {
    await expect(this.termsDialog).toBeHidden();
  }

  @step("Verify the consent dialog is shown and not accepted")
  async expectConsentNotAccepted() {
    await expect(this.consentDialog).toBeVisible();
    await expect(this.consentCheckbox).not.toBeChecked();
    await expect(this.consentCta).toBeDisabled();
  }

  @step("Close the consent dialog")
  async closeConsent() {
    await this.consentClose.click();
    await expect(this.consentDialog).toBeHidden();
  }

  @step("Accept the consent")
  async acceptConsent() {
    await this.consentCheckbox.check();
    await expect(this.consentCta).toBeEnabled();
  }

  @step("Click Continue")
  async continueFromConsent() {
    await this.consentCta.click();
  }

  @step("Verify the Select asset drawer is shown")
  async expectAssetSelection() {
    await expect(this.assetSelection).toBeVisible();
  }
}
