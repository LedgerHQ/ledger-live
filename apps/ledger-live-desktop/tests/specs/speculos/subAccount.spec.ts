import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const subAccounts: Account[] = [
  Account.ETH_USDT,
  Account.XLM_USCD,
  Account.ALGO_USDT_1,
  Account.TRX_USDT,
  Account.BSC_BUSD,
  Account.MATIC_DAI,
];

const subAccountReceive: Account[] = [
  Account.ETH_USDT,
  Account.ETH_LIDO,
  Account.TRX_USDT,
  Account.TRX_BTT,
  Account.BSC_BUSD,
  Account.BSC_SHIBA,
  Account.MATIC_DAI,
  Account.MATIC_UNI,
];

for (const token of subAccounts) {
  test.describe("Add subAccount without parent", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosCurrency: token.currency,
    });

    test(
      `Add Sub Account without parent (${token.currency.deviceLabel}) - ${token.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-2448, B2CQA-1079",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.portfolio.openAddAccountModal();
        await app.addAccount.expectModalVisiblity();

        await app.addAccount.selectToken(token);
        await app.addAccount.addAccounts();

        await app.addAccount.done();
        await app.layout.goToPortfolio();
        await app.portfolio.navigateToAsset(token.currency.name);
        await app.account.navigateToToken(token);
        await app.account.expectLastOperationsVisibility();
        await app.account.expectTokenAccount(token);
      },
    );
  });
}

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const token of subAccountReceive) {
  test.describe("Add subAccount when parent exists", () => {
    test.use({
      userdata: "speculos-subAccount",
      speculosCurrency: token.currency,
    });

    test(
      `[${token.currency.deviceLabel}] Add subAccount when parent exists (${token.currency.ticker})`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-640",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.accountName);
        await app.account.expectAccountVisibility(token.accountName);

        await app.account.clickAddToken();
        await app.receive.selectToken(token);

        await app.modal.continue();
        await app.receive.expectValidReceiveAddress(token.address);

        await app.speculos.expectValidReceiveAddress(token);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

for (const token of subAccounts) {
  test.describe("Token visible in parent account", () => {
    test.use({
      userdata: "speculos-subAccount",
      speculosCurrency: token.currency,
    });

    test(
      `Token visible in parent account (${token.currency.deviceLabel}) - ${token.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-1425",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.accountName);
        await app.account.expectTokenToBePresent(token);
      },
    );
  });
}
