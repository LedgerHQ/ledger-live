import { log } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";

export default class AccountsPage extends CommonPage {
  private baseLink = "accounts";
  private listTitle = "accounts-list-title";

  emptyAccountDisplay = () => getElementById("empty-accounts-component");

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Wait for accounts page to load")
  async waitForAccountsPageToLoad() {
    await waitForElementById(this.listTitle);
  }

  @Step("Expect accounts number")
  async expectAccountsNumber(expected: number, testDataJson?: string) {
    let expectedAccountIds: string[] = [];

    if (testDataJson) {
      try {
        const testData = JSON.parse(testDataJson);
        expectedAccountIds = testData.accounts.map((account: { id: string }) => account.id);
      } catch (error) {
        log.error("Failed to parse test data JSON:", error);
      }
    }

    let foundAccounts = 0;

    for (const accountId of expectedAccountIds) {
      const element = getElementById(`account-item-${accountId}`);
      await detoxExpect(element).toBeVisible();
      foundAccounts++;
    }
    jestExpect(foundAccounts).toBe(expected);
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    const el = this.emptyAccountDisplay();
    await detoxExpect(el).toBeVisible();
  }
}
