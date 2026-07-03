import { getByTestId, getByTestIdMatching } from "../components/appiumSelector.ts";
import { step } from "@wdio/allure-reporter";
import type { ChainablePromiseElement } from "webdriverio";

type AccountListItem = WebdriverIO.Element | ChainablePromiseElement;

export class AddAccountPage {
  private readonly accountItemId = "account-item-";

  get deselectAllButton() {
    return getByTestId("add-accounts-deselect-all");
  }

  get continueButton() {
    return getByTestId("enabled-add-accounts-continue-button");
  }

  accountItemRegExp(id = ".*(?<!-name)$") {
    return getByTestIdMatching(new RegExp(`${this.accountItemId}${id}`));
  }

  private accountItemsSelector() {
    const regex = new RegExp(`${this.accountItemId}.*(?<!-name)$`);
    return driver.isAndroid
      ? `android=new UiSelector().resourceIdMatches("${regex.source}")`
      : `-ios predicate string:name MATCHES "${regex.source}"`;
  }

  accountItemName(accountId: string) {
    return getByTestId(`${this.accountItemId}${accountId}-name`);
  }

  private async accountIdFromElement(element: AccountListItem) {
    const idAttribute = driver.isAndroid ? "resource-id" : "name";
    const rawId = await (element as WebdriverIO.Element).getAttribute(idAttribute);
    const accountId = rawId?.replace(this.accountItemId, "") ?? "";
    if (!accountId || accountId.endsWith("-name")) {
      throw new Error(`Invalid account id resolved from element: ${rawId}`);
    }
    return accountId;
  }

  async waitAccountsDiscovery() {
    await step("Wait for accounts discovery", async () => {
      const DISCOVERY_TIMEOUT = 240_000;
      await driver.waitUntil(async () => this.continueButton.isDisplayed(), {
        timeout: DISCOVERY_TIMEOUT,
        timeoutMsg: `Account discovery timed out after ${DISCOVERY_TIMEOUT / 1000} seconds`,
      });
    });
  }

  async finishAccountsDiscovery() {
    await step("Finish account discovery", async () => {
      await this.continueButton.click();
      await this.continueButton.waitForDisplayed({ reverse: true });
    });
  }

  async expectAccountDiscovery(
    currencyName: string,
    currencyId: string,
    selectedAccount: AccountListItem,
  ) {
    return await step(`Expect account discovered: ${currencyName}`, async () => {
      const currencyAccountItem = this.accountItemRegExp(`js:2:${currencyId}:.*(?<!-name)$`);
      await expect(currencyAccountItem).toBeDisplayed();

      const accountId = await this.accountIdFromElement(selectedAccount);
      await expect(this.accountItemName(accountId)).toHaveText(currencyName);
      return accountId;
    });
  }

  async addAccountAtIndex(currencyName: string, currencyId: string, index = 0) {
    await step(`Add account at index ${index}: ${currencyName}`, async () => {
      await this.waitAccountsDiscovery();

      const accountItems = await $$(this.accountItemsSelector());
      if ((await accountItems.length) > 1) {
        await this.deselectAllButton.click();
      }

      const selectedAccount = accountItems[index];
      await selectedAccount.click();
      await this.expectAccountDiscovery(currencyName, currencyId, selectedAccount);
      await this.finishAccountsDiscovery();
    });
  }
}
