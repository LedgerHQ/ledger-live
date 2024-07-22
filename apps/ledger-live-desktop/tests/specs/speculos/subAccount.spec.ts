import { test } from "../../fixtures/common";
import { Token } from "../../enum/Tokens";
import { specs } from "../../utils/speculos";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const tokens: Token[] = [
  Token.ETH_USDT,
  Token.XLM_USCD,
  Token.ALGO_USDT,
  Token.TRON_USDT,
  Token.BSC_BUSD,
  Token.MATIC_DAI,
];

const tokensReceive: Token[] = [
  Token.ETH_USDT,
  Token.ETH_LIDO,
  Token.TRON_USDT,
  Token.TRON_BTT,
  Token.BSC_BUSD,
  Token.BSC_SHIBA,
  Token.MATIC_DAI,
  Token.MATIC_UNI,
];

for (const [i, token] of tokens.entries()) {
  test.describe("Add subAccount without parent", () => {
    test.use({
      userdata: "skip-onboarding",
      testName: `add subAccount without parent (${token.tokenName})`,
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `Add Sub Account without parent (${token.parentAccount.currency.uiName})`,
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
        await app.portfolio.navigateToAsset(token.tokenName);
        await app.account.navigateToToken(token);
        await app.account.expectLastOperationsVisibility();
        await app.account.expectTokenAccount(token);
      },
    );
  });
}

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const [i, token] of tokensReceive.entries()) {
  test.describe("Add subAccount when parent exists", () => {
    test.use({
      userdata: "speculos-subAccount",
      testName: `Add subAccount when parent exists (${token.tokenName})`,
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `[${token.tokenName}] Add subAccount when parent exists (${token.tokenNetwork})`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-640",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.parentAccount.accountName);
        await app.account.expectAccountVisibility(token.parentAccount.accountName);

        await app.account.clickAddToken();
        await app.receive.selectToken(token);

        await app.modal.continue();
        await app.receive.expectValidReceiveAddress(token.parentAccount.address);

        await app.speculos.expectValidReceiveAddress(token.parentAccount);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

for (const [i, token] of tokens.entries()) {
  test.describe("Token visible in parent account", () => {
    test.use({
      userdata: "speculos-subAccount",
      testName: `Token visible in parent account (${token.parentAccount.currency.uiName})`,
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(
      `Token visible in parent account (${token.parentAccount.currency.uiName})`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-1425",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(token.parentAccount.accountName);
        await app.account.expectTokenToBePresent(token);
      },
    );
  });
}
