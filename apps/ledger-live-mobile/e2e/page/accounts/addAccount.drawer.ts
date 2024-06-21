import { expect } from "detox";
import { getElementById, openDeeplink, tapById, waitForElementById } from "../../helpers";
import { capitalize } from "../../models/currencies";

const baseLink = "add-account";

export default class AddAccountDrawer {
  accountCardId = (id: string) => getElementById(`account-card-${id}`);
  accountId = (currency: string, index: number) => `mock:1:${currency}:MOCK_${currency}_${index}:`;
  accountTitleId = (accountName: string) => getElementById(`test-id-account-${accountName}`);
  modalButtonId = "add-accounts-modal-add-button";
  currencyRow = (currencyId: string) => `currency-row-${currencyId}`;
  continueButtonId = "add-accounts-continue-button";
  succesCtaId = "add-accounts-success-cta";

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }

  async importWithYourLedger() {
    await waitForElementById(this.modalButtonId);
    await tapById(this.modalButtonId);
  }

  async selectCurrency(currencyId: string) {
    const id = this.currencyRow(currencyId);
    await waitForElementById(id);
    await tapById(id);
  }

  async startAccountsDiscovery() {
    await waitForElementById(this.continueButtonId);
  }

  async expectAccountDiscovery(currency: string, index: number) {
    const accountName = `${capitalize(currency)} ${index + 1}`;
    await expect(this.accountCardId(this.accountId(currency, index))).toBeVisible();
    await expect(this.accountTitleId(accountName)).toHaveText(accountName);
  }

  async finishAccountsDiscovery() {
    await waitForElementById(this.continueButtonId);
    await tapById(this.continueButtonId);
  }

  async tapSuccessCta() {
    await waitForElementById(this.succesCtaId);
    await tapById(this.succesCtaId);
  }
}
