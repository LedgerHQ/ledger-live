import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class TezosUnstakeModal extends Modal {
  private readonly stakingMenuButton = this.page.locator("#tezos-staking-menu");
  private readonly unstakeMenuItem = this.page.locator("#tezos-staking-menu-unstake");
  private readonly amountField = this.page.getByTestId("modal-amount-field");
  private readonly amountContinueButton = this.page.getByTestId(
    "tezos-unstake-amount-continue-button",
  );
  private readonly successMessageLabel = this.page.getByTestId("success-message-label");

  @step("Open the unstake flow from the staking-section menu")
  async openFromStakingMenu() {
    await this.stakingMenuButton.click();
    await this.unstakeMenuItem.click();
  }

  @step("Fill unstake amount $0")
  async fillAmount(amount: string) {
    if (amount === "send max") {
      await this.toggleMaxAmount();
    } else {
      await this.amountField.fill(amount);
    }
  }

  @step("Continue from the amount step")
  async continueFromAmount() {
    await this.amountContinueButton.click();
  }

  @step("Verify success message")
  async verifySuccessMessage() {
    await expect(this.successMessageLabel).toBeVisible();
  }
}
