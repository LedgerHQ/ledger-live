import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Account } from "../../enum/Account";
import { Application } from "tests/page";

const accounts: Account[] = [
  Account.BTC_1,
  Account.tBTC_1,
  Account.ETH_1,
  Account.tETH_1,
  Account.sep_ETH_1,
  Account.SOL_1,
  Account.TRX_1,
  Account.DOT_1,
  Account.XRP_1,
];

for (const [i, account] of accounts.entries()) {
  test.describe.parallel("Accounts @smoke", () => {
    test.use({
      userdata: "speculos",
      testName: `deleteAccount_${account.currency.uiName}`,
      speculosCurrency: specs[account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    //@TmsLink("B2CQA-320")

    test(`[${account.currency.uiName}] Receive`, async ({ page }) => {
      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.deleteAccount();
      await app.accounts.expectAccountAbsence(account.accountName);
    });
  });
}
