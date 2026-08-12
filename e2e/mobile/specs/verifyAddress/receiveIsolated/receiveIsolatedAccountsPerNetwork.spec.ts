import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import { initReceiveApp, openReceiveDrawer } from "./setup";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

setTeamOwner(Team.WALLET_XP);
describe("Receive (isolated) - accounts per network", () => {
  beforeAll(initReceiveApp);
  beforeEach(openReceiveDrawer);

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
});
