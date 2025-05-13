import { test } from "../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "../utils/cliUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { waitForTimeOut } from "@ledgerhq/live-common/e2e/speculos";

function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  test.beforeAll(async () => {
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    if (originalBroadcastValue !== undefined) {
      process.env.DISABLE_TRANSACTION_BROADCAST = originalBroadcastValue;
    } else {
      delete process.env.DISABLE_TRANSACTION_BROADCAST;
    }
  });
}
const ethEarn = [
  {
    account: Account.ETH_1,
    provider: "Lido",
    xrayTicket: "B2CQA-2452-1, B2CQA-1713",
  },
  {
    account: Account.ETH_1,
    provider: "Stader Labs",
    xrayTicket: "B2CQA-2452-2",
  },
  {
    account: Account.ETH_1,
    provider: "Kiln staking Pool",
    xrayTicket: "B2CQA-2452-3",
  },
];

for (const { account, provider, xrayTicket } of ethEarn) {
  test.describe("Start ETH staking flow from Earn Dashboard", () => {
    setupEnv(true);
    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: account.currency.ticker,
            index: account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `ETH staking flow - Earn Dashboard - ${provider}`,
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await waitForTimeOut(6000); //todo: remove when custom method is merged
        await app.earnDashboard.clickEarnMoreButton(electronApp);
        await app.earnDashboard.clickStakeCurrencyButton(electronApp, account.accountName);
        await app.delegate.chooseStakeProvider(provider);
        await app.earnDashboard.verifyProviderURL(electronApp, provider, account);
      },
    );
  });
}

test.describe("Inline Add Account", () => {
  const account = Account.ETH_1;
  setupEnv(true);
  test.use({
    userdata: "skip-onboarding",
    speculosApp: account.currency.speculosApp,
  });

  test(
    "Inline Add Account",
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-3001",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
      await waitForTimeOut(6000); //todo: remove when custom method is merged
      await app.earnDashboard.clickLeanrMoreButton(electronApp, account.currency.id);
      await app.delegateDrawer.clickOnAddAccountButton();
      await app.addAccount.addAccounts();
      await app.addAccount.done();
      await app.delegateDrawer.selectAccountByName(account);
      await app.addAccount.close();

      // land back on earn dashboard / broken on develop
    },
  );
});

const earnDashboardCurrencies = [
  // {
  //   account: Account.ETH_1,
  //   xrayTicket: "B2CQA-1733-1",
  // },
  // {
  //   account: Account.XTZ_1,
  //   xrayTicket: "B2CQA-1733-2",
  // },
  // {
  //   account: Account.SOL_2,
  //   xrayTicket: "B2CQA-1733-3",
  // },
  // {
  //   account: Account.ATOM_2,
  //   xrayTicket: "B2CQA-1733-3",
  // },
  {
    account: Account.NEAR_2,
    xrayTicket: "B2CQA-1733-3",
  },
];

for (const { account, xrayTicket } of earnDashboardCurrencies) {
  test.describe.only("Correct Earn page is loaded depending on user's staking situation", () => {
    setupEnv(true);
    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: account.currency.ticker,
            index: account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `Correct Earn page - ${account.currency.ticker}`,
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await waitForTimeOut(6000); //todo: remove when custom method is merged
        // Landing page contains section Rewards potential
        //      => data-testid="Est. rewards-balance-card"
        // Landing page contains section Your eligible assets  and a "Stake" CTA in front of every eligible assets
        //      => data-test-id="assets-title-text"
        //      => voir dans la table les trucs
        // Landing page contains section Get eligible assets  and a "Get " CTA in front of every listed asset
        //      => data-test-id="assets-title-text"
        //      => data-testid="get-avalanche_c_chain-button" exemple de currency
        // Landing page contains CTA "Earn by Staking" at the bottom of the page, which on click opens a side menu with every currency available for staking
        //      => data-test-id="stake-crypto-assets-button"
        //      => ouvre drawer:
        //          => getByTestId('select-asset-drawer-title') = "CHOOSE ASSET"
        //          => getByTestId('select-asset-drawer-list') = "Select an asset to stake"
      },
    );
  });
}
