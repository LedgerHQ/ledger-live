export class TradePageUtil {
  accountId = (t: string) => `test-id-account-${t}`;

  static async selectAccount(account: string) {
    const CurrencyRowId = `test-id-account-${account}`;
    const AccountListId = "account-list";
    await scrollToId(CurrencyRowId, AccountListId);

    // account row may be partially hidden by the bottom bar
    await getElementById(AccountListId).scroll(25, "down");
    await waitForElementById(CurrencyRowId);
    await tapById(CurrencyRowId);
  }
}
