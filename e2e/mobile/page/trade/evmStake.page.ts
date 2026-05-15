import { Step } from "jest-allure2-reporter/api";

export default class EvmStakePage {
  stakeEntryButtonId = "account-quick-action-button-cta";
  accountScreenScrollViewId = "account-screen-scrollView";
  validatorRowId = (index: number) => `evm-validator-row-${index}`;
  amountInputId = "evm-delegation-amount-input";
  useMaxId = "evm-delegation-use-max";
  amountContinueId = "evm-delegation-amount-continue";

  @Step("Tap the EVM native staking entry button on the account screen")
  async tapStakeEntry() {
    await scrollToId(this.stakeEntryButtonId, this.accountScreenScrollViewId);
    await tapById(this.stakeEntryButtonId);
  }

  @Step("Select EVM validator by index")
  async selectValidator(index = 0) {
    const id = this.validatorRowId(index);
    await waitForElementById(id);
    await tapById(id);
  }

  @Step("Set EVM delegation amount")
  async setAmount(amount: string) {
    await waitForElementById(this.amountInputId);
    await typeTextById(this.amountInputId, amount);
  }

  @Step("Use max balance for EVM delegation")
  async useMax() {
    await tapById(this.useMaxId);
  }

  @Step("Continue from EVM amount step")
  async amountContinue() {
    await waitForElementById(this.amountContinueId);
    await tapById(this.amountContinueId);
  }
}
