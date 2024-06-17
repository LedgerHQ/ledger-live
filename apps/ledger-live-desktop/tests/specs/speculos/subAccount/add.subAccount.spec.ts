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
      userdata: "skip-onboarding",
      testName: `add subAccount_${token.tokenName}`,
      speculosCurrency: specs[token.account.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    //let firstAccountName = "NO ACCOUNT NAME YET";

    test(`[${token.account.currency.uiName}] Add Sub Account`, async ({ page }) => {
      addTmsLink(["B2CQA-640"]);

      const app = new Application(page);

      await app.portfolio.openAddAccountModal();
      await app.addAccount.expectModalVisiblity();
      await app.addAccount.selectCurrency(token.tokenTicker);
      //firstAccountName = await app.addAccount.getFirstAccountName();

      await app.addAccount.addAccounts();
      await app.addAccount.done();
      await app.layout.expectBalanceVisibility();
    });
  });
}
