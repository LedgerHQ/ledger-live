import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../../helpers/allure/allure-helper";
import { initReceiveApp, openReceiveDrawer } from "./setup";

setTeamOwner(Team.WALLET_XP);
describe("Receive - existing ETH account", () => {
  beforeAll(initReceiveApp);
  beforeEach(openReceiveDrawer);

  $TmsLink("B2CQA-1860");
  $Tag("@smoke");
  it("[ETH] - Access receive from an existing account", async () => {
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
