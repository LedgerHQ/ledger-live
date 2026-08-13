import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import { initReceiveApp, openReceiveDrawer } from "./setup";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

setTeamOwner(Team.WALLET_XP);
describe("Receive - existing XRP account", () => {
  beforeAll(initReceiveApp);
  beforeEach(openReceiveDrawer);

  $TmsLink("B2CQA-1859");
  (isSmokeTestRun ? it.skip : it)(
    "Should access to receive after selecting an existing XRP account",
    async () => {
      await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
      await app.modularDrawer.selectAccount(Account.XRP_2.accountName);
      await app.receive.doNotVerifyAddress();
      await app.receive.expectReceivePageIsDisplayed(
        Currency.XRP.ticker,
        Account.XRP_2.accountName,
      );
    },
  );
});
