import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

setTeamOwner(Team.WALLET_XP);
describe("Receive V2", () => {
  const account = Account.ETH_1;

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      userdata: "EthAccountXrpAccountReadOnlyFalse",
    });
  });

  it("Should display the number of account existing per networks", async () => {
    const { ticker, name } = Account.ETH_1.currency;

    // BeforEach
    // await app.portfolio.openViaDeeplink();
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

    // Should access to receive after importing a cryptocurrency on a selected network
    await app.portfolio.pressQuickActionTransferButton();
    await app.portfolio.pressTransferBottomSheetReceiveButton();

    await app.modularDrawer.performSearchByTicker(Currency.POL.ticker);
    await app.modularDrawer.selectCurrencyByTicker(Currency.POL.ticker);
    await app.modularDrawer.selectNetwork(Currency.POL.name);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

    await app.addAccount.addAccountAtIndex(Account.POL_1.accountName, Currency.POL.id, 0);

    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(Currency.POL.ticker, Account.POL_1.accountName);
    await app.common.closeButton().tap();

    // Should access to receive after selecting an existing XRP account

    await app.portfolio.pressQuickActionTransferButton();
    await app.portfolio.pressTransferBottomSheetReceiveButton();

    await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
    await app.modularDrawer.selectAccount(Account.XRP_2.accountName);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(Currency.XRP.ticker, Account.XRP_2.accountName);
    await app.common.closeButton().tap();

    // [ETH] - Access receive from an existing account
    await app.portfolio.pressQuickActionTransferButton();
    await app.portfolio.pressTransferBottomSheetReceiveButton();

    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Account.ETH_1.currency.name);
    await app.modularDrawer.selectAccount(Account.ETH_1.accountName);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(
      Account.ETH_1.currency.ticker,
      Account.ETH_1.accountName,
    );
    const ethAddress = await getAccountAddress(Account.ETH_1);
    await app.receive.verifyAddress(ethAddress);
  });
});
