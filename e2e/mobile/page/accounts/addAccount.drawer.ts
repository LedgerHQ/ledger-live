import { delay, openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";
import { retryUntilTimeout } from "../../utils/retry";
import { checkForErrorModals } from "../../helpers/errorHelpers";

export default class AddAccountDrawer extends CommonPage {
  baseLink = "add-account";
  deselectAllButtonId = "add-accounts-deselect-all";
  modalButtonId = "add-accounts-modal-add-button";
  continueButtonId = "add-accounts-continue-button";
  closeAddAccountButtonId = "button-close-add-account";
  addFundsButtonId = "button-add-funds";
  actionDrawerReceiveButtonId = "action-drawer-receive-button";
  addNewOrExistingAccount = "add-new-account-button";

  accountIdAccountDrawer = (currency: string) => `js:2:${currency}:.*`;

  @Step("Open add account via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Click on 'Import with your Ledger' button")
  async importWithYourLedger() {
    await waitForElementById(this.modalButtonId);
    await tapById(this.modalButtonId);
  }

  @Step("Wait for accounts discovery")
  async waitAccountsDiscovery() {
    const DISCOVERY_TIMEOUT = 240000;
    const ERROR_CHECK_INTERVAL = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < DISCOVERY_TIMEOUT) {
      if (await this.isContinueButtonVisible()) {
        await waitForElementById(this.continueButtonId, 5000);
        return;
      }
      await checkForErrorModals(1000, "Account discovery failed");
      await delay(ERROR_CHECK_INTERVAL);
    }

    this.throwDiscoveryTimeoutError(DISCOVERY_TIMEOUT);
  }

  private async isContinueButtonVisible(): Promise<boolean> {
    return await IsIdVisible(this.continueButtonId, 1000);
  }

  private throwDiscoveryTimeoutError(timeoutMs: number): never {
    throw new Error(
      `Account discovery timed out after ${timeoutMs / 1000} seconds. Expected button "${this.continueButtonId}" not found.`,
    );
  }

  @Step("Finish account discovery")
  async finishAccountsDiscovery() {
    await retryUntilTimeout(async () => {
      await tapById(this.continueButtonId);
      await waitForElementNotVisible(this.continueButtonId);
    });
  }

  @Step("Expect account discovered")
  async expectAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    await detoxExpect(this.accountItem(this.accountIdAccountDrawer(currencyId))).toBeVisible();
    const accountId = (await getIdByRegexp(this.accountItemRegExp(), index)).replace(
      this.accountItemId,
      "",
    );
    await detoxExpect(this.accountItemName(accountId)).toHaveText(currencyName);
    return accountId;
  }

  @Step("Close add account success screen")
  async tapCloseAddAccountCta() {
    await waitForElementById(this.closeAddAccountButtonId);
    await tapById(this.closeAddAccountButtonId);
  }

  @Step("Add only discovered account at index")
  async addAccountAtIndex(currencyName: string, currencyId: string, index: number = 0) {
    await this.waitAccountsDiscovery();
    const accountCount = await countElementsById(this.accountItemRegExp());
    if (accountCount > 1) {
      await tapById(this.deselectAllButtonId);
    }
    await tapById(this.accountItemRegExp(), 0);
    const accountId = await this.expectAccountDiscovery(currencyName, currencyId, index);
    await this.finishAccountsDiscovery();
    return accountId;
  }

  @Step("Click on 'Add funds to my account' button")
  async tapAddFunds() {
    await tapById(this.addFundsButtonId);
  }

  @Step("Click on 'Receive' in action drawer")
  async tapReceiveActionDrawer() {
    await tapById(this.actionDrawerReceiveButtonId);
  }

  @Step("Tap on (Add new or existing account) button")
  async tapAddNewOrExistingAccountButton() {
    if (!(await IsIdVisible(this.addNewOrExistingAccount))) {
      await scrollToId(this.addNewOrExistingAccount, undefined, 400);
    }
    await tapById(this.addNewOrExistingAccount);
  }
}
