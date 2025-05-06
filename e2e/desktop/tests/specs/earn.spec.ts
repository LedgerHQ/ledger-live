import { test } from "../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "../utils/cliUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

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
    provider: "lido",
    xrayTicket: "B2CQA-2452-1",
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
      "ETH staking flow - Earn Dashboard",
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earn.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await app.earn.clickEarnMoreButton(electronApp);
        await app.earn.clickStakeCurrencyButton(electronApp, account.accountName);
        await app.delegate.chooseStakeProvider(provider);
        await app.earn.verifyProviderURL(electronApp);
        await app.liveApp.verifyLiveAppTitle(provider);
      },
    );
  });
}
