import invariant from "invariant";
import { Step } from "jest-allure2-reporter/api";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId, byIdAndText, byText } from "@e2e/helpers/elements/native";
import { isAccountDetailEnabled } from "@e2e/utils/featureFlagUtils";
import { TIMEOUT } from "@e2e/utils/timeouts";
import { Account, AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import AccountDetailPage from "./accountDetail.page";

const ACCOUNT_GRAPH_PREFIX = "account-graph-";
const ACCOUNT_NAME_PREFIX = "account-row-name-";
const OPERATION_ROW_REGEXP = /operation-row-.*/;

export default class AccountPage {
  private readonly accountDetail = new AccountDetailPage();
  private readonly baseLink = "account";

  private readonly accountListTitle = byId("accounts-list-title");
  private readonly accountsList = byId("accounts-list");
  private readonly accountScreenScrollView = byId("account-screen-scrollView");
  private readonly accountAdvancedLogs = byId("account-advanced-logs");
  private readonly accountAdvancedLogRow = byId("account-advanced-log-row");
  private readonly accountSettingsButton = byId("account-settings-button");
  private readonly accountDeleteRow = byId("account-settings-delete-row");
  private readonly accountDeleteConfirm = byId("delete-account-confirmation-button");
  private readonly accountRenameRow = byId("account-settings-rename-row");
  private readonly accountRenameTextInput = byId("account-rename-text-input");
  private readonly headerBackButton = byId("account-header-back-button");
  private readonly receiveButton = byId("account-quick-action-button-receive");
  private readonly sendButton = byId("account-quick-action-button-send");
  private readonly earnButton = byId("account-quick-action-button-earn");
  private readonly swapButton = byId("account-quick-action-button-swap");
  private readonly buyButton = byId("account-quick-action-button-buy");
  private readonly expandTokenListButton = byId("enabled-account-expand-token-list");
  private readonly anyOperationRow = byId(OPERATION_ROW_REGEXP);
  // A sub-account graph id carries the parent and token ids joined by "+".
  private readonly subAccountGraph = (index = 0) =>
    byId(new RegExp(String.raw`^${ACCOUNT_GRAPH_PREFIX}.+\+.+`), index);
  private readonly accountNameAt = (index: number) =>
    byId(new RegExp(`${ACCOUNT_NAME_PREFIX}.*`), index);
  private readonly accountNameRow = (name: string) => byId(`${ACCOUNT_NAME_PREFIX}${name}`);
  private readonly accountRow = (id: string) => byId(`account-row-${id}`);
  private readonly accountTitle = (name: string) => byText(name);
  private readonly accountGraph = (accountId: string) =>
    byId(`${ACCOUNT_GRAPH_PREFIX}${accountId}`);
  private readonly accountBalance = (accountId: string) => byId(`account-balance-${accountId}`);
  private readonly accountAddress = (accountId: string) => byId(`account-address-${accountId}`);
  private readonly operationHistorySection = (accountId: string) =>
    byId(`operations-history-${accountId}`);
  private readonly subAccountRow = (ticker: string) => byId(`subAccount-row-name-${ticker}`);
  private readonly operationRowWithType = (operationType: string) =>
    byIdAndText({ id: OPERATION_ROW_REGEXP, text: operationType });

  @Step("Wait for account screen and verify account name {{{0}}}")
  async waitAndVerifyAccountName(accountName: string) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.waitAndVerifyAccountName(accountName);
      return;
    }
    await this.accountScreenScrollView.waitVisible();
    await this.accountTitle(accountName).expectVisible();
  }

  @Step("Expect the account title {{{0}}} to be visible")
  async expectAccountTitleVisible(accountName: string) {
    await this.accountTitle(accountName).expectVisible();
  }

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
    await this.accountListTitle.waitVisible();
    await this.accountListTitle.expectVisible();
  }

  @Step("Go back from account detail")
  async goBackFromAccountDetail() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.goBack();
      return;
    }
    await this.headerBackButton.tap();
  }

  @Step("Check if account detail is visible")
  async isAccountDetailVisible(timeout = TIMEOUT.xxsmall) {
    if (isAccountDetailEnabled()) {
      return await this.accountDetail.isVisible(timeout);
    }
    return await this.accountScreenScrollView.isVisible(timeout);
  }

  @Step("Go to the account with the name {{{0}}}")
  async goToAccountByName(name: string) {
    await this.accountNameRow(name).scrollTo(this.accountsList);
    await this.accountNameRow(name).tap();
  }

  @Step("Go to the account with id {{{0}}}")
  async goToAccountById(id: string) {
    await this.accountRow(id).scrollTo(this.accountsList);
    await this.accountRow(id).waitVisible();
    await this.accountRow(id).expectVisible();
    await this.accountRow(id).tap();
  }

  @Step("Expect the account name {{{0}}}")
  async expectAccountName(accountName: string, index = 0) {
    await this.accountNameAt(index).waitVisible();
    await this.accountNameAt(index).expectText(accountName);
  }

  @Step("Open account settings")
  async openAccountSettings() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.openSettings();
      return;
    }
    await this.accountSettingsButton.tap(); // Issue with RN75 : QAA-370
  }

  @Step("Open account advanced logs")
  async openAccountAdvancedLogs() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.openAdvancedLogs();
      return;
    }
    await this.accountAdvancedLogRow.tap();
  }

  @Step("Select account deletion")
  async selectAccountDelete() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.selectDelete();
      return;
    }
    await this.accountDeleteRow.tap();
  }

  @Step("Confirm account deletion")
  async confirmAccountDelete() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.confirmDelete();
      return;
    }
    await this.accountDeleteConfirm.tap();
  }

  @Step("Select account edit name")
  async selectAccountRename() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.selectRename();
      return;
    }
    await this.accountRenameRow.tap();
  }

  @Step("Enter new account name and submit {{{0}}}")
  async enterNewAccountName(name: string) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.enterNewName(name);
      return;
    }
    await this.accountRenameTextInput.replaceText(name);
  }

  @Step("Expect operation history to be visible {{{0}}}")
  async expectOperationHistoryVisible(accountId: string) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.expectOperationHistoryVisible();
      return;
    }
    await this.anyOperationRow.scrollTo(this.accountScreenScrollView, { pixels: 250 });
    await this.operationHistorySection(accountId).expectExist();
    await this.anyOperationRow.expectVisible();
  }

  @Step("Scroll to operation history")
  async scrollToTransactions() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.scrollToTransactions();
      return;
    }
    await this.accountScreenScrollView.waitVisible();
    await this.anyOperationRow.scrollTo(this.accountScreenScrollView, { pixels: 300 });
  }

  @Step("Expect account balance to be visible {{{0}}}")
  async expectAccountBalanceVisible(accountId: string) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.expectBalanceVisible();
      return;
    }
    await this.accountGraph(accountId).expectVisible();
    await this.accountBalance(accountId).expectVisible();
  }

  /**
   * Both labels keep the first and last 4 characters of the address: the account detail nav bar
   * shortens it with `formatAddress` (`useAccountDetailViewModel`), the legacy tag holds it whole.
   */
  @Step("Expect the address label of {{{0.accountId}}} to show {{{0.address}}}")
  async expectAccountAddressLabel({ accountId, address }: { accountId: string; address: string }) {
    const shortenedAddress = new RegExp(`${address.slice(0, 4)}.*${address.slice(-4)}`, "i");
    if (isAccountDetailEnabled()) {
      await this.accountDetail.expectAddressLabelMatching(shortenedAddress);
      return;
    }
    const addressLabel = this.accountAddress(accountId);
    await addressLabel.scrollTo(this.accountScreenScrollView);
    await addressLabel.expectLabelMatching(shortenedAddress);
  }

  @Step("Expect account receive and send actions")
  async expectReceiveAndSendActionsVisible() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.expectReceiveAndSendActionsVisible();
      return;
    }
    await this.receiveButton.scrollTo(this.accountScreenScrollView);
    await this.receiveButton.expectVisible();
    await this.sendButton.expectVisible();
  }

  @Step("Expect address index {{{0}}}")
  async expectAddressIndex(indexNumber: number) {
    await this.openAccountSettings();
    await this.openAccountAdvancedLogs();
    const advancedLogsText = isAccountDetailEnabled()
      ? await this.accountDetail.getAdvancedLogs()
      : await this.accountAdvancedLogs.getText();
    const advancedLogsJson = advancedLogsText ? JSON.parse(advancedLogsText) : null;
    jestExpect(advancedLogsJson).toHaveProperty("index", indexNumber);
  }

  @Step("Tap on receive button")
  async tapReceive() {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.tapReceive();
      return;
    }
    await this.receiveButton.revealForTap(this.accountScreenScrollView);
    await this.receiveButton.tap();
  }

  @Step("Tap on send button")
  async tapSend(currencyId?: string, isToken = false) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.tapSend(currencyId, isToken);
      return;
    }
    await this.sendButton.revealForTap(this.accountScreenScrollView);
    await this.sendButton.tap();
  }

  @Step("Tap on earn button")
  async tapEarn() {
    await this.earnButton.scrollTo(this.accountScreenScrollView);
    await this.earnButton.tap();
  }

  @Step("Tap on swap button")
  async tapSwap() {
    await this.swapButton.scrollTo(this.accountScreenScrollView);
    await this.swapButton.tap();
  }

  @Step("Tap on buy button")
  async tapBuy() {
    await this.buyButton.scrollTo(this.accountScreenScrollView);
    await this.buyButton.tap();
  }

  /**
   * The picker names a token by its own id, which some tokens lack: they carry the id of their
   * chain, which names the native row. For them nothing but the chain's id is known, so none is passed.
   */
  @Step("Tap on send for {{{0.accountName}}}")
  async tapSendOf(account: Account) {
    const isToken = account.parentAccount !== undefined;
    const namesChainOnly = account.currency.id === account.parentAccount?.currency.id;
    await this.tapSend(namesChainOnly ? undefined : account.currency.id, isToken);
  }

  @Step("Open the send of sub account {{{0.accountName}}}")
  async openSubAccountSend(account: AccountType) {
    if (isAccountDetailEnabled()) {
      invariant(account.parentAccount, `${account.accountName} has no parent account`);
      await this.openViaDeeplink();
      await this.goToAccountByName(account.parentAccount.accountName);
      await this.tapSendOf(account);
      return;
    }
    await this.navigateToSubAccount(account);
    await this.tapSend();
  }

  @Step("Expect the balance of sub account {{{0.accountName}}} to be visible")
  async expectSubAccountBalanceVisible(account: AccountType, subAccountId: string) {
    if (isAccountDetailEnabled()) {
      await app.assetDetail.expectTotalBalanceCryptoForTicker(account.currency.ticker);
      return;
    }
    await this.expectAccountBalanceVisible(subAccountId);
  }

  @Step("Scroll to the history of the sub account and click on last operation {{{0}}}")
  async scrollToSubAccountHistoryAndClickOnLastOperation(operationType: string) {
    if (isAccountDetailEnabled()) {
      await app.assetDetail.openTransactionOfType(operationType);
      return;
    }
    await this.scrollToHistoryAndClickOnLastOperation(operationType);
  }

  @Step("Navigate to token in account {{{0.accountName}}}")
  async navigateToTokenInAccount(subAccount: Account) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.openAsset(subAccount.currency.name);
      return;
    }
    const subAccountRow = this.subAccountRow(subAccount.currency.ticker);
    await this.accountScreenScrollView.waitVisible();
    try {
      await subAccountRow.scrollTo(this.accountScreenScrollView);
    } catch {
      // The token is folded away when the account holds many: expand the list first.
      await this.expandTokenListButton.revealForTap(this.accountScreenScrollView);
      await this.expandTokenListButton.tap();
      await subAccountRow.scrollTo(this.accountScreenScrollView);
    }
    await subAccountRow.tap();
  }

  @Step("Navigate to sub account {{{0.accountName}}}")
  async navigateToSubAccount(account: AccountType) {
    const { parentAccount } = account;
    invariant(parentAccount, `${account.accountName} has no parent account`);

    const parentAddress = parentAccount.address;
    invariant(parentAddress, `${parentAccount.accountName} has no address`);

    await this.openViaDeeplink();
    await this.goToAccountByName(parentAccount.accountName);
    await this.navigateToTokenInAccount(account);

    if (isAccountDetailEnabled()) {
      const holdingAccountId = await app.assetDetail.getFirstHoldingAccountId();
      invariant(
        holdingAccountId.includes(parentAddress),
        `expected an asset held by ${parentAccount.accountName}, landed on ${holdingAccountId}`,
      );
      return holdingAccountId;
    }

    // Several graphs can match the pattern: take the one on screen.
    await this.subAccountGraph().waitExist();
    const graphCount = await this.subAccountGraph().count();
    let graphId: string | undefined;
    for (let index = 0; index < graphCount; index++) {
      const graph = this.subAccountGraph(index);
      if (await graph.isVisibleNow()) {
        graphId = (await graph.getIdentifier()).replace(ACCOUNT_GRAPH_PREFIX, "");
        break;
      }
    }
    invariant(graphId, `no visible account graph after opening ${account.accountName}`);

    invariant(
      graphId.includes(parentAddress),
      `expected a sub-account of ${parentAccount.accountName}, landed on ${graphId}`,
    );
    return graphId;
  }

  @Step("Scroll to history and click on last operation {{{0}}}")
  async scrollToHistoryAndClickOnLastOperation(operationType: string) {
    if (isAccountDetailEnabled()) {
      await this.accountDetail.scrollToHistoryAndClickOnLastOperation(operationType);
      return;
    }
    await this.scrollToTransactions();
    await this.operationRowWithType(operationType).tap();
  }
}
