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
  async expectAccountsNumber(expected: number) {
    const listEl = getElementsById(this.accountItemRegExp());
    const attrs = await listEl.getAttributes();
    if ("elements" in attrs) {
      // Count unique account names to handle duplicates in view hierarchy
      const uniqueLabels = new Set();
      attrs.elements.forEach((element: { label?: string }) => {
        if (element.label) {
          // Extract the account name from the label (before the address part)
          const accountName = element.label.split(" ")[0] + " " + element.label.split(" ")[1];
          uniqueLabels.add(accountName);
        }
      });

      jestExpect(uniqueLabels.size).toBe(expected);
    } else {
      jestExpect(1).toBe(expected);
    }
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    const el = this.emptyAccountDisplay();
    await detoxExpect(el).toBeVisible();
  }
}
