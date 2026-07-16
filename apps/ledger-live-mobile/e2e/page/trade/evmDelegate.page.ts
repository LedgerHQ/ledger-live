import { expect } from "detox";
import { Step } from "jest-allure2-reporter/api";

const FEE_ESTIMATION_TIMEOUT = 120000;

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
    await tapById(this.startStakeButtonId);
  }

  @Step("Wait for validator list to be visible")
  async waitForValidatorListVisible() {
    await waitForElementByText(this.validatorName);
  }

  @Step("Select the first validator in the list")
  async selectFirstValidator() {
    await waitForElementByText(this.validatorName);
    await tapById(this.validatorRowId);
    if (await IsIdVisible(this.amountInputId)) {
      return;
    }
    await tapByText(this.validatorName);
    await waitForElementById(this.amountInputId);
  }

  @Step("Set delegation amount to {amount}")
  async setAmount(amount: string) {
    await waitForElementById(this.amountInputId);
    await typeTextById(this.amountInputId, amount);
  }

  @Step("Wait until network fees are loaded and continue is enabled")
  async waitForAmountContinueEnabled(timeout = FEE_ESTIMATION_TIMEOUT) {
    await waitForElementById(this.amountContinueButtonId, timeout);
  }

  @Step("Tap use max amount button")
  async useMaxAmount() {
    await waitForElementById(this.useMaxButtonId);
    await tapById(this.useMaxButtonId);
    await this.waitForAmountContinueEnabled();
  }

  @Step("Continue from amount screen")
  async continueAmount() {
    await waitForElementById(this.amountContinueButtonId);
    await tapById(this.amountContinueButtonId);
  }

  @Step("Set amount and continue once fees are ready")
  async setAmountAndContinue(amount: string) {
    await this.setAmount(amount);
    await this.waitForAmountContinueEnabled();
    await this.continueAmount();
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
