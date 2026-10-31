import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { initReceiveApp } from "@e2e/specs/verifyAddress/receivePerTest/initReceiveApp";

const isSmokeTestRun = process.env.INPUTS_TEST_FILTER?.includes("@smoke");

// These three only read account state, so they can share one app instance. The tests that add
// an account keep their own spec, where a fresh instance is what makes the count assertions
// meaningful.
describe("Receive - read-only flows", () => {
  beforeAll(initReceiveApp);
  beforeEach(() => app.portfolio.openReceiveDrawer());

  afterEach(async () => {
    await app.modularDrawer.tapDrawerCloseButton({ onlyIfVisible: true });
    await app.common.closePage({ onlyIfVisible: true });
  });

  setTeamOwner(Team.COIN_INTEGRATION, { folder: TestFolder.RECEIVE });
  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1857");
  (isSmokeTestRun ? it.skip : it)(`Receive - number of accounts per network`, async () => {
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
  });

  setTeamOwner(coinTeamOwner(Currency.XRP.id), { folder: TestFolder.RECEIVE });
  $TmsLink("B2CQA-1859");
  (isSmokeTestRun ? it.skip : it)(
    `[${Currency.XRP.testLabel}] - Receive - from an existing account`,
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

  setTeamOwner(coinTeamOwner(Account.ETH_1.currency.id), { folder: TestFolder.RECEIVE });
  $TmsLink("B2CQA-1860");
  $Tag("@smoke");
  it(`[${Account.ETH_1.currency.testLabel}] - Receive - from an existing account`, async () => {
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
