import { openDeeplink, tapById, waitForElementById } from "../../helpers";

export default class AddAccountDrawer {
  async openViaDeeplink() {
    await openDeeplink("add-account");
  }

  async importWithYourLedger() {
    const id = "add-accounts-modal-add-button";
    await waitForElementById(id);
    await tapById(id);
  }

  async selectCurrency(currencyId: string) {
    const id = "currency-row-" + currencyId;
    await waitForElementById(id);
    await tapById(id);
  }

  async startAccountsDiscovery() {
    await waitForElementById("add-accounts-continue-button");
  }

  async finishAccountsDiscovery() {
    await waitForElementById("add-accounts-continue-button");
    await tapById("add-accounts-continue-button");
  }

  async tapSuccessCta() {
    await waitForElementById("add-accounts-success-cta");
    await tapById("add-accounts-success-cta");
  }
}
