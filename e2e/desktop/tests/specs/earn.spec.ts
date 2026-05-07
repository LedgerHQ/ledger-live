import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import {
  liveDataWithAddressCommand,
  liveDataCommand,
} from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { EARN_V1_DESKTOP_FLAGS } from "tests/utils/featureFlagUtils";

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
    provider: Provider.KILN,
    xrayTicket: "B2CQA-3678",
  },
];

// Skipping this suite as legacy is not visible on prod anymore
for (const { account, provider, xrayTicket } of ethEarn) {
  test.describe.skip("Start ETH staking flow from Earn Dashboard", () => {
    setupEnv(true);
    test.use({
      teamOwner: Team.EARN,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.currency.speculosApp,
      cliCommands: [liveDataWithAddressCommand(account)],
      featureFlags: {
        ...EARN_V1_DESKTOP_FLAGS,
        // TODO: sync Firebase environments and remove this override when final variant is chosen
        stakePrograms: {
          enabled: true,
          params: {
            list: ["ethereum"],
            redirects: {
              "ethereum/erc20/usd__coin": {
                platform: "earn",
                name: "Earn - Deposit",
                queryParams: {
                  cryptoAssetId: "ethereum/erc20/usd__coin",
                  intent: "deposit",
                  deposit: "stablecoin",
                },
              },
            },
          },
        },
      },
    });

    const family = getFamilyByCurrencyId(account.currency.id);

    test(
      `ETH staking flow - Earn Dashboard - ${provider.name}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${account.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.earnDashboard.goAndWaitForEarnToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("earn"),
        );
        await app.earnDashboard.goToEarnMoreTab();
        await app.earnDashboard.clickStakeCurrencyButton(account);
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

// Skipping this suite as legacy is not visible on prod anymore
test.describe.skip("Earn live app Add Account", () => {
  const account = Account.ETH_1;
  setupEnv(true);
  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    featureFlags: EARN_V1_DESKTOP_FLAGS,
  });

  test(
    "Earn live app Add Account",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
      annotation: [
        {
          type: "TMS",
          description: "B2CQA-3001",
        },
      ],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.earnDashboard.goAndWaitForEarnToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("earn"),
      );
      await app.earnDashboard.clickLearnMoreButton(account.currency.id);
      const selector = await getModularSelector(app, "ACCOUNT");
      if (selector) {
        await selector.clickOnAddAndExistingAccount();
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();
      } else {
        await app.delegateDrawer.clickOnAddAccountButton();
        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.delegateDrawer.selectAccountByName(account);
      }

      await app.addAccount.close();
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectAtLeastOneAccountVisible();
    },
  );
});

const earnDashboardCurrencies = [
  {
    account: Account.ETH_3,
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

// Skipping this suite as legacy is not visible on prod anymore
for (const { account, xrayTicket, staking } of earnDashboardCurrencies) {
  test.describe.skip("Correct Earn page is loaded depending on user's staking situation", () => {
    setupEnv(true);
    test.use({
      teamOwner: Team.EARN,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V1_DESKTOP_FLAGS,
      cliCommands: [liveDataCommand(account)],
    });

    const family = getFamilyByCurrencyId(account.currency.id);

    test(
      `Correct Earn page - ${account.currency.ticker} - staking situation: ${staking}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${account.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnDashboard.goAndWaitForEarnToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("earn"),
        );
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
