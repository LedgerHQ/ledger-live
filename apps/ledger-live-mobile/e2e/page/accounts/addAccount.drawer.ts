import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";

export default class AddAccountDrawer extends CommonPage {
  baseLink = "add-account";
  deselectAllButtonId = "add-accounts-deselect-all";
  accountId = (currency: string, index: number) => `mock:1:${currency}:MOCK_${currency}_${index}:`;
  modalButtonId = "add-accounts-modal-add-button";
  continueButtonId = "add-accounts-continue-button";
  closeAddAccountButtonId = "button-close-add-account";
  addFundsButtonId = "button-add-funds";
  actionDrawerReceiveButtonId = "action-drawer-receive-button";

  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  async importWithYourLedger() {
    await waitForElementById(this.modalButtonId);
    await tapById(this.modalButtonId);
  }

  async waitAccountsDiscovery() {
    await waitForElementById(this.continueButtonId, 240000);
  }

  async finishAccountsDiscovery() {
    await tapById(this.continueButtonId);
  }

  async expectAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    const accountName = `${currencyName} ${index + 1}`;
    await expect(this.accountItem(this.accountId(currencyId, index))).toBeVisible();
    const accountId = (await getIdByRegexp(this.accountItemRegExp(), index)).replace(
      this.accountItemId,
      "",
    );
    await expect(this.accountItemName(accountId)).toHaveText(accountName);
    return accountId;
  }

  async tapCloseAddAccountCta() {
    await waitForElementById(this.closeAddAccountButtonId);
    await tapById(this.closeAddAccountButtonId);
  }

  async addAccountAtIndex(currencyName: string, currencyId: string, index: number) {
    await this.waitAccountsDiscovery();
    const accountId = await this.expectAccountDiscovery(currencyName, currencyId, index);
    await tapById(this.deselectAllButtonId);
    await tapById(this.accountItemRegExp(accountId));
    await this.finishAccountsDiscovery();
    return accountId;
  }

  async tapAddFunds() {
    await tapById(this.addFundsButtonId);
  }

  async tapReceiveinActionDrawer() {
    await tapById(this.actionDrawerReceiveButtonId);
  }
}
