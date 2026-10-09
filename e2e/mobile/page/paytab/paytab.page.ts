import { Step } from "jest-allure2-reporter/api";
import { delay } from "@e2e/helpers/commonHelpers";

const DEPOSIT_OPTION_IDS = ["bankTransfer", "swap", "receive", "buy"] as const;

export type PayDepositOptionId = (typeof DEPOSIT_OPTION_IDS)[number];

export default class PayTabPage {
  screenId = "paytab-screen";
  fundedStateId = "pay-card-balance-funded-state";
  balanceAmountId = "pay-card-balance-amount";
  filterPillId = "pay-card-balance-filter-pill";
  filterConfirmId = "pay-card-balance-filter-confirm";
  depositTileId = "action-tile-deposit";
  requestTileId = "action-tile-request";
  depositOptionsId = "pay-card-deposit-options";
  bankTransferContentId = "pay-bank-transfer-intro-content";
  bankTransferCloseId = "bottom-sheet-header-close-button";
  requestScreenId = "pay-request-receive";
  requestCloseId = "pay-request-receive-close";
  payTileId = "pay-contacts-pay-tile";
  contactTile = (contactId: string) => getElementById(`pay-contacts-tile-${contactId}`);
  successStepId = "pay-success-step";
  successTitleId = "pay-success-title";
  successCloseId = "pay-success-close";

  requestTitle = () => getElementById("pay-request-receive-title");
  requestAddress = () => getElementById("pay-request-receive-address");
  requestQr = () => getElementById("pay-request-receive-qr-code");
  requestShare = () => getElementById("pay-request-receive-share");
  requestCopy = () => getElementById("pay-request-receive-copy");
  requestVerify = () => getElementById("pay-request-receive-verify");

  filterOptionId = (rowKey: string) => `pay-card-balance-filter-option-${rowKey}`;
  depositOptionId = (optionId: PayDepositOptionId) => `pay-card-deposit-option-${optionId}`;

  @Step("Expect the Pay tab screen")
  async expectScreenVisible() {
    await detoxExpect(getElementById(this.screenId)).toBeVisible();
  }

  @Step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await detoxExpect(getElementById(this.fundedStateId)).toBeVisible();
  }

  @Step("Expect the balance amount")
  async expectBalanceAmount() {
    await detoxExpect(getElementById(this.balanceAmountId)).toBeVisible();
    await detoxExpect(getElementByIdWithDescendantTexts(this.balanceAmountId, /\d/)).toBeVisible();
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

  @Step("Expect the deposit options")
  async expectDepositOptions() {
    for (const optionId of DEPOSIT_OPTION_IDS) {
      await detoxExpect(getElementById(this.depositOptionId(optionId))).toBeVisible();
    }
  }

  @Step("Select deposit option {{{0}}}")
  async selectDepositOption(optionId: PayDepositOptionId) {
    await tapById(this.depositOptionId(optionId));
  }

  @Step("Expect the bank transfer intro with {{{0}}}")
  async expectBankTransferIntro(createAccountLabel: string) {
    await waitForFullyVisibleById(this.bankTransferContentId);
    await detoxExpect(
      getElementByIdWithDescendantTexts(this.bankTransferCreateAccountId, createAccountLabel),
    ).toBeVisible();
  }

  @Step("Close the bank transfer intro")
  async closeBankTransferIntro() {
    await delay(15_000);
    await tapById(this.bankTransferCloseId);
    if (!(await waitForElementNotVisible(this.bankTransferContentId))) {
      throw new Error(`${this.bankTransferContentId} stayed visible`);
    }
  }

  @Step("Open request")
  async openRequest() {
    await tapById(this.requestTileId);
    await waitForFullyVisibleById(app.modularDrawer.searchBarId);
  }

  @Step("Expect the request screen titled {{{0}}}")
  async expectRequestTitle(title: string) {
    await detoxExpect(this.requestTitle()).toBeVisible();
    await detoxExpect(this.requestTitle()).toHaveText(title);
  }

  @Step("Expect the request address")
  async expectRequestAddress() {
    await detoxExpect(this.requestAddress()).toBeVisible();
  }

  @Step("Expect the request QR code")
  async expectRequestQrCode() {
    await detoxExpect(this.requestQr()).toBeVisible();
  }

  @Step("Expect the request Share action")
  async expectRequestShare() {
    await detoxExpect(this.requestShare()).toBeVisible();
  }

  @Step("Expect the request Copy action")
  async expectRequestCopy() {
    await detoxExpect(this.requestCopy()).toBeVisible();
  }

  @Step("Expect the request Verify action")
  async expectRequestVerify() {
    await detoxExpect(this.requestVerify()).toBeVisible();
  }

  @Step("Close the request screen")
  async closeRequest() {
    await tapById(this.requestCloseId);
    if (!(await waitForElementNotVisible(this.requestScreenId))) {
      throw new Error(`${this.requestScreenId} stayed visible`);
    }
  }

  @Step("Open a new payment")
  async openNewPayment() {
    await tapById(this.payTileId);
  }

  @Step("Select contact {{{0}}}")
  async selectContact(contactId: string) {
    await detoxExpect(this.contactTile(contactId)).toBeVisible();
    await tapByElement(this.contactTile(contactId));
  }

  @Step("Expect the Pay success screen to read {{{0}}}")
  async expectYouPaid(title: string | RegExp) {
    await waitForElementById(this.successTitleId);
    const actualTitle = await getTextOfElement(this.successTitleId);
    if (typeof title === "string") {
      jestExpect(actualTitle).toEqual(title);
    } else {
      jestExpect(actualTitle).toMatch(title);
    }
  }

  @Step("Close the Pay success screen")
  async closePaySuccess() {
    await tapById(this.successCloseId);
    if (!(await waitForElementNotVisible(this.successStepId))) {
      throw new Error(`${this.successStepId} stayed visible`);
    }
  }
}
