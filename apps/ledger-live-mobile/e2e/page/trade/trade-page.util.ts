import { delay } from "../../helpers/commonHelpers";

export class TradePageUtil {
  accountId = (t: string) => `test-id-account-${t}`;

  static async selectAccount(account: string) {
    const accountRowId = `test-id-account-${account}`;
    const accountListId = "account-list";

    await waitForElementById(accountListId);
    await delay(500);

    // Check if account is already visible
    const isVisible = await IsIdVisible(accountRowId);

    if (!isVisible) {
      await getElementById(accountListId).scroll(50, "down");
    }

    await scrollToId(accountRowId, accountListId);
    await tapById(accountRowId);
  }
}
