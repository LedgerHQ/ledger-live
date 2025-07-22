import { openDeeplink } from "../../helpers/commonHelpers";
import CommonPage from "../common.page";

export default class AccountsPage extends CommonPage {
  private baseLink = "accounts";
  private listTitle = "accounts-list-title";
  private accountItemContainerRegExp = new RegExp("account-item-container-.*");

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
    const accountItemElements = getElementsById(this.accountItemContainerRegExp);
    const attrs = await accountItemElements.getAttributes();
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
