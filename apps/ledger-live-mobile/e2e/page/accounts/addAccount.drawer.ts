import { expect } from "detox";
import {
  getElementById,
  getIdOfElement,
  openDeeplink,
  scrollToId,
  tapById,
  waitForElementById,
} from "../../helpers";
import { getEnv } from "@ledgerhq/live-env";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

const baseLink = "add-account";
const isMock = getEnv("MOCK");

export default class AddAccountDrawer {
  deselectAllButtonId = "add-accounts-deselect-all";
  accountCardRegExp = (id = ".*") => new RegExp(`account-card-${id}`);
  accountCard = (id: string) => getElementById(this.accountCardRegExp(id));
  accountId = (currency: string, index: number) =>
    isMock ? `mock:1:${currency}:MOCK_${currency}_${index}:` : `js:2:${currency}:.*`;
  accountTitleId = (accountName: string, index: number) =>
    getElementById(`test-id-account-${accountName}`, index);
  modalButtonId = "add-accounts-modal-add-button";
  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  continueButtonId = "add-accounts-continue-button";
  succesCtaId = "add-accounts-success-cta";
  accountItemId = "account-item-";
  accountItemRegExp = (id = ".*") => new RegExp(`${this.accountItemId}${id}`);
  accountItem = (id: string) => getElementById(this.accountItemRegExp(id));
  accountItemTitleId = (accountName: string, index: number) =>
    getElementById(`account-item-${accountName}-name`, index);
  closeAddAccountButtonId = "button-close-add-account";

  @Step("Open add account via deeplink")
  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  @Step("Click on 'Import with your Ledger' button")
  async importWithYourLedger() {
    await waitForElementById(this.modalButtonId);
    await tapById(this.modalButtonId);
  }

  @Step("Select currency")
  async selectCurrency(currencyId: string) {
    const id = this.currencyRow(currencyId);
    await scrollToId(id);
    await tapById(id);
  }

  @Step("Wait for accounts discovery")
  async waitAccountsDiscovery() {
    await waitForElementById(this.continueButtonId, 240000);
  }

  @Step("Expect account discovered")
  async expectAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    const accountName = `${currencyName} ${index + 1}`;
    await expect(this.accountCard(this.accountId(currencyId, index))).toBeVisible();
    await expect(this.accountTitleId(accountName, index)).toHaveText(accountName);
  }

  @Step("Finish account discovery")
  async finishAccountsDiscovery() {
    await tapById(this.continueButtonId);
  }

  @Step("Close add account success screen")
  async tapSuccessCta() {
    await waitForElementById(this.succesCtaId);
    await tapById(this.succesCtaId);
  }

  @Step("Add only first discovered account")
  async addFirstAccount(currency: Currency) {
    await this.waitAccountsDiscovery();
    await this.expectAccountDiscovery(currency.name, currency.currencyId);
    await tapById(this.deselectAllButtonId);
    await tapById(this.accountCardRegExp(), 0);
    const accountId = (await getIdOfElement(this.accountCardRegExp(), 0)).replace(
      /^account-card-/,
      "",
    );
    await this.finishAccountsDiscovery();
    await this.tapSuccessCta();
    return accountId;
  }

  @Step("Expect account discovered")
  async expectNetworkBasedAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    const accountName = `${currencyName} ${index + 1}`;
    await expect(this.accountItem(this.accountId(currencyId, index))).toBeVisible();
    const accountId = (await getIdOfElement(this.accountItemRegExp(), 0)).replace(
      this.accountItemId,
      "",
    );
    await expect(this.accountItemTitleId(accountId, index)).toHaveText(accountName);
    return accountId;
  }

  @Step("Close add account success screen")
  async tapCloseAddAccountCta() {
    await waitForElementById(this.closeAddAccountButtonId);
    await tapById(this.closeAddAccountButtonId);
  }

  @Step("Add only first discovered account")
  async addNetworkBasedFirstAccount(currency: Currency) {
    await this.waitAccountsDiscovery();
    const accountId = await this.expectNetworkBasedAccountDiscovery(
      currency.name,
      currency.currencyId,
    );
    await tapById(this.deselectAllButtonId);
    await tapById(this.accountItemRegExp(accountId));
    await this.finishAccountsDiscovery();
    await this.tapCloseAddAccountCta();
    return accountId;
  }
}
