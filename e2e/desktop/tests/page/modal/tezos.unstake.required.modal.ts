import { expect } from "@playwright/test";
import { Modal } from "tests/component/modal.component";
import { step } from "tests/misc/reporters/step";

export class TezosUnstakeRequiredModal extends Modal {
  // Delegation-row context-menu ids come from DropDownSelector's `buttonId` ("tezos-delegation-menu"):
  // the trigger is `#<buttonId>` and each item is `#<buttonId>-<key>`.
  private readonly delegationMenuButton = this.page.locator("#tezos-delegation-menu");
  private readonly changeValidatorItem = this.page.locator("#tezos-delegation-menu-redelegate");
  private readonly stopDelegationItem = this.page.locator("#tezos-delegation-menu-stopDelegation");
  private readonly requiredCloseButton = this.page.getByTestId(
    "tezos-unstake-required-close-button",
  );

  @step("Open the delegation menu and pick Change validator")
  async openChangeValidator() {
    await this.delegationMenuButton.click();
    await this.changeValidatorItem.click();
  }

  @step("Open the delegation menu and pick Stop delegation")
  async openStopDelegation() {
    await this.delegationMenuButton.click();
    await this.stopDelegationItem.click();
  }

  @step("Verify the unstake-required modal is shown")
  async verifyVisible() {
    await expect(this.requiredCloseButton).toBeVisible();
  }

  @step("Dismiss the unstake-required modal")
  async dismiss() {
    await this.requiredCloseButton.click();
  }
}
