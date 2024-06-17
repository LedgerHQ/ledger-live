import test from "../../../fixtures/common";
import { Token } from "../../../enum/Tokens";
import { specs } from "../../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const tokens: Token[] = [
  Token.ETH_USDT,
  Token.XLM_USCD,
  Token.ALGO_USDT,
  Token.TRON_WINK,
  Token.BNB_BUSD,
  Token.MATIC_DAI,
];

for (const [i, token] of tokens.entries()) {
  test.describe.parallel("Sub Account @smoke", () => {
    test.use({
      userdata: "speculos-subAccount", //todo: changer
      testName: `subAccount_${token.account.currency.uiName}`,
      speculosCurrency: specs[token.account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`[${token.account.currency.uiName}] Sub Account`, async ({ page }) => {
      addTmsLink(["B2CQA-1425"]);

      const app = new Application(page);

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(token.account.accountName);
      await app.account.expectTokenToBePresent(token.tokenName, token.tokenTicker);
    });
  });
}
