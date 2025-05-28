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
      jestExpect(attrs.elements.length).toBe(expected);
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
