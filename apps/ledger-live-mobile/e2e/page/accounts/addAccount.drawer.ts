import { expect } from "detox";
import {
  getElementById,
  openDeeplink,
  scrollToId,
  tapById,
  waitForElementById,
} from "../../helpers";
import { getEnv } from "@ledgerhq/live-env";

const baseLink = "add-account";
const isMock = getEnv("MOCK");

export default class AddAccountDrawer {
  accountCardId = (id: string | RegExp) => getElementById(new RegExp(`account-card-${id}`));
  accountId = (currency: string, index: number) =>
    isMock ? `mock:1:${currency}:MOCK_${currency}_${index}:` : `js:2:${currency}:.*`;
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
    await scrollToId(id);
    await tapById(id);
  }

  async startAccountsDiscovery() {
    await waitForElementById(this.continueButtonId, 120000);
  }

  async expectAccountDiscovery(currencyName: string, currencyId: string, index = 0) {
    const accountName = `${currencyName} ${index + 1}`;
    await expect(this.accountCardId(this.accountId(currencyId, index))).toBeVisible();
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
