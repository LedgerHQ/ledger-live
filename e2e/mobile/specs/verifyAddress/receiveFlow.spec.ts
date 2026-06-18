import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { ReceiveFundsOptions } from "@ledgerhq/live-common/e2e/enum/ReceiveFundsOptions";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { isWallet40 } from "../../helpers/commonHelpers";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

setTeamOwner(Team.WALLET_XP);
describe("Receive Flow", () => {
  const account = Account.ETH_1;

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      userdata: "EthAccountXrpAccountReadOnlyFalse",
      featureFlags: {
        noah: {
          enabled: true,
        },
      },
    });

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  beforeEach(async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    if (isWallet40) {
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();
    } else {
      await app.portfolio.tapQuickActionReceiveButton();
      await app.receive.selectReceiveFundsOption(ReceiveFundsOptions.CRYPTO);
    }
  });

  afterEach(async () => {
    await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
  });

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1857");
  (isSmokeTestRun ? it.skip : it)(
    "Should display the number of account existing per networks",
    async () => {
      const { ticker, name } = Account.ETH_1.currency;
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
    },
  );

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1861");
  (isSmokeTestRun ? it.skip : it)("Should create an account on a network", async () => {
    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Currency.BASE.name);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

    await app.receive.continueCreateAccount();
    await app.receive.doNotVerifyAddress();

    await app.receive.expectReceivePageIsDisplayed("ETH", Account.BASE_1.accountName);
    const address = await getAccountAddress(Account.BASE_1);
    await app.receive.verifyAddress(address);
    await app.common.closePage();

    if (isWallet40) {
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();
    } else {
      await app.portfolio.tapQuickActionReceiveButton();
      await app.receive.selectReceiveFundsOption(ReceiveFundsOptions.CRYPTO);
    }

    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Currency.BASE.name);
    await app.modularDrawer.validateNumberOfAccounts(3);
  });

  $TmsLink("B2CQA-650");
  (isSmokeTestRun ? it.skip : it)(
    "Should access to receive after importing a cryptocurrency on a selected network",
    async () => {
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
    },
  );

  $TmsLink("B2CQA-1859");
  $Tag("@smoke");
  it("Should access to receive after selecting an existing XRP account", async () => {
    await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
    await app.modularDrawer.selectAccount(Account.XRP_2.accountName);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(Currency.XRP.ticker, Account.XRP_2.accountName);
  });

  $TmsLink("B2CQA-1860");
  $Tag("@smoke");
  it("Should access to receive after selecting an existing ETH account", async () => {
    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Account.ETH_1.currency.name);
    await app.modularDrawer.selectAccount(Account.ETH_1.accountName);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(
      Account.ETH_1.currency.ticker,
      Account.ETH_1.accountName,
    );
    const address = await getAccountAddress(Account.ETH_1);
    await app.receive.verifyAddress(address);
  });
});
