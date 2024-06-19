import test from "../../../fixtures/common";
import { Token } from "../../../enum/Tokens";
import { specs } from "../../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const tokens: Token[] = [
  Token.ETH_USDT,
  //Token.XLM_USCD, //TODO: Reactivate when Date.Parse issue is fixed - desactivate time machine for Speculos tests
  Token.ALGO_USDT,
  Token.TRON_WINK,
  Token.BSC_BUSD,
  Token.MATIC_DAI,
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
    });
  });
}
