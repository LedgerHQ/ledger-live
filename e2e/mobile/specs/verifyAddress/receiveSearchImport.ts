import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

/**
 * The one flow still failing after the deeplinks were removed and the shadow-tree
 * fix landed (QAA-1476).
 *
 * Lifted verbatim out of runReceiveFlowV2's second test, with everything that ran
 * before it dropped: no BASE account creation, no XRP or ETH leg. If it still fails
 * here, the search interaction is enough on its own; if it only fails inside the
 * long test, what precedes it matters.
 *
 * The failure is at `performSearchByTicker`: the drawer ends up at its closed
 * position (y=2904 on a 2856 screen) with the search input off-screen but still
 * holding focus and the typed text, so typing the trailing newline retries for 60s.
 */
export function runReceiveSearchImport(run: number) {
  const account = Account.ETH_1;

  setTeamOwner(Team.WALLET_XP);
  describe(`Receive search+import (run ${run})`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        userdata: "EthAccountXrpAccountReadOnlyFalse",
      });
    });

    it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
      await app.mainNavigation.waitForWallet40Ready();

      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

      await app.modularDrawer.performSearchByTicker(Currency.POL.ticker);
      await app.modularDrawer.selectCurrencyByTicker(Currency.POL.ticker);
      await app.modularDrawer.selectNetwork(Currency.POL.name);
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

      await app.addAccount.addAccountAtIndex(Account.POL_1.accountName, Currency.POL.id, 0);

      await app.receive.doNotVerifyAddress();
      await app.receive.expectReceivePageIsDisplayed(
        Currency.POL.ticker,
        Account.POL_1.accountName,
      );
    });
  });
}
