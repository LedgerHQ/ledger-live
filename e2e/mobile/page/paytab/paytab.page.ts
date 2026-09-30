import { Step } from "jest-allure2-reporter/api";

const DEPOSIT_OPTION_IDS = ["bankTransfer", "swap", "receive", "buy"] as const;

export type PayDepositOptionId = (typeof DEPOSIT_OPTION_IDS)[number];

export default class PayTabPage {
  screenId = "paytab-screen";
  fundedStateId = "pay-card-balance-funded-state";
  balanceAmountId = "pay-card-balance-amount";
  filterPillId = "pay-card-balance-filter-pill";
  filterConfirmId = "pay-card-balance-filter-confirm";
  depositTileId = "action-tile-deposit";
  depositOptionsId = "pay-card-deposit-options";
  bankTransferContentId = "pay-bank-transfer-intro-content";
  bankTransferCreateAccountId = "pay-bank-transfer-intro-create-account";
  bankTransferCloseId = "bottom-sheet-header-close-button";
  requestScreenId = "pay-request-receive";
  requestSummaryId = "pay-request-receive-summary";
  requestCloseId = "pay-request-receive-close";

  filterOptionId = (rowKey: string) => `pay-card-balance-filter-option-${rowKey}`;
  depositOptionId = (optionId: PayDepositOptionId) => `pay-card-deposit-option-${optionId}`;

  @Step("Expect the Pay tab screen")
  async expectScreenVisible() {
    await waitForElementById(this.screenId, undefined, { checkVisibility: false });
  }

  @Step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await waitForElementById(this.fundedStateId, undefined, { checkVisibility: false });
  }

  @Step("Expect the balance amount")
  async expectBalanceAmount() {
    await waitForElementById(this.balanceAmountId, undefined, { checkVisibility: false });
  }

  @Step("Expect the filter pill to read {{{0}}}")
  async expectFilterPill(label: string) {
    await detoxExpect(getElementByIdWithDescendantTexts(this.filterPillId, label)).toBeVisible();
  }

  @Step("Filter the balance on {{{0}}}")
  async filterBalance(rowKey: string) {
    await tapById(this.filterPillId);
    await waitForElementById(this.filterConfirmId);
    await tapById(this.filterOptionId(rowKey));
    await tapById(this.filterConfirmId);
  }

  @Step("Open deposit options")
  async openDepositOptions() {
    await tapById(this.depositTileId);
    await waitForElementById(this.depositOptionsId);
  }

  @Step("Expect the four deposit options")
  async expectDepositOptions() {
    for (const optionId of DEPOSIT_OPTION_IDS) {
      await detoxExpect(getElementById(this.depositOptionId(optionId))).toBeVisible();
    }
  }

  @Step("Select deposit option {{{0}}}")
  async selectDepositOption(optionId: PayDepositOptionId) {
    await tapById(this.depositOptionId(optionId));
  }

  @Step("Expect the bank transfer intro")
  async expectBankTransferIntro() {
    await waitForElementById(this.bankTransferCreateAccountId);
  }

  @Step("Close the bank transfer intro")
  async closeBankTransferIntro() {
    await tapById(this.bankTransferCloseId);
    await this.expectHidden(this.bankTransferContentId);
  }

  @Step("Expect the request screen titled {{{0}}}")
  async expectRequestTitle(title: string) {
    await waitForElementById(this.requestSummaryId);
    await waitForElementByText(title);
  }

  @Step("Close the request screen")
  async closeRequest() {
    await tapById(this.requestCloseId);
    await this.expectHidden(this.requestScreenId);
  }

  private async expectHidden(id: string) {
    if (!(await waitForElementNotVisible(id))) {
      throw new Error(`${id} stayed visible`);
    }
  }
}
