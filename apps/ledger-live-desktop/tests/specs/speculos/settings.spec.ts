import { test } from "../../fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { Account } from "tests/enum/Account";

test.describe("Settings", () => {
  test.use({
    userdata: "erc20-0-balance",
  });

  test(
    `ERC20 token with 0 balance is hidden if 'hide empty token accounts' is ON`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-817",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));
      await app.layout.goToAccounts();
      await app.accounts.showParentAccountTokens(Account.ETH_1.accountName);
      await app.accounts.verifyTokenVisibility(
        Account.ETH_1.accountName,
        Account.ETH_USDT.currency,
      );
      await app.accounts.expectTokenBalanceToBeNull(
        Account.ETH_1.accountName,
        Account.ETH_USDT.currency,
      );
      await app.layout.goToSettings();
      await app.settings.goToAccountsTab();
      await app.settings.clickHideEmptyTokenAccountsToggle();
      await app.layout.goToAccounts();
      await app.accounts.verifyChildrenTokensAreNotVisible(Account.ETH_1.accountName);
    },
  );
});
