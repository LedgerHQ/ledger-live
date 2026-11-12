import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import CommonPage from "@e2e/page/common.page";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";

export default class AccountsPage extends CommonPage {
  private readonly cryptoAddressesEmptyState = byId("crypto-addresses-empty-state");

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink("crypto-addresses");
    await this.cryptoAddressesList.waitVisible();
  }

  @Step("Wait for accounts page to load")
  async waitForAccountsPageToLoad() {
    await this.cryptoAddressesList.waitVisible();
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
      await this.accountItemName(accountId).waitVisible();
      foundAccounts++;
    }
    jestExpect(foundAccounts).toBe(expectedAccountCount);
  }

  @Step("Expect account {{{0}}} to be absent from the list")
  async expectAccountAbsence(accountId: string) {
    await this.accountItemName(accountId).waitNotVisible();
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    await this.cryptoAddressesEmptyState.waitVisible();
  }
}
