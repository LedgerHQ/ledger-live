import { expect } from "@playwright/test";
import { test } from "tests/fixtures/common";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { EARN_V2_DESKTOP_FLAGS, useLocalEarnManifest } from "tests/utils/featureFlagUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import earnLocalManifestJson from "tests/utils/earnLocalManifest.json";
import {
  liveDataCommand,
  liveDataWithAddressCommand,
} from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import type { Application } from "tests/page";

const EARN_LOCAL_MANIFEST: LiveAppManifest = earnLocalManifestJson as LiveAppManifest;

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

function getTags(account: Account) {
  const family = getFamilyByCurrencyId(account.currency.id);
  return [...DEVICE_TAGS, `@${account.currency.id}`, ...(family ? [`@family-${family}`] : [])];
}

function setupEnv(disableBroadcast?: boolean) {
  test.beforeAll(async () => {
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    delete process.env.DISABLE_TRANSACTION_BROADCAST;
  });
}

async function navigateToEarn(app: Application) {
  await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
  await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
    app.mainNavigation.openTargetFromMainNavigation("earn"),
  );
}

test.describe("Earn [v2]", () => {
  setupEnv(true);
  test.use({
    localManifestOverride: useLocalEarnManifest ? [EARN_LOCAL_MANIFEST] : undefined,
  });

  // --- User States ---

  test.describe("Ice cold start", () => {
    const account = Account.ETH_3;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
    });

    const xrayTicket = "B2CQA-4639";
    test(
      "Earn v2 ice cold start page displays correctly",
      {
        tag: getTags(account),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.verifyIceColdStartPage();
        await app.earnV2Dashboard.clickIceColdStartEarnCTA();
        await app.earnV2Dashboard.expectModularSelectorToBeVisible(app, "ASSET");
      },
    );
  });

  const coldStartCurrencies = [
    { account: Account.ETH_2, xrayTicket: "B2CQA-4640" },
    { account: Account.ATOM_2, xrayTicket: "B2CQA-4719" },
  ];

  for (const { account, xrayTicket } of coldStartCurrencies) {
    test.describe(`Cold start - ${account.currency.ticker}`, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });

      test(
        `Earn v2 cold start page shows ${account.currency.ticker} ready to earn`,
        {
          tag: getTags(account),
          annotation: { type: "TMS", description: xrayTicket },
        },
        async ({ app }) => {
          await navigateToEarn(app);
          await app.earnV2Dashboard.verifyColdStartPage();
          await app.earnV2Dashboard.verifyAssetReadyToEarn(account.currency.ticker);
          await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
          await app.earnV2Dashboard.verifyModalContainerVisible();

          if (account === Account.ETH_2) {
            await app.earnV2Dashboard.verifyProviderVisible();
          }
        },
      );
    });
  }

  // Hot start & Position → Account: accounts with active stake positions (provided by QA: SOL_2, NEAR_1, ATOM_1)
  const activePositionCurrencies = [
    {
      account: Account.SOL_2,
      xrayTickets: ["B2CQA-4641", "B2CQA-4646"],
    },
    {
      account: Account.NEAR_1,
      xrayTickets: ["B2CQA-4720", "B2CQA-4725"],
    },
    {
      account: Account.ATOM_1,
      xrayTickets: ["B2CQA-4721", "B2CQA-4726"],
    },
  ];

  for (const { account, xrayTickets } of activePositionCurrencies) {
    test.describe(`Hot start & Position - ${account.currency.ticker}`, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });

      test(
        `Earn v2 hot start page shows ${account.currency.ticker} with rewards and navigates to account`,
        {
          tag: getTags(account),
          annotation: { type: "TMS", description: xrayTickets.join(", ") },
        },
        async ({ app }) => {
          await navigateToEarn(app);
          await app.earnV2Dashboard.verifyHotStartPage();
          await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
          await app.earnV2Dashboard.verifyRewardsSummaryBoxes();
          await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
          await app.account.waitForAccountHeaderName(account.accountName);
        },
      );
    });
  }

  // --- Inline Add Account ---

  test.describe("Inline Add Account", () => {
    const account = Account.ETH_1;
    const xrayTicket = "B2CQA-4642";

    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
    });

    test(
      "Earn v2 ice cold start allows inline account addition",
      {
        tag: getTags(account),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.clickIceColdStartEarnCTA();
        await app.earnV2Dashboard.selectAssetInModularSelector(app, account.currency);
        await app.earnV2Dashboard.addExistingAccountViaModularSelector(app);
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();

        await app.addAccount.close();
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.expectAccountsCountToBeNotNull();
      },
    );
  });

  // --- Navigation: CTA Flows ---

  test.describe("CTA → Native staking (SOL)", () => {
    const account = Account.SOL_2;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    const xrayTicket = "B2CQA-4643";
    test(
      "Earn v2 CTA → Native staking (SOL)",
      {
        tag: getTags(account),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
        await app.earnV2Dashboard.verifyModalContainerVisible();
      },
    );
  });

  test.describe("CTA → Earn staking (USDT)", () => {
    const account = TokenAccount.ETH_USDT_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    const xrayTicket = "B2CQA-4645";
    test(
      "Earn v2 CTA → Earn staking (USDT)",
      {
        tag: getTags(account),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
        await app.earnV2Dashboard.verifyDepositFlowVisible();
      },
    );
  });

  // --- Navigation: ETH Provider Staking Flows ---

  const ethProviders = [
    { provider: Provider.LIDO, xrayTickets: ["B2CQA-4722", "B2CQA-4644"] },
    { provider: Provider.STADER_LABS, xrayTickets: ["B2CQA-4723"] },
    { provider: Provider.KILN, xrayTickets: ["B2CQA-4724"] },
  ];

  for (const { provider, xrayTickets } of ethProviders) {
    test.describe(`ETH staking flow - ${provider.name}`, () => {
      const account = Account.ETH_1;

      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });

      test(
        `Earn v2 ETH staking flow - ${provider.name}`,
        {
          tag: getTags(account),
          annotation: { type: "TMS", description: xrayTickets.join(", ") },
        },
        async ({ app, page }) => {
          await navigateToEarn(app);
          await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
          const verifyProviderUrlPromise = app.earnV2Dashboard.verifyProviderURL(
            provider.uiName,
            account,
          );
          await app.delegate.goToProviderLiveApp(provider.uiName);
          await verifyProviderUrlPromise;
          await expect(page).toHaveURL(/\/platform\//);
        },
      );
    });
  }

  // --- Navigation: Position Row Flows ---

  test.describe("Position → Dapp (ETH)", () => {
    const account = Account.ETH_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: {
        ...EARN_V2_DESKTOP_FLAGS,
        stakePrograms: {
          enabled: true,
          params: {
            list: ["ethereum"],
            redirects: {
              ethereum: { platform: "kiln-widget", name: "Kiln" },
            },
          },
        },
      },
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    const xrayTicket = "B2CQA-4647";
    test(
      "Earn v2 position row navigates to dapp for ETH",
      {
        tag: getTags(account),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, page }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.verifyHotStartPage();
        await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
        await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
        await expect(page).toHaveURL(/\/platform\//);
      },
    );
  });

  // ETH parent account is used for setup; the test verifies the USDT token position within it
  test.describe("Position → Withdrawal (USDT)", () => {
    const parentAccount = Account.ETH_1;
    const tokenAccount = TokenAccount.ETH_USDT_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: parentAccount.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(parentAccount)],
    });

    const xrayTicket = "B2CQA-4648";
    test(
      "Earn v2 position row navigates to withdrawal for USDT",
      {
        tag: getTags(parentAccount),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.verifyHotStartPage();
        await app.earnV2Dashboard.verifyPositionRowPresent(tokenAccount.currency.ticker);
        await app.earnV2Dashboard.clickPositionRow(tokenAccount.currency.ticker);
        await app.earnV2Dashboard.verifyWithdrawalFlowVisible();
      },
    );
  });
});
