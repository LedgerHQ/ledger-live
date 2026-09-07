import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { initReceiveApp } from "@e2e/specs/verifyAddress/receivePerTest/initReceiveApp";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

setTeamOwner(Team.COIN_INTEGRATION);
describe("Receive - create an account", () => {
  beforeAll(initReceiveApp);
  beforeEach(() => app.portfolio.openReceiveDrawer());

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1861");
  (isSmokeTestRun ? it.skip : it)("Should create an account on a network", async () => {
    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Currency.BASE.name);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    const scannedAccounts = await app.addAccount.getNumberOfScannedAccounts();

    await app.receive.continueCreateAccount();
    await app.receive.doNotVerifyAddress();

    await app.receive.expectReceivePageIsDisplayed("ETH", Account.BASE_1.accountName);
    const address = await getAccountAddress(Account.BASE_1);
    await app.receive.verifyAddress(address);
    await app.common.closePage();

    await app.portfolio.openReceiveDrawer();

    await app.modularDrawer.selectCurrencyByTicker(Account.ETH_1.currency.ticker);
    await app.modularDrawer.selectNetwork(Currency.BASE.name);
    await app.modularDrawer.validateNumberOfAccounts(scannedAccounts - 1);
  });
});
