import test from "../../../fixtures/common";
import { Token } from "../../../enum/Tokens";
import { specs } from "../../../utils/speculos";
import { Application } from "tests/page";
import { addTmsLink } from "tests/fixtures/common";

const tokens: Token[] = [
  Token.ETH_USDT,
  Token.ETH_LIDO,
  Token.TRON_USDT,
  Token.TRON_BTT,
  Token.BSC_BUSD,
  Token.BSC_SHIBA,
  Token.MATIC_DAI,
  Token.MATIC_UNI,
];

//Reactivate test after fixing the GetAppAndVersion issue - Jira: LIVE-12581
for (const [i, token] of tokens.entries()) {
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
