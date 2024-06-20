import test from "../../../fixtures/common";
import { Token } from "../../../enum/Tokens";
import { specs } from "../../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const tokens: Token[] = [
  Token.ETH_USDT,
  Token.XLM_USCD,
  Token.ALGO_USDT,
  Token.TRON_BTTOLD,
  Token.BSC_BUSD,
  Token.MATIC_DAI,
];

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
      await app.account.expectTokenToBePresent(token.tokenName, token.tokenTicker);
    });
  });
}
