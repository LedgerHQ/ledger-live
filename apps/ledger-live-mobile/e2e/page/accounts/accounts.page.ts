import { openDeeplink } from "../../helpers/commonHelpers";

export default class AccountsPage {
  baseLink = "accounts";
  accountTitleId = (coin: string) => `accounts-title-${coin}`;
  addAccountButton = () => getElementById("add-account-button");
  listTitle = "accounts-list-title";
  accountList = /accounts-list-.*/;

  @Step("Open accounts list via deeplink")
  async openViaDeeplink() {
    await openDeeplink(this.baseLink);
  }
  async waitForAccountsPageToLoad() {
    await waitForElementById(this.listTitle);
  }
  async waitForAccountsCoinPageToLoad(coin: string) {
    await waitForElementById(this.accountTitleId(coin));
  }

  async addAccount() {
    await tapByElement(this.addAccountButton());
  }

  @Step("Expect accounts number")
  async expectAccountsNumber(number: number) {
    jestExpect((await getIdOfElement(this.accountList)).endsWith(number.toString())).toBeTruthy();
  }
}
