import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import CommonPage from "@e2e/page/common.page";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";

export default class AccountsPage extends CommonPage {
  private readonly cryptoAddressesListId = "CryptoAddressesList";

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink("crypto-addresses");
    await waitForElementById(this.cryptoAddressesListId);
  }

  @Step("Wait for accounts page to load")
  async waitForAccountsPageToLoad() {
    await waitForElementById(this.cryptoAddressesListId);
  }

  @Step("Expect accounts number {{{0}}}")
  async expectAccountsNumber(expectedAccountCount: number, testDataJson?: string) {
    let expectedAccountIds: string[] = [];

    if (testDataJson) {
      try {
        const testData = JSON.parse(testDataJson);
        expectedAccountIds = testData.accounts.map((account: { id: string }) => account.id);
      } catch (error) {
        log.error("Failed to parse test data JSON:", sanitizeError(error));
      }
    }

    let foundAccounts = 0;
    for (const accountId of expectedAccountIds) {
      await waitForElementById(`account-item-${accountId}-name`);
      foundAccounts++;
    }
    jestExpect(foundAccounts).toBe(expectedAccountCount);
  }

  @Step("Expect account {{{0}}} to be absent from the list")
  async expectAccountAbsence(accountId: string) {
    await waitForElementNotVisible(`${this.accountItemId + accountId}-name`);
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    await waitForElementById("crypto-addresses-empty-state");
  }
}
