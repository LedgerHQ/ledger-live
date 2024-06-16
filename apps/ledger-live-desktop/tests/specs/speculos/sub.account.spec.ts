import test from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const accounts: Account[] = [
  Account.ETH_1,
  //Account.TRX_1,
  //Account.ALGO_1,
  //Account.MATIC_1,
  //Account.BNB_1,
];

for (const [i, account] of accounts.entries()) {
  test.describe.parallel("Sub Account @smoke", () => {
    test.use({
      userdata: "speculos-tests-app", //todo: changer
      testName: `subAccount_${account.currency.uiName}`,
      speculosCurrency: specs[account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${account.currency.uiName}] Sub Account`, async ({ page }) => {
      addTmsLink(["B2CQA-1425"]);

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectTokenToBeVisible();
      //CHECK TOKEN DISPLAYED ON PARENT ACCOUNT
    });
  });
}
