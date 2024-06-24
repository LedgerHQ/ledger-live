import test from "../../fixtures/common";
import { Token } from "../../enum/Tokens";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const tokens: Token[] = [
  Token.ETH_USDT,
  //Token.XLM_USCD, //TODO: Reactivate when Date.Parse issue is fixed - desactivate time machine for Speculos tests
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
  test.describe.parallel("Sub Account @smoke", () => {
    test.use({
      userdata: "skip-onboarding",
      testName: `add subAccount_${token.tokenName}`,
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${token.parentAccount.currency.uiName}] Add Sub Account`, async ({ page }) => {
      addTmsLink(["B2CQA-640"]);

      const app = new Application(page);

      await app.portfolio.openAddAccountModal();
      await app.addAccount.expectModalVisiblity();

      await app.addAccount.selectToken(token);
      await app.addAccount.addAccounts();

      await app.addAccount.done();
      await app.layout.expectBalanceVisibility();
      await app.layout.goToPortfolio();
      await app.portfolio.navigateToAsset(token.tokenName);
      await app.account.navigateToToken(token);
      await app.account.expectLastOperationsVisibility();
    });
  });
}

//Reactivate test after fixing the GetAppAndVersion issue - Jira: LIVE-12581
for (const [i, token] of tokensReceive.entries()) {
  test.describe.skip("Receive @smoke", () => {
    test.use({
      userdata: "speculos-subAccount",
      testName: `receive subAccount_${token.tokenName}`,
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${token.tokenName}] Receive Sub Account (${token.tokenNetwork})`, async ({ page }) => {
      addTmsLink(["B2CQA-640"]); //TODO: create a new Jira Ticket for this scenario

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(token.parentAccount.accountName);
      await app.account.expectAccountVisibility(token.parentAccount.accountName);

      await app.account.clickAddToken();
      await app.receive.selectToken(token);

      await app.modal.continue();
      await app.receive.expectValidReceiveAddress(token.parentAccount.address);

      await app.speculos.expectValidReceiveAddress(token.parentAccount);
      await app.receive.expectApproveLabel();
    });
  });
}

for (const [i, token] of tokens.entries()) {
  test.describe.parallel("Sub Account @smoke", () => {
    test.use({
      userdata: "speculos-subAccount",
      testName: `subAccount_${token.parentAccount.currency.uiName}`,
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${token.parentAccount.currency.uiName}] Sub Account`, async ({ page }) => {
      addTmsLink(["B2CQA-1425"]);

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(token.parentAccount.accountName);
      await app.account.expectTokenToBePresent(token);
    });
  });
}
