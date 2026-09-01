import { Step } from "jest-allure2-reporter/api";

export default class UndelegatePage {
  private accountScrollViewId = "account-screen-scrollView";
  // Families that hold several positions index their rows; those that delegate once do not.
  private stakingRowId = (currencyId: string, rowIndex?: number) =>
    rowIndex === undefined ? `${currencyId}-staking-row` : `${currencyId}-staking-row-${rowIndex}`;
  private amountInputId = (currencyId: string) => `${currencyId}-delegation-amount-input`;
  private amountContinueId = (currencyId: string) =>
    `enabled-${currencyId}-delegation-amount-continue`;

  @Step("Tap staking position row to open delegation drawer {{{0}}}")
  async tapStakingRow(currencyId: string, rowIndex?: number) {
    const id = this.stakingRowId(currencyId, rowIndex);
    await waitForElementById(this.accountScrollViewId);
    await scrollToId(id, this.accountScrollViewId);
    await tapById(id);
  }

  @Step("Tap unstake action {{{0}}} in delegation drawer")
  async tapUnstakeAction(actionId: string) {
    await waitForElementById(actionId);
    await tapById(actionId);
  }

  @Step("Enter unstake amount {{{1}}}")
  async enterAmount(currencyId: string, amount: string) {
    await waitForElementById(this.amountInputId(currencyId));
    await typeTextById(this.amountInputId(currencyId), amount);
    await waitForElementById(this.amountContinueId(currencyId));
  }

  @Step("Continue from amount step {{{0}}}")
  async continueFromAmount(currencyId: string) {
    await tapById(this.amountContinueId(currencyId));
  }
}
