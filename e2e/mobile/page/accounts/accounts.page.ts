import { expect } from "detox";
import { openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";

export default class AccountsPage extends CommonPage {
  private baseLink = "accounts";
  private listTitle = "accounts-list-title";

  // getter for the "no accounts" component
  private async emptyAccountDisplay() {
    return await getElementById("empty-accounts-component");
  }

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
    // accountItemRegExp() comes from CommonPage
    const listEl = await getElementsById(this.accountItemRegExp());
    const attrs = await listEl.getAttributes();
    if ("elements" in attrs) {
      jestExpect(attrs.elements.length).toBe(expected);
    } else {
      // single-element case
      jestExpect(1).toBe(expected);
    }
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    const el = await this.emptyAccountDisplay();
    await expect(el).toBeVisible();
  }
}
