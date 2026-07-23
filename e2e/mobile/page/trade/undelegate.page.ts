import { Step } from "jest-allure2-reporter/api";

export default class UndelegatePage {
  private accountScrollViewId = "account-screen-scrollView";
  private stakingRowId = (rowIndex: number) => `sui-staking-row-${rowIndex}`;
  private unstakeActionId = "StakingActionUnstake";
  private amountInputId = "sui-delegation-amount-input";
  private amountContinueId = "enabled-sui-delegation-amount-continue";

  @Step("Tap staking position row to open delegation drawer")
  async tapStakingRow(rowIndex = 0) {
    await waitForElementById(this.accountScrollViewId);
    await scrollToId(this.stakingRowId(rowIndex), this.accountScrollViewId);
    await tapById(this.stakingRowId(rowIndex));
  }

  @Step("Tap Unstake action in delegation drawer")
  async tapUnstakeAction() {
    await waitForElementById(this.unstakeActionId);
    await tapById(this.unstakeActionId);
  }

  @Step("Enter unstake amount")
  async enterAmount(amount: string) {
    await waitForElementById(this.amountInputId);
    await typeTextById(this.amountInputId, amount);
    await waitForElementById(this.amountContinueId);
  }

  @Step("Continue from amount step")
  async continueFromAmount() {
    await tapById(this.amountContinueId);
  }
}
