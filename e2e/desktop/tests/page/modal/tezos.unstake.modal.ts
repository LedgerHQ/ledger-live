import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class TezosUnstakeModal extends Modal {
  // The staking-section dropdown ids come from DropDownSelector's `buttonId` ("tezos-staking-menu"):
  // the trigger is `#<buttonId>` and each item is `#<buttonId>-<key>`.
  private stakingMenuButton = this.page.locator("#tezos-staking-menu");
  private unstakeMenuItem = this.page.locator("#tezos-staking-menu-unstake");
  private amountField = this.page.getByTestId("modal-amount-field");
  private amountContinueButton = this.page.getByTestId("tezos-unstake-amount-continue-button");
  private successMessageLabel = this.page.getByTestId("success-message-label");

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
