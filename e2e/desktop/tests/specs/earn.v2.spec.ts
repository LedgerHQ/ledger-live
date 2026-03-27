import { expect } from "@playwright/test";
import { test } from "tests/fixtures/common";
import { Account, TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { EARN_V2_DESKTOP_FLAGS, useLocalEarnManifest } from "tests/utils/featureFlagUtils";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import earnLocalManifestJson from "tests/utils/earnLocalManifest.json";
import { liveDataCommand, liveDataWithAddressCommand } from "tests/utils/cliCommandsUtils";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { getModularSelector } from "tests/utils/modularSelectorUtils";

const EARN_LOCAL_MANIFEST: LiveAppManifest = earnLocalManifestJson as LiveAppManifest;

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

function getTags(account: Account) {
  const family = getFamilyByCurrencyId(account.currency.id);
  return [...DEVICE_TAGS, `@${account.currency.id}`, ...(family ? [`@family-${family}`] : [])];
}

function setupEnv(disableBroadcast?: boolean) {
  const originalBroadcastValue = process.env.DISABLE_TRANSACTION_BROADCAST;
  test.beforeAll(async () => {
    if (disableBroadcast) process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  });
  test.afterAll(async () => {
    if (originalBroadcastValue === undefined) {
      delete process.env.DISABLE_TRANSACTION_BROADCAST;
    } else {
      process.env.DISABLE_TRANSACTION_BROADCAST = originalBroadcastValue;
    }
  });
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
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("earn"),
        );
        await app.earnV2Dashboard.verifyIceColdStartPage();
        await app.earnV2Dashboard.clickIceColdStartEarnCTA();
        const selector = await getModularSelector(app, "ASSET");
        expect(selector).toBeTruthy();
        await selector!.validateItems();
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
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
            app.mainNavigation.openTargetFromMainNavigation("earn"),
          );
          await app.earnV2Dashboard.verifyColdStartPage();
          await app.earnV2Dashboard.verifyAssetReadyToEarn(account.currency.ticker);
          await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
          await app.earnV2Dashboard.verifyModalContainerVisible();
        },
      );
    });
  }

  // Hot start & Position → Account: accounts with active stake positions (provided by QA: SOL_2, NEAR_1, ATOM_1)
  const activePositionCurrencies = [
    {
      account: Account.SOL_2,
      hotStartXrayTicket: "B2CQA-4641",
      positionXrayTicket: "B2CQA-4646",
    },
    {
      account: Account.NEAR_1,
      hotStartXrayTicket: "B2CQA-4720",
      positionXrayTicket: "B2CQA-4725",
    },
    {
      account: Account.ATOM_1,
      hotStartXrayTicket: "B2CQA-4721",
      positionXrayTicket: "B2CQA-4726",
    },
  ];

  for (const { account, hotStartXrayTicket, positionXrayTicket } of activePositionCurrencies) {
    test.describe(`Hot start & Position - ${account.currency.ticker}`, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });

      test(
        `Earn v2 hot start page shows ${account.currency.ticker} with rewards`,
        {
          tag: getTags(account),
          annotation: { type: "TMS", description: hotStartXrayTicket },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
            app.mainNavigation.openTargetFromMainNavigation("earn"),
          );
          await app.earnV2Dashboard.verifyHotStartPage();
          await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
          await app.earnV2Dashboard.verifyRewardsSummaryBoxes();
        },
      );

      test(
        `Earn v2 position row navigates to account page for ${account.currency.ticker}`,
        {
          tag: getTags(account),
          annotation: { type: "TMS", description: positionXrayTicket },
        },
        async ({ app }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
            app.mainNavigation.openTargetFromMainNavigation("earn"),
          );
          await app.earnV2Dashboard.verifyHotStartPage();
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
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("earn"),
        );
        await app.earnV2Dashboard.clickIceColdStartEarnCTA();
        const assetSelector = await getModularSelector(app, "ASSET");
        if (assetSelector) {
          await assetSelector.selectAsset(account.currency);
        }
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
        await app.accounts.expectAccountsCountToBeNotNull();
      },
    );
  });

  // --- Navigation: CTA Flows ---

  const ctaFlows: {
    name: string;
    account: Account;
    ticker: string;
    xrayTicket: string;
    verify: (app: any, page: any) => Promise<void>;
  }[] = [
    {
      name: "CTA → Native staking (SOL)",
      account: Account.SOL_2,
      ticker: Account.SOL_2.currency.ticker,
      xrayTicket: "B2CQA-4643",
      verify: async (app, _page) => {
        await app.earnV2Dashboard.verifyModalContainerVisible();
      },
    },
    {
      name: "CTA → Partner dapp (ETH)",
      account: Account.ETH_1,
      ticker: Account.ETH_1.currency.ticker,
      xrayTicket: "B2CQA-4644",
      verify: async (app, _page) => {
        await app.earnV2Dashboard.verifyModalOrProviderVisible();
      },
    },
    {
      name: "CTA → Earn staking (USDT)",
      account: TokenAccount.ETH_USDT_1,
      ticker: TokenAccount.ETH_USDT_1.currency.ticker,
      xrayTicket: "B2CQA-4645",
      verify: async app => {
        await app.earnV2Dashboard.verifyDepositFlowVisible();
      },
    },
  ];

  for (const { name, account, ticker, xrayTicket, verify } of ctaFlows) {
    test.describe(name, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });

      test(
        `Earn v2 ${name}`,
        {
          tag: getTags(account),
          annotation: { type: "TMS", description: xrayTicket },
        },
        async ({ app, page }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
            app.mainNavigation.openTargetFromMainNavigation("earn"),
          );
          await app.earnV2Dashboard.clickAssetEarnCta(ticker);
          await app.earnV2Dashboard.selectAccountInModularSelector(app, account);
          await verify(app, page);
        },
      );
    });
  }

  // --- Navigation: ETH Provider Staking Flows ---

  const ethProviders = [
    { provider: Provider.LIDO, xrayTicket: "B2CQA-4722" },
    { provider: Provider.STADER_LABS, xrayTicket: "B2CQA-4723" },
    { provider: Provider.KILN, xrayTicket: "B2CQA-4724" },
  ];

  for (const { provider, xrayTicket } of ethProviders) {
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
          annotation: { type: "TMS", description: xrayTicket },
        },
        async ({ app, page }) => {
          await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
          await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
            app.mainNavigation.openTargetFromMainNavigation("earn"),
          );
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
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("earn"),
        );
        await app.earnV2Dashboard.verifyHotStartPage();
        await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
        await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
        // After clicking, LLD navigates to the partner dapp via custom.navigate → redirect-provider.
        // The earn webview closes as LLD navigates to the dapp platform page.
        // Verify the main page URL changed to the platform route.
        await expect(page).toHaveURL(/\/platform\//);
      },
    );
  });

  test.describe("Position → Withdrawal (USDT)", () => {
    const account = Account.ETH_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    const xrayTicket = "B2CQA-4648";
    test(
      "Earn v2 position row navigates to withdrawal for USDT",
      {
        tag: getTags(account),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.earnV2Dashboard.goAndWaitForEarnToBeReady(() =>
          app.mainNavigation.openTargetFromMainNavigation("earn"),
        );
        await app.earnV2Dashboard.verifyHotStartPage();
        await app.earnV2Dashboard.verifyPositionRowPresent(TokenAccount.ETH_USDT_1.currency.ticker);
        await app.earnV2Dashboard.clickPositionRow(TokenAccount.ETH_USDT_1.currency.ticker);
        await app.earnV2Dashboard.verifyWithdrawalFlowVisible();
      },
    );
  });
});
