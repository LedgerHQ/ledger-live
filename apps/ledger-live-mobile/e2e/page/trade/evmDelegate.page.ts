import { device, expect } from "detox";
import { Step } from "jest-allure2-reporter/api";

export default class EvmDelegatePage {
  startStakeButtonId = "account-quick-action-button-cta";
  addDelegationButtonId = "account-quick-action-button-addDelegation";
  validatorName = "Ledger by Figment";
  validatorRowId = "evm-validator-row-seivaloper1mockvalidator000000000000000000000001";
  amountInputId = "evm-delegation-amount-input";
  useMaxButtonId = "evm-delegation-use-max";
  amountContinueButtonId = "enabled-evm-delegation-amount-continue";
  delegationSummaryLabel = "Delegated assets";

  @Step("Start EVM delegation flow from account quick actions")
  async startDelegate() {
    await waitForElementById(this.startStakeButtonId);
    await device.disableSynchronization();
    try {
      await tapById(this.startStakeButtonId);
    } catch (error) {
      await device.enableSynchronization();
      throw error;
    }
  }

  @Step("Wait for validator list to be visible")
  async waitForValidatorListVisible() {
    await waitForElementByText(this.validatorName);
  }

  @Step("Select the first validator in the list")
  async selectFirstValidator() {
    try {
      await waitForElementByText(this.validatorName);
      await tapById(this.validatorRowId);
      if (await IsIdVisible(this.useMaxButtonId)) {
        return;
      }
      await tapByText(this.validatorName);
      await waitForElementById(this.useMaxButtonId);
    } finally {
      await device.enableSynchronization();
    }
  }

  @Step("Tap use max amount button")
  async useMaxAmount() {
    await waitForElementById(this.useMaxButtonId);
    await tapById(this.useMaxButtonId);
  }

  @Step("Continue from amount screen")
  async continueAmount() {
    await waitForElementById(this.amountContinueButtonId);
    await tapById(this.amountContinueButtonId);
  }

  @Step("Expect delegated assets summary visible")
  async expectDelegatedAssetsVisible() {
    await waitForElementByText(this.delegationSummaryLabel);
    await expect(getElementByText(this.delegationSummaryLabel)).toBeVisible();
  }

  @Step("Expect add delegation CTA visible")
  async expectAddDelegationCtaVisible() {
    await waitForElementById(this.addDelegationButtonId);
    await expect(getElementById(this.addDelegationButtonId)).toBeVisible();
  }
}
