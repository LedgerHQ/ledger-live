import test from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { specs } from "../../utils/speculos";
import { addTmsLink } from "tests/fixtures/common";

const accounts: Account[] = [
  // Derivation path is updated when account receive money
  Account.BTC_1,
  Account.ETH_1,
  Account.SOL_1,
  Account.TRX_1,
  Account.DOT_1,
  Account.XRP_1,
  Account.BCH_1,
  Account.ATOM_1,
  Account.XTZ_1,
];

//Reactivate test after fixing the GetAppAndVersion issue - Jira: LIVE-12581
for (const [i, account] of accounts.entries()) {
  test.describe.skip("Receive", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: `receiveSpeculos_${account.currency.uiName}`,
      speculosCurrency: specs[account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${account.currency.uiName}] Receive`, async ({ app }) => {
      addTmsLink(["B2CQA-249"]);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);

      await app.account.clickReceive();
      await app.modal.continue();
      await app.receive.expectValidReceiveAddress(account.address);

      await app.speculos.expectValidReceiveAddress(account);
      await app.receive.expectApproveLabel();
    });
  });
}
