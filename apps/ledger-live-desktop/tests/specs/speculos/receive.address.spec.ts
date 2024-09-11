import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

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
  Account.BSC_1,
];

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const account of accounts) {
  test.describe("Receive", () => {
    test.use({
      userdata: "speculos-tests-app",
      speculosApp: account.currency.speculosApp,
    });

    test(
      `[${account.currency.name}] Receive`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-249, B2CQA-651, B2CQA-652",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.accountName);
        await app.account.expectAccountVisibility(account.accountName);
        await app.account.clickReceive();
        switch (account) {
          case Account.TRX_1:
            await app.receive.verifySendCurrencyTokensWarningMessage(account, "TRC10/TRC20");
            break;
          case Account.ETH_1:
            await app.receive.verifySendCurrencyTokensWarningMessage(account, "Ethereum");
            break;
          case Account.BSC_1:
            await app.receive.verifySendCurrencyTokensWarningMessage(account, "BEP20");
            break;
        }
        await app.modal.continue();
        await app.receive.expectValidReceiveAddress(account.address);

        await app.speculos.expectValidReceiveAddress(account);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

test.describe("Receive", () => {
  const account = Account.TRX_2;
  test.use({
    userdata: "speculos-tests-app",
    speculosApp: account.currency.speculosApp,
  });
  test(
    `${account.currency.ticker} empty balance Receive displays address activation warning message`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-1551",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);
      await app.account.clickReceive();
      await app.modal.continue();
      await app.receive.verifyTronAddressActivationWarningMessage();
    },
  );
});
