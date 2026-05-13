import { expect } from "@playwright/test";
import { delegateModal } from "./delegate.modal";
import { step } from "tests/misc/reporters/step";

export class EvmDelegateModal extends delegateModal {
  private earnRewardsEmptyStateButton = this.page.getByTestId("evm-earn-rewards-button");
  private delegateContinueButton = this.page.locator("#delegate-continue-button");

  @step("Start evm delegate flow from account empty state")
  async startFromEmptyState() {
    await this.earnRewardsEmptyStateButton.click();
  }

  @step("Verify delegate continue button is enabled")
  async verifyDelegateContinueEnabled() {
    await expect(this.delegateContinueButton).toBeEnabled();
  }

  @step("Click delegate continue button")
  async delegateContinue() {
    await this.verifyDelegateContinueEnabled();
    await this.delegateContinueButton.click();
  }
}
