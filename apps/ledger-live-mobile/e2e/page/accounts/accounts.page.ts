import { openDeeplink } from "../../helpers/commonHelpers";
import { expect } from "detox";
import CommonPage from "../common.page";

export default class AccountsPage extends CommonPage {
  baseLink = "accounts";
  listTitle = "accounts-list-title";
  emptyAccountDisplay = () => getElementById("empty-accounts-component");

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }
  async waitForAccountsPageToLoad() {
    await waitForElementById(this.listTitle);
  }

  @Step("Expect accounts number")
  async expectAccountsNumber(number: number) {
    const matchedElements = await getElementsById(this.accountItemRegExp()).getAttributes();
    console.warn("matchedElements", matchedElements);
    if ("elements" in matchedElements) jestExpect(matchedElements.elements.length).toBe(number);
    else jestExpect(1).toBe(number);
  }

  @Step("Expect no accounts screen")
  async expectNoAccount() {
    await expect(this.emptyAccountDisplay()).toBeVisible();
  }
}
