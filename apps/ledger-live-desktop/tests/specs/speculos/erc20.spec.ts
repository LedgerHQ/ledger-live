import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

test.use({
  userdata: "speculos-tests-app",
  testName: "tokenERC20",
  speculosCurrency: specs["Ethereum".replace(/ /g, "_")],
  speculosOffset: 0,
});
const token = "Tether USD";

test.describe.parallel("ERC20 token", () => {
  test(`Check ERC20 token`, async ({ page }) => {
    addTmsLink(["B2CQA-1079"]);

    const app = new Application(page);

    await app.layout.goToPortfolio();
    await app.portfolio.navigateToAsset(token);
    await app.account.navigateToToken(token);
    await app.account.expectLastOperationsVisibility();
  });
});
