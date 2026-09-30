import { Step } from "jest-allure2-reporter/api";

const DEPOSIT_OPTION_IDS = ["bankTransfer", "swap", "receive", "buy"] as const;

export type PayDepositOptionId = (typeof DEPOSIT_OPTION_IDS)[number];

export default class PayTabPage {
  screenId = "paytab-screen";
  scrollViewId = "paytab-scroll-view";
  sheetCloseId = "bottom-sheet-header-close-button";
  fundedStateId = "pay-card-balance-funded-state";
  balanceAmountId = "pay-card-balance-amount";
  filterPillId = "pay-card-balance-filter-pill";
  filterConfirmId = "pay-card-balance-filter-confirm";
  depositTileId = "action-tile-deposit";
  requestTileId = "action-tile-request";
  depositOptionsId = "pay-card-deposit-options";
  bankTransferContentId = "pay-bank-transfer-intro-content";
  bankTransferCreateAccountId = "pay-bank-transfer-intro-create-account";
  bankTransferCloseId = "bottom-sheet-header-close-button";
  requestScreenId = "pay-request-receive";
  requestSummaryId = "pay-request-receive-summary";
  requestAddressId = "pay-request-receive-address";
  requestQrId = "pay-request-receive-qr-code";
  requestShareId = "pay-request-receive-share";
  requestCopyId = "pay-request-receive-copy";
  requestVerifyId = "pay-request-receive-verify";
  requestVerifyHintId = "pay-request-receive-verify-hint";
  requestCloseId = "pay-request-receive-close";
  payTileId = "pay-contacts-pay-tile";
  contactTileId = (index: number) => `pay-contacts-tile-${index}`;
  successStepId = "pay-success-step";
  successCloseId = "pay-success-close";
  detailsButtonId = "card-details-button";
  rewardId = "card-details-reward";
  freezeTileId = "card-details-freeze-tile";
  freezeContentId = "card-details-freeze-content";
  freezeConfirmId = "freeze-confirm-action";
  frozenVisualId = "card-visual-frozen";

  filterOptionId = (rowKey: string) => `pay-card-balance-filter-option-${rowKey}`;
  depositOptionId = (optionId: PayDepositOptionId) => `pay-card-deposit-option-${optionId}`;

  @Step("Expect the Pay tab screen")
  async expectScreenVisible() {
    await waitForElementById(this.screenId, undefined, { checkVisibility: false });
  }

  @Step("Dismiss the verify address hint when it is shown")
  async dismissVerifyHintIfVisible() {
    if (!(await IsIdPresent(this.requestVerifyHintId, 2_000))) return;
    await tapByText("Got it");
    await waitForElementNotVisible(this.requestVerifyHintId);
  }

  @Step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await waitForElementById(this.fundedStateId, undefined, { checkVisibility: false });
  }

  @Step("Expect the balance amount")
  async expectBalanceAmount() {
    await detoxExpect(getElementById(this.balanceAmountId)).toBeVisible();
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
    await waitForElementNotVisible(this.bankTransferContentId);
  }

  @Step("Open request")
  async openRequest() {
    await tapById(this.requestTileId);
  }

  @Step("Expect the request screen titled {{{0}}}")
  async expectRequestTitle(title: string) {
    await this.dismissVerifyHintIfVisible();
    await waitForElementById(this.requestSummaryId);
    await waitForElementByText(title);
  }

  @Step("Expect the request address")
  async expectRequestAddress() {
    await detoxExpect(getElementById(this.requestAddressId)).toBeVisible();
  }

  @Step("Expect the request QR code")
  async expectRequestQrCode() {
    await waitForElementById(this.requestQrId, undefined, { checkVisibility: false });
  }

  @Step("Expect the request Share action")
  async expectRequestShare() {
    await detoxExpect(getElementById(this.requestShareId)).toBeVisible();
  }

  @Step("Expect the request Copy action")
  async expectRequestCopy() {
    await detoxExpect(getElementById(this.requestCopyId)).toBeVisible();
  }

  @Step("Expect the request Verify action")
  async expectRequestVerify() {
    await detoxExpect(getElementById(this.requestVerifyId)).toBeVisible();
  }

  @Step("Close the request screen")
  async closeRequest() {
    await this.dismissVerifyHintIfVisible();
    await tapById(this.requestCloseId);
    await waitForElementNotVisible(this.requestScreenId);
  }

  @Step("Open a new payment")
  async openNewPayment() {
    await tapById(this.payTileId);
  }

  @Step("Select contact at index {{{0}}}")
  async selectContact(index: number) {
    await waitForElementById(this.contactTileId(index));
    await tapById(this.contactTileId(index));
  }

  @Step("Expect the Pay success screen")
  async expectYouPaid() {
    await waitForElementById(this.successCloseId);
    await waitForElementByText(/You paid .+/);
  }

  @Step("Expect the Pay success screen to mention {{{0}}}")
  async expectPaySuccess(recipient: string) {
    await waitForElementById(this.successCloseId);
    await waitForElementByText(`You paid ${recipient}`);
  }

  @Step("Close the Pay success screen")
  async closePaySuccess() {
    await tapById(this.successCloseId);
    await waitForElementNotVisible(this.successStepId);
  }

  @Step("Open card details")
  async openCardDetails() {
    await revealForTap(this.detailsButtonId, { container: this.scrollViewId });
    await tapById(this.detailsButtonId);
    await waitForElementById(this.freezeTileId);
  }

  @Step("Close card details")
  async closeCardDetails() {
    await tapById(this.sheetCloseId);
    await waitForElementNotVisible(this.freezeTileId);
  }

  @Step("Expect the cashback row")
  async expectCashbackRow() {
    await waitForElementById(this.rewardId, undefined, { checkVisibility: false });
  }

  @Step("Expect the freeze tile to read {{{0}}}")
  async expectFreezeTile(label: string) {
    await waitForElement(
      getElementByIdWithDescendantTexts(this.freezeTileId, new RegExp(`^${label}$`)),
    );
  }

  @Step("Open freeze confirmation")
  async openFreezeConfirmation() {
    await tapById(this.freezeTileId);
    await waitForElementById(this.freezeConfirmId);
  }

  @Step("Confirm freeze or unfreeze")
  async confirmFreeze() {
    await tapById(this.freezeConfirmId);
    await waitForElementNotVisible(this.freezeContentId);
  }

  @Step("Expect the frozen card")
  async expectCardFrozen() {
    await waitForElement(getElementById(this.frozenVisualId), undefined, {
      checkVisibility: false,
    });
  }

  @Step("Expect the card not to be frozen")
  async expectCardNotFrozen() {
    const hidden = await waitForElementNotVisible(this.frozenVisualId);
    jestExpect(hidden).toBe(true);
  }
}
