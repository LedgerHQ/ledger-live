import { openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";
import { retryUntilTimeout } from "../../utils/retry";

export default class AddAccountDrawer extends CommonPage {
  baseLink = "add-account";
  deselectAllButtonId = "add-accounts-deselect-all";
  modalButtonId = "add-accounts-modal-add-button";
  continueButtonId = "add-accounts-continue-button";
  closeAddAccountButtonId = "button-close-add-account";
  addFundsButtonId = "button-add-funds";
  actionDrawerReceiveButtonId = "action-drawer-receive-button";

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
    await waitForElementById(this.continueButtonId, 240000);
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
    const accountName = `${currencyName} ${index + 1}`;
    await detoxExpect(this.accountItem(this.accountIdAccountDrawer(currencyId))).toBeVisible();
    const accountId = (await getIdByRegexp(this.accountItemRegExp(), index)).replace(
      this.accountItemId,
      "",
    );
    await detoxExpect(this.accountItemName(accountId)).toHaveText(accountName);
    return accountId;
  }

  @Step("Close add account success screen")
  async tapCloseAddAccountCta() {
    await waitForElementById(this.closeAddAccountButtonId);
    await tapById(this.closeAddAccountButtonId);
  }

  @Step("Add only discovered account at index")
  async addAccountAtIndex(currencyName: string, currencyId: string, index: number) {
    await this.waitAccountsDiscovery();
    const accountId = await this.expectAccountDiscovery(currencyName, currencyId, index);
    await tapById(this.deselectAllButtonId);
    await tapById(this.accountItemRegExp(accountId));
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
}
