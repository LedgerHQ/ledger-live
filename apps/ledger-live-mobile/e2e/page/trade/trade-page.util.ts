export class TradePageUtil {
  accountId = (t: string) => `test-id-account-${t}`;

  static async selectAccount(account: string) {
    const CurrencyRowId = `test-id-account-${account}`;
    await scrollToId(CurrencyRowId);
    await waitForElementById(CurrencyRowId);
    await tapById(CurrencyRowId);
  }
}
