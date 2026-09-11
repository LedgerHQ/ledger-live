import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import CommonPage from "@e2e/page/common.page";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { isAggregatedAssetsEnabled } from "@e2e/utils/featureFlagUtils";

export default class AccountsPage extends CommonPage {
  private readonly baseLink = "accounts";
  private readonly listTitle = "accounts-list-title";
  private readonly cryptoAddressesListId = "CryptoAddressesList";

  emptyAccountDisplay = () => getElementById("empty-accounts-component");

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    if (await isAggregatedAssetsEnabled()) {
      await openDeeplink("crypto-addresses");
      await waitForElementById(this.cryptoAddressesListId);
    } else {
      await openDeeplink(this.baseLink);
    }
  }

  @Step("Wait for accounts page to load")
  async waitForAccountsPageToLoad() {
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById(this.cryptoAddressesListId);
    } else {
      await waitForElementById(this.listTitle);
    }
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
    if (await isAggregatedAssetsEnabled()) {
      await waitForElementById("crypto-addresses-empty-state");
    } else {
      const el = this.emptyAccountDisplay();
      await detoxExpect(el).toBeVisible();
    }
  }
}
