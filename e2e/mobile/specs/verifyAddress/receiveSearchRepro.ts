import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

/**
 * runReceiveFlowV2 truncated at the step that fails (QAA-1476).
 *
 * Every step before `performSearchByTicker` is replayed exactly, in the same order
 * and the same app instance, because they turned out to matter: a version that
 * opened the drawer once on a fresh app and searched straight away passed 4/4
 * (run 31677882611), while the full flow failed 6 of 7 samples. By the time the
 * search runs here it is the fifth drawer open and follows an account creation.
 *
 * Everything after the search is dropped — the POL import, the XRP leg and the ETH
 * leg — so the spec ends at the failure instead of spending another ~90s of account
 * discovery past it.
 */
export function runReceiveSearchRepro(run: number) {
  const account = Account.ETH_1;

  setTeamOwner(Team.WALLET_XP);
  describe(`Receive search repro (run ${run})`, () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        userdata: "EthAccountXrpAccountReadOnlyFalse",
      });
    });

    it("Should display the number of account existing per networks", async () => {
      const { ticker, name } = Account.ETH_1.currency;

      await app.mainNavigation.waitForWallet40Ready();

      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

      await app.modularDrawer.selectCurrencyByTicker(ticker);
      await app.modularDrawer.selectNetwork(name);
      await app.modularDrawer.validateNumberOfAccounts(3);
      await app.modularDrawer.validateAccountNames([
        Account.ETH_1.accountName,
        Account.ETH_2.accountName,
        Account.ETH_3.accountName,
      ]);

      await app.modularDrawer.tapDrawerBackButton();
      await app.modularDrawer.selectNetwork(Currency.OP.name);
      await app.modularDrawer.validateNumberOfAccounts(1);
      await app.modularDrawer.validateAccountNames([Account.OP_1.accountName]);

      await app.modularDrawer.tapDrawerCloseButton();
    });

    it("Should create an account on a network", async () => {
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

      await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
      await app.modularDrawer.selectNetwork(Currency.BASE.name);
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
      const scannedAccounts = await app.addAccount.getNumberOfScannedAccounts();

      await app.receive.continueCreateAccount();
      await app.receive.doNotVerifyAddress();

      await app.receive.expectReceivePageIsDisplayed("ETH", Account.BASE_1.accountName);
      const baseAddress = await getAccountAddress(Account.BASE_1);
      await app.receive.verifyAddress(baseAddress);
      await app.common.closePage();

      // Create a new account on the same network
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

      await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
      await app.modularDrawer.selectNetwork(Currency.BASE.name);
      await app.modularDrawer.validateNumberOfAccounts(scannedAccounts - 1);

      await app.modularDrawer.tapDrawerCloseButton();

      // The failing step, reached exactly as it is in the full flow. Selecting the
      // searched asset stays in so a search that silently matched nothing still fails.
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

      await app.modularDrawer.performSearchByTicker(Currency.POL.ticker);
      await app.modularDrawer.selectCurrencyByTicker(Currency.POL.ticker);
      await app.modularDrawer.selectNetwork(Currency.POL.name);
    });
  });
}
