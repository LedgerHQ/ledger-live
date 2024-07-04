import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Account } from "../../enum/Account";
import { addTmsLink } from "tests/fixtures/common";

const accounts: Account[] = [
  Account.BTC_1,
  Account.ETH_1,
  Account.SOL_1,
  Account.TRX_1,
  Account.DOT_1,
  Account.XRP_1,
  Account.ADA_1,
  Account.ALGO_1,
  Account.XLM_1,
  Account.BCH_1,
  Account.ATOM_1,
  Account.XTZ_1,
];

for (const [i, account] of accounts.entries()) {
  test.describe("Delete Accounts", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `deleteAccount_${account.currency.uiName}`,
      speculosCurrency: specs[account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${account.currency.uiName}] Delete Account`, async ({ app }) => {
      addTmsLink(["B2CQA-320"]);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.deleteAccount();
      await app.accounts.expectAccountAbsence(account.accountName);
    });
  });
}
