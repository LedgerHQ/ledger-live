import { log } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";

export default class AccountsPage extends CommonPage {
  private readonly baseLink = "accounts";
  private readonly listTitle = "accounts-list-title";

  emptyAccountDisplay = () => getElementById("empty-accounts-component");
  accountByName = (name: string) => `account-row-name-${name}`;

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }

  @Step("Wait for accounts page to load")
  async waitForAccountsPageToLoad() {
    await waitForElementById(this.listTitle);
  }

  @Step("Expect accounts number")
  async expectAccountsNumber(expectedAccountCount: number, testDataJson?: string) {
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
      await waitForElementById(`account-item-${accountId}-name`);
      foundAccounts++;
    }
    jestExpect(foundAccounts).toBe(expectedAccountCount);
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    const el = this.emptyAccountDisplay();
    await detoxExpect(el).toBeVisible();
  }

  @Step("Select account by name")
  async selectAccountByName(name: string) {
    await tapById(this.accountByName(name));
  }
}
