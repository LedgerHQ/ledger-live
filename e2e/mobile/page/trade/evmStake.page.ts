import { Step } from "jest-allure2-reporter/api";
import { byId } from "@e2e/helpers/elements/native";
import { TIMEOUT } from "@e2e/utils/timeouts";

// Fee estimation round-trips to the node before the continue button enables.
const FEE_ESTIMATION_TIMEOUT = TIMEOUT.xxxlarge;

export default class EvmStakePage {
  // The staking quick-action testID suffix depends on account state: `cta` when the account has no
  // delegation yet, `addDelegation` once it already delegates. Both navigate to the validator list.
  private readonly startDelegateCta = byId(/^account-quick-action-button-(cta|addDelegation)$/);
  private readonly validatorRow = byId(/^evm-validator-row-.+$/);
  private readonly amountInput = byId("evm-delegation-amount-input");
  private readonly amountContinueButton = byId("enabled-evm-delegation-amount-continue");
  private readonly successScreen = byId("validate-success-screen");

  @Step("Start EVM delegation flow from account quick actions")
  async startDelegate() {
    await this.startDelegateCta.tap();
  }

  @Step("Select the first validator displayed in the list")
  async selectFirstValidator() {
    await this.validatorRow.tap();
    await this.amountInput.waitVisible();
  }

  @Step("Set delegation amount to {{{0}}}")
  async setAmount(amount: string) {
    await this.amountInput.replaceText(amount);
  }

  @Step("Wait until network fees are loaded and continue is enabled")
  async waitForAmountContinueEnabled(timeout = FEE_ESTIMATION_TIMEOUT) {
    await this.amountContinueButton.waitVisible(timeout);
  }

  @Step("Continue from amount screen")
  async continueAmount() {
    await this.amountContinueButton.tap();
  }

  @Step("Set amount and continue once fees are ready {{{0}}}")
  async setAmountAndContinue(amount: string) {
    await this.setAmount(amount);
    await this.waitForAmountContinueEnabled();
    await this.continueAmount();
  }

  @Step("Expect EVM delegation success message")
  async expectSuccessMessage() {
    await this.successScreen.waitVisible();
    await this.successScreen.expectVisible();
  }
}
