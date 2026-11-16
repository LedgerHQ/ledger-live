import { escapeRegExp, isAndroid } from "@e2e/helpers/commonHelpers";
import { byId, byIdWithDescendantText } from "@e2e/helpers/elements/native";
import { Step } from "jest-allure2-reporter/api";

const DEPOSIT_OPTION_IDS = ["bankTransfer", "swap", "receive", "buy"] as const;

export type PayDepositOptionId = (typeof DEPOSIT_OPTION_IDS)[number];

// Matches the label anywhere in a descendant, ignoring case.
const containingLabel = (label: string) => new RegExp(`.*${escapeRegExp(label)}.*`, "i");

export default class PayTabPage {
  private readonly screen = byId("paytab-screen");
  private readonly sheetClose = byId("bottom-sheet-header-close-button");
  private readonly sheetContent = byId("card-details-sheet-content");
  private readonly fundedState = byId("pay-card-balance-funded-state");
  private readonly balanceAmount = byId("pay-card-balance-amount");
  private readonly balanceAmountWithDigit = byIdWithDescendantText({
    id: "pay-card-balance-amount",
    text: /\d/,
  });
  private readonly filterPill = byId("pay-card-balance-filter-pill");
  private readonly filterConfirm = byId("pay-card-balance-filter-confirm");
  private readonly depositTile = byId("action-tile-deposit");
  private readonly requestTile = byId("action-tile-request");
  private readonly depositOptions = byId("pay-card-deposit-options");
  private readonly bankTransferContent = byId("pay-bank-transfer-intro-content");
  private readonly requestScreen = byId("pay-request-receive");
  private readonly requestClose = byId("pay-request-receive-close");
  private readonly requestTitle = byId("pay-request-receive-title");
  private readonly requestAddress = byId("pay-request-receive-address");
  private readonly requestQr = byId("pay-request-receive-qr-code");
  private readonly requestShare = byId("pay-request-receive-share");
  private readonly requestCopy = byId("pay-request-receive-copy");
  private readonly requestVerify = byId("pay-request-receive-verify");
  private readonly payTile = byId("pay-contacts-pay-tile");
  private readonly successStep = byId("pay-success-step");
  private readonly successTitle = byId("pay-success-title");
  private readonly successClose = byId("pay-success-close");
  private readonly detailsButton = byId("card-details-button");
  private readonly reward = byId("card-details-reward");
  private readonly freezeTile = byId("card-details-freeze-tile");
  private readonly freezeContent = byId("card-details-freeze-content");
  private readonly freezeConfirm = byId("freeze-confirm-action");
  private readonly frozenVisual = byId("card-visual-frozen");
  private readonly contactTile = (contactId: string) => byId(`pay-contacts-tile-${contactId}`);
  private readonly filterOption = (rowKey: string) =>
    byId(`pay-card-balance-filter-option-${rowKey}`);
  private readonly depositOption = (optionId: PayDepositOptionId) =>
    byId(`pay-card-deposit-option-${optionId}`);
  private readonly filterPillWithLabel = (label: string) =>
    byIdWithDescendantText({ id: "pay-card-balance-filter-pill", text: containingLabel(label) });
  private readonly bankTransferCreateAccountWithLabel = (label: string) =>
    byIdWithDescendantText({
      id: "pay-bank-transfer-intro-create-account",
      text: containingLabel(label),
    });
  private readonly freezeTileWithLabel = (label: string) =>
    byIdWithDescendantText({ id: "card-details-freeze-tile", text: new RegExp(`^${label}$`) });

  @Step("Expect the Pay tab screen")
  async expectScreenVisible() {
    await this.screen.expectVisible();
  }

  @Step("Expect the Pay tab to show a funded balance")
  async expectFundedBalance() {
    await this.fundedState.expectVisible();
  }

  @Step("Expect the balance amount")
  async expectBalanceAmount() {
    await this.balanceAmount.expectVisible();
    await this.balanceAmountWithDigit.expectVisible();
  }

  @Step("Expect the filter pill to read {{{0}}}")
  async expectFilterPill(label: string) {
    await this.filterPillWithLabel(label).expectVisible();
  }

  @Step("Filter the balance on {{{0}}}")
  async filterBalance(rowKey: string) {
    await this.filterPill.tap();
    await this.filterConfirm.waitVisible();
    await this.filterOption(rowKey).tap();
    await this.filterConfirm.tap();
  }

  @Step("Open deposit options")
  async openDepositOptions() {
    await this.depositTile.tap();
    await this.depositOptions.waitVisible();
  }

  @Step("Expect the deposit options")
  async expectDepositOptions() {
    for (const optionId of DEPOSIT_OPTION_IDS) {
      await this.depositOption(optionId).expectVisible();
    }
  }

  @Step("Select deposit option {{{0}}}")
  async selectDepositOption(optionId: PayDepositOptionId) {
    await this.depositOption(optionId).tap();
  }

  @Step("Expect the bank transfer intro with {{{0}}}")
  async expectBankTransferIntro(createAccountLabel: string) {
    await this.bankTransferContent.waitFullyVisible();
    await this.bankTransferCreateAccountWithLabel(createAccountLabel).expectVisible();
  }

  @Step("Close the bank transfer intro")
  async closeBankTransferIntro() {
    if (isAndroid()) {
      // QAA-1631: Android fails to close when tapping the close button (CI only); swipe to close instead
      // See: https://gorhom.dev/react-native-bottom-sheet/troubleshooting
      await this.bankTransferContent.waitFullyVisible();
      await this.sheetClose.swipe("down");
    } else {
      await this.sheetClose.tap();
    }
    await this.bankTransferContent.waitNotVisible();
  }

  @Step("Open request")
  async openRequest() {
    await this.requestTile.tap();
    await app.modularDrawer.waitForSearchBar();
  }

  @Step("Expect the request screen titled {{{0}}}")
  async expectRequestTitle(title: string) {
    await this.requestTitle.expectVisible();
    await this.requestTitle.expectText(title);
  }

  @Step("Expect the request address")
  async expectRequestAddress() {
    await this.requestAddress.expectVisible();
  }

  @Step("Expect the request QR code")
  async expectRequestQrCode() {
    await this.requestQr.expectVisible();
  }

  @Step("Expect the request Share action")
  async expectRequestShare() {
    await this.requestShare.expectVisible();
  }

  @Step("Expect the request Copy action")
  async expectRequestCopy() {
    await this.requestCopy.expectVisible();
  }

  @Step("Expect the request Verify action")
  async expectRequestVerify() {
    await this.requestVerify.expectVisible();
  }

  @Step("Close the request screen")
  async closeRequest() {
    await this.requestClose.tap();
    await this.requestScreen.waitNotVisible();
  }

  @Step("Open a new payment")
  async openNewPayment() {
    await this.payTile.tap();
  }

  @Step("Select contact {{{0}}}")
  async selectContact(contactId: string) {
    await this.contactTile(contactId).expectVisible();
    await this.contactTile(contactId).tap();
  }

  @Step("Expect the Pay success screen to read {{{0}}}")
  async expectYouPaid(title: string | RegExp) {
    await this.successTitle.waitVisible();
    if (typeof title === "string") {
      await this.successTitle.expectText(title);
    } else {
      await this.successTitle.expectTextMatching(title);
    }
  }

  @Step("Close the Pay success screen")
  async closePaySuccess() {
    await this.successClose.tap();
    await this.successStep.waitNotVisible();
  }

  @Step("Open card details")
  async openCardDetails() {
    await this.detailsButton.revealForTap(this.screen);
    await this.detailsButton.tap();
    await this.sheetContent.waitVisible();
    await this.freezeTile.waitFullyVisible();
  }

  @Step("Close card details")
  async closeCardDetails() {
    await this.sheetClose.tap();
    await this.sheetContent.waitNotVisible();
  }

  @Step("Expect the cashback row")
  async expectCashbackRow() {
    await this.reward.expectVisible();
  }

  @Step("Expect the freeze tile to read {{{0}}}")
  async expectFreezeTile(label: string) {
    await this.freezeTileWithLabel(label).expectVisible();
  }

  @Step("Open freeze confirmation")
  async openFreezeConfirmation() {
    await this.freezeTile.tap();
    await this.freezeContent.waitFullyVisible();
  }

  @Step("Confirm freeze or unfreeze")
  async confirmFreeze() {
    await this.freezeConfirm.tap();
    await this.freezeContent.waitNotVisible();
  }

  @Step("Expect the frozen card")
  async expectCardFrozen() {
    await this.frozenVisual.expectVisible();
  }

  @Step("Expect the card not to be frozen")
  async expectCardNotFrozen() {
    await this.frozenVisual.expectNotVisible();
  }
}
