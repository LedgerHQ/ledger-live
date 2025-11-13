import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "tests/utils/cliUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";

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
    provider: Provider.LIDO,
    xrayTicket: "B2CQA-3676, B2CQA-1713",
  },
  {
    account: Account.ETH_1,
    provider: Provider.STADER_LABS,
    xrayTicket: "B2CQA-3677",
  },
  {
    account: Account.ETH_1,
    provider: Provider.KILN,
    xrayTicket: "B2CQA-3678",
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
            currency: account.currency.id,
            index: account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `ETH staking flow - Earn Dashboard - ${provider.name}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          ...(provider === Provider.LIDO ? ["@smoke"] : []),
        ],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await app.earnDashboard.goToEarnMoreTab();
        await app.earnDashboard.clickStakeCurrencyButton(account.accountName);
        const verifyProviderUrlPromise = app.earnDashboard.verifyProviderURL(
          provider.uiName,
          account,
        );
        await app.delegate.goToProviderLiveApp(provider.uiName);
        await verifyProviderUrlPromise;
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
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
      annotation: [
        {
          type: "TMS",
          description: "B2CQA-3001",
        },
      ],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
      await app.earnDashboard.clickLearnMoreButton(account.currency.id);
      const modularDrawerVisible = await app.modularDrawer.isModularAccountDrawerVisible();
      if (modularDrawerVisible) {
        await app.modularDrawer.clickOnAddAndExistingAccountButton();
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();
      } else {
        await app.delegateDrawer.clickOnAddAccountButton();
        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.delegateDrawer.selectAccountByName(account);
      }

      await app.addAccount.close();
      await app.layout.goToAccounts();
      await app.accounts.expectAccountsCountToBeNotNull();
    },
  );
});

const earnDashboardCurrencies = [
  {
    account: Account.ETH_1,
    xrayTicket: "B2CQA-3679",
    staking: false,
  },
  {
    account: Account.SOL_4,
    xrayTicket: "B2CQA-3680",
    staking: false,
  },
  {
    account: Account.ATOM_2,
    xrayTicket: "B2CQA-3681",
    staking: false,
  },
  {
    account: Account.NEAR_2,
    xrayTicket: "B2CQA-3682",
    staking: false,
  },
  {
    account: Account.NEAR_1,
    xrayTicket: "B2CQA-3683",
    staking: true,
  },
  {
    account: Account.SOL_2,
    xrayTicket: "B2CQA-3684",
    staking: true,
  },
  {
    account: Account.ATOM_1,
    xrayTicket: "B2CQA-3685",
    staking: true,
  },
];

for (const { account, xrayTicket, staking } of earnDashboardCurrencies) {
  test.describe("Correct Earn page is loaded depending on user's staking situation", () => {
    setupEnv(true);
    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: account.currency.id,
            index: account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `Correct Earn page - ${account.currency.ticker} - staking situation: ${staking}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          ...(account === Account.NEAR_1 ? ["@smoke"] : []),
        ],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        if (!staking) {
          await app.earnDashboard.verifyRewardsPotentials();
          await app.earnDashboard.verifyYourEligibleAssets(account.accountName);
          await app.earnDashboard.verifyEarnByStackingButton();
        } else {
          await app.earnDashboard.goToAssetsTab();
          await app.earnDashboard.verifyTotalRewardsEarned();
          await app.earnDashboard.verifyAssetsEarningRewards(account.currency.id);
          await app.earnDashboard.goToEarnMoreTab();
        }
      },
    );
  });
}
