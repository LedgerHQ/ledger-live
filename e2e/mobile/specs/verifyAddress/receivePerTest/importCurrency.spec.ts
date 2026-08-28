import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { initReceiveApp } from "@e2e/specs/verifyAddress/receivePerTest/initReceiveApp";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

setTeamOwner(Team.COIN_INTEGRATION);
describe("Receive - import a currency", () => {
  beforeAll(initReceiveApp);
  beforeEach(() => app.portfolio.openReceiveDrawer());

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
});
