import { expect } from "@playwright/test";
import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import {
  EARN_V2_DESKTOP_FLAGS,
  EARN_LOCAL_MANIFEST,
  useLocalEarnManifest,
} from "tests/utils/earnV2Flags";
import { liveDataCommand, liveDataWithAddressCommand } from "tests/utils/cliCommandsUtils";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import {
  mockEthNativeStake,
  mockUsdtMorphoStake,
  buildStakesResponse,
  interceptEarnStakes,
} from "tests/utils/earnMockData";

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

function getTags(account: Account) {
  const family = getFamilyByCurrencyId(account.currency.id);
  return [...DEVICE_TAGS, `@${account.currency.id}`, ...(family ? [`@family-${family}`] : [])];
}

async function selectAccountInModularSelector(app: any, page: any, account: Account) {
  const selector = await getModularSelector(app, "ACCOUNT");
  if (selector) {
    await selector.selectAccount(account);
    await expect(
      page
        .getByTestId("modular-drawer-screen-ACCOUNT_SELECTION")
        .or(page.getByTestId("modular-dialog-screen-ACCOUNT_SELECTION")),
    ).toBeHidden();
  }
}

test.describe("Earn [v2]", () => {
  test.use({
    localManifestOverride: useLocalEarnManifest ? [EARN_LOCAL_MANIFEST] : undefined,
  });

  // --- User States ---

  test.describe("Ice cold start", () => {
    const account = Account.ETH_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
    });

    test(
      "Earn v2 ice cold start page displays correctly",
      { tag: getTags(account) },
      async ({ app }) => {
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await app.earnDashboard.verifyIceColdStartPage();
        await app.earnDashboard.clickIceColdStartEarnCTA();
        const selector = await getModularSelector(app, "ASSET");
        if (selector) {
          await selector.validateItems();
        }
      },
    );
  });

  for (const account of [Account.SOL_4, Account.ETH_1]) {
    test.describe(`Cold start - ${account.currency.ticker}`, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });

      test(
        `Earn v2 cold start page shows ${account.currency.ticker} ready to earn`,
        { tag: getTags(account) },
        async ({ app }) => {
          await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
          await app.earnDashboard.verifyColdStartPage();
          await app.earnDashboard.verifyAssetReadyToEarn(account.currency.ticker);
          await app.earnDashboard.clickAssetEarnCta(account.currency.ticker);
          const selector = await getModularSelector(app, "ACCOUNT");
          if (selector) {
            await selector.validateItems();
          }
        },
      );
    });
  }

  for (const account of [Account.ATOM_1, Account.NEAR_1]) {
    test.describe(`Hot start - ${account.currency.ticker}`, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });

      test(
        `Earn v2 hot start page shows ${account.currency.ticker} with rewards`,
        { tag: getTags(account) },
        async ({ app }) => {
          await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
          await app.earnDashboard.verifyHotStartPage();
          await app.earnDashboard.verifyPositionRowPresent(account.currency.ticker);
          await app.earnDashboard.verifyRewardsSummaryBoxes();
        },
      );
    });
  }

  // --- Navigation: CTA Flows ---

  test.describe("CTA → Native staking (SOL)", () => {
    const account = Account.SOL_4;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    test(
      "Earn v2 CTA opens native staking flow for SOL",
      { tag: getTags(account) },
      async ({ app, page }) => {
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await app.earnDashboard.clickAssetEarnCta(account.currency.ticker);
        await selectAccountInModularSelector(app, page, account);
        // SOL uses native staking: LLD opens the staking modal
        await expect(page.getByTestId("modal-container")).toBeVisible();
      },
    );
  });

  test.describe("CTA → Partner dapp (ETH)", () => {
    const account = Account.ETH_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    test(
      "Earn v2 CTA opens partner dapp flow for ETH",
      { tag: getTags(account) },
      async ({ app, page }) => {
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await app.earnDashboard.clickAssetEarnCta(account.currency.ticker);
        await selectAccountInModularSelector(app, page, account);
        // ETH uses partner dapps (Lido, Kiln, etc.): a provider selection should appear
        // or the dapp opens directly depending on the configured provider
        await expect(
          page.getByTestId("modal-container").or(page.locator("[data-test-id*='provider']")),
        ).toBeVisible();
      },
    );
  });

  test.describe("CTA → Earn staking (USDT)", () => {
    const account = Account.ETH_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: EARN_V2_DESKTOP_FLAGS,
      cliCommands: [liveDataWithAddressCommand(account)],
    });

    test(
      "Earn v2 CTA opens earn deposit flow for USDT",
      { tag: getTags(account) },
      async ({ app, page }) => {
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await app.earnDashboard.clickAssetEarnCta("USDT");
        await selectAccountInModularSelector(app, page, account);
        // USDT uses the earn native deposit flow
        await app.earnDashboard.verifyDepositFlowVisible();
      },
    );
  });

  // --- Navigation: Position Row Flows ---

  for (const account of [Account.NEAR_1, Account.ATOM_1]) {
    test.describe(`Position → Account (${account.currency.ticker})`, () => {
      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_DESKTOP_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });

      test(
        `Earn v2 position row navigates to account page for ${account.currency.ticker}`,
        { tag: getTags(account) },
        async ({ app }) => {
          await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
          await app.earnDashboard.verifyHotStartPage();
          await app.earnDashboard.clickPositionRow(account.currency.ticker);
          await app.account.waitForAccountHeaderName(account.accountName);
        },
      );
    });
  }

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

    test(
      "Earn v2 position row navigates to dapp for ETH",
      { tag: getTags(account) },
      async ({ app, electronApp, page }) => {
        // Mock the earn API to return an ETH native staking position
        const mockResponse = buildStakesResponse(
          [mockEthNativeStake],
          "ethereum",
          account.address!,
        );
        const interceptReady = interceptEarnStakes(electronApp, mockResponse);
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await interceptReady;

        await app.earnDashboard.verifyHotStartPage();
        await app.earnDashboard.verifyPositionRowPresent(account.currency.ticker);
        await app.earnDashboard.clickPositionRow(account.currency.ticker);
        // After clicking, LLD navigates to the partner dapp via custom.navigate → redirect-provider.
        // The earn webview closes as LLD navigates to the dapp platform page.
        // Verify the main page URL changed to the platform route.
        await expect(page).toHaveURL(/\/platform\//, { timeout: 10_000 });
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

    test(
      "Earn v2 position row navigates to withdrawal for USDT",
      { tag: getTags(account) },
      async ({ app, electronApp }) => {
        // Mock the earn API to return a USDT Morpho deposit position
        const mockResponse = buildStakesResponse(
          [mockUsdtMorphoStake],
          "ethereum",
          account.address!,
        );
        const interceptReady = interceptEarnStakes(electronApp, mockResponse);
        await app.earnDashboard.goAndWaitForEarnToBeReady(() => app.layout.goToEarn());
        await interceptReady;

        await app.earnDashboard.verifyHotStartPage();
        await app.earnDashboard.verifyPositionRowPresent("USDT");
        await app.earnDashboard.clickPositionRow("USDT");
        await app.earnDashboard.verifyWithdrawalFlowVisible();
      },
    );
  });
});
