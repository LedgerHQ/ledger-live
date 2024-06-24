import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";
import { Token } from "../../enum/Tokens";

const tokens: Token[] = [Token.ETH_USDT];

for (const [i, token] of tokens.entries()) {
  test.describe.parallel("ERC20 token", () => {
    test.use({
      userdata: "speculos-tests-app",
      testName: "tokenERC20",
      speculosCurrency: specs[token.parentAccount.currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });

    test(`Check ERC20 token`, async ({ page }) => {
      addTmsLink(["B2CQA-1079"]);

      const app = new Application(page);

      await app.layout.goToPortfolio();
      await app.portfolio.navigateToAsset(token.tokenName);
      await app.account.navigateToToken(token);
      await app.account.expectLastOperationsVisibility();
    });
  });
}
