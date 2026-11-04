import { Step } from "jest-allure2-reporter/api";
import { log } from "detox";
import { openDeeplink } from "@e2e/helpers/commonHelpers";
import { byId } from "@e2e/helpers/elements/native";
import CommonPage from "@e2e/page/common.page";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { isAggregatedAssetsEnabled } from "@e2e/utils/featureFlagUtils";

export default class AccountsPage extends CommonPage {
  private readonly baseLink = "accounts";
  private readonly listTitle = byId("accounts-list-title");
  private readonly cryptoAddressesList = byId("CryptoAddressesList");
  private readonly cryptoAddressesEmptyState = byId("crypto-addresses-empty-state");
  private readonly emptyAccountDisplay = byId("empty-accounts-component");
  private readonly accountRowName = (accountId: string) =>
    byId(`${this.accountItemId}${accountId}-name`);

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    if (await isAggregatedAssetsEnabled()) {
      await openDeeplink("crypto-addresses");
      await this.cryptoAddressesList.waitVisible();
    } else {
      await openDeeplink(this.baseLink);
    }
  }

  @Step("Wait for accounts page to load")
  async waitForAccountsPageToLoad() {
    if (await isAggregatedAssetsEnabled()) {
      await this.cryptoAddressesList.waitVisible();
    } else {
      await this.listTitle.waitVisible();
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
      await this.accountRowName(accountId).waitVisible();
      foundAccounts++;
    }
    jestExpect(foundAccounts).toBe(expectedAccountCount);
  }

  @Step("Expect account {{{0}}} to be absent from the list")
  async expectAccountAbsence(accountId: string) {
    await this.accountRowName(accountId).waitNotVisible();
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    if (await isAggregatedAssetsEnabled()) {
      await this.cryptoAddressesEmptyState.waitVisible();
    } else {
      await this.emptyAccountDisplay.expectVisible();
    }
  }
}
