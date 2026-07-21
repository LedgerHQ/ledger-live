import { expect } from "@playwright/test";
import { test } from "tests/fixtures/common";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { EarnProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  FF_EARN_V2_DESKTOP,
  FF_EARN_V2_DESKTOP_WITH_SIMULATOR,
  FF_STAKE_PROGRAMS_MODAL,
  useLocalEarnManifest,
} from "tests/utils/featureFlagUtils";
import { addBugLink, addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import earnLocalManifestJson from "tests/utils/earnLocalManifest.json";
import {
  liveDataCommand,
  liveDataWithAddressCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";
import type { Application } from "tests/page";

const EARN_LOCAL_MANIFEST: LiveAppManifest = earnLocalManifestJson as LiveAppManifest;

function setupEnv(disableBroadcast?: boolean) {
  test.use({
    env: disableBroadcast ? { DISABLE_TRANSACTION_BROADCAST: "1" } : {},
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
    teamOwner: Team.EARN,
    localManifestOverride: useLocalEarnManifest ? [EARN_LOCAL_MANIFEST] : undefined,
  });

  // --- User States ---

  test.describe("Ice cold start", () => {
    const account = Account.ETH_3;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: FF_EARN_V2_DESKTOP_WITH_SIMULATOR,
    });

    const xrayTicket = "B2CQA-4639";
    test(
      "Earn v2 ice cold start page displays correctly",
      {
        tag: buildTags({ currencyId: account.currency.id }),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.verifyIceColdStartPage();
        await app.earnV2Dashboard.clickSimulateInvestmentCta();
        await app.earnV2Dashboard.verifyEarnSimulatorVisible();
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
        featureFlags: {
          ...FF_EARN_V2_DESKTOP,
          ...FF_STAKE_PROGRAMS_MODAL,
        },
        cliCommands: [liveDataCommand(account)],
        speculosForSetupOnly: true,
      });

      test(
        `Earn v2 cold start page shows ${account.currency.ticker} ready to earn`,
        {
          tag: buildTags({ currencyId: account.currency.id }),
          annotation: { type: "TMS", description: xrayTicket },
        },
        async ({ app }) => {
          await navigateToEarn(app);
          await app.earnV2Dashboard.verifyColdStartPage();
          await app.earnV2Dashboard.verifyAssetReadyToEarn(account.currency.ticker);
          await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);

          if (account === Account.ETH_2) {
            // ETH redirects to the earn deposit webview (stakePrograms redirect) rather than
            // opening a native staking modal.
            await app.earnV2Dashboard.verifyDepositFlowVisible();
          } else {
            await app.earnV2Dashboard.verifyModalContainerVisible();
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
        featureFlags: FF_EARN_V2_DESKTOP,
        cliCommands: [liveDataCommand(account)],
        speculosForSetupOnly: true,
      });

      test(
        `Earn v2 hot start page shows ${account.currency.ticker} with rewards and navigates to account`,
        {
          tag: buildTags({ currencyId: account.currency.id }),
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

  // --- Earn v2 inline Add Account ---

  test.describe("Earn v2 inline Add Account", () => {
    const account = Account.ETH_1;
    const xrayTicket = "B2CQA-4642";

    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: account.currency.speculosApp,
      featureFlags: {
        ...FF_EARN_V2_DESKTOP_WITH_SIMULATOR,
        ...FF_STAKE_PROGRAMS_MODAL,
        // Routes earn-simulator-cta to the v2 deposit screen (AssetFlow.EarnV2Deposit)
        // rather than the swap action dialog. The earn-live-app reads this via the Wallet API.
        swapToEarn: { enabled: true },
      },
    });

    test(
      "Earn v2 ice cold start allows inline account addition",
      {
        tag: buildTags({ currencyId: account.currency.id }),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.clickSimulateInvestmentCta();
        await app.earnV2Dashboard.verifyEarnSimulatorVisible();
        await app.earnV2Dashboard.clickEarnSimulatorCta();
        await app.earnV2Dashboard.clickAccountSelectorInput();
        await app.earnV2Dashboard.selectAssetInModularSelector(app, account.currency);
        await app.earnV2Dashboard.addExistingAccountViaModularSelector(app);
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();

        // The account is added once the scan drawer closes; ETH then proceeds into the earn
        // deposit webview (no native add-account modal to close).
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.expectAtLeastOneAccountVisible();
      },
    );
  });

  // swapToEarn disabled → resolveAssetFlow routes to EarnV1Deposit → text-button-cta

  test.describe("Earn v2 simulator CTA → v1 deposit", () => {
    const account = Account.ETH_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: {
        ...FF_EARN_V2_DESKTOP_WITH_SIMULATOR,
        ...FF_STAKE_PROGRAMS_MODAL,
        // Explicitly disabled to override any Remote Config default and force EarnV1Deposit
        swapToEarn: { enabled: false },
      },
      cliCommands: [liveDataWithAddressCommand(account)],
      speculosForSetupOnly: true,
    });

    test(
      "Earn v2 simulator CTA routes to v1 deposit when swapToEarn is disabled",
      { tag: buildTags({ currencyId: account.currency.id }) },
      async ({ app }) => {
        await navigateToEarn(app);
        await app.earnV2Dashboard.clickSimulateInvestmentCta();
        await app.earnV2Dashboard.verifyEarnSimulatorVisible();
        await app.earnV2Dashboard.clickEarnSimulatorCta();
        // v1 ETH deposit: provider must be selected before the CTA becomes visible
        await app.earnV2Dashboard.selectEthProvider(EarnProvider.LIDO.name);
        await app.earnV2Dashboard.verifyV1TextButtonCtaVisible();
      },
    );
  });

  // --- Navigation: CTA Flows ---

  test.describe("CTA → Native staking (SOL)", () => {
    const account = Account.SOL_2;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.currency.speculosApp,
      featureFlags: FF_EARN_V2_DESKTOP,
      cliCommands: [liveDataWithAddressCommand(account)],
      speculosForSetupOnly: true,
    });

    const xrayTicket = "B2CQA-4643";
    test(
      "Earn v2 CTA → Native staking (SOL)",
      {
        tag: buildTags({ currencyId: account.currency.id }),
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
      featureFlags: FF_EARN_V2_DESKTOP,
      cliCommands: [liveDataWithAddressCommand(account)],
      speculosForSetupOnly: true,
    });

    const xrayTicket = "B2CQA-4645";
    test(
      "Earn v2 CTA → Earn staking (USDT)",
      {
        tag: buildTags({ currencyId: account.currency.id }),
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
    {
      provider: EarnProvider.LIDO,
      xrayTickets: ["B2CQA-4722", "B2CQA-4644"],
    },
    { provider: EarnProvider.KILN, xrayTickets: ["B2CQA-4724"] },
  ];

  for (const { provider, xrayTickets } of ethProviders) {
    test.describe(`ETH staking flow - ${provider.name}`, () => {
      const account = Account.ETH_1;

      test.use({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: {
          ...FF_EARN_V2_DESKTOP,
          ...FF_STAKE_PROGRAMS_MODAL,
        },
        cliCommands: [liveDataWithAddressCommand(account)],
        speculosForSetupOnly: true,
      });

      test(
        `Earn v2 ETH staking flow - ${provider.name}`,
        {
          tag: buildTags({ currencyId: account.currency.id }),
          annotation: { type: "TMS", description: xrayTickets.join(", ") },
        },
        async ({ app, page }) => {
          await navigateToEarn(app);
          await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
          await app.earnV2Dashboard.verifyDepositFlowVisible();
          await app.earnV2Dashboard.selectEthProvider(provider.name);
          // Confirm the selection actually opens the provider dapp (a platform live app),
          // rather than just registering the card click.
          await app.earnV2Dashboard.depositInSelectedProvider();
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
        ...FF_EARN_V2_DESKTOP,
        // TODO: sync Firebase environments and remove this override when final variant is chosen
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
      speculosForSetupOnly: true,
    });

    const xrayTicket = "B2CQA-4647";
    test(
      "Earn v2 position row navigates to dapp for ETH",
      {
        tag: buildTags({ currencyId: account.currency.id }),
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, page }) => {
        await navigateToEarn(app);
        await addBugLink(["LIVE-29872"]);
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
      featureFlags: FF_EARN_V2_DESKTOP,
      cliCommands: [liveDataWithAddressCommand(parentAccount)],
      speculosForSetupOnly: true,
    });

    const xrayTicket = "B2CQA-4648";
    test(
      "Earn v2 position row navigates to withdrawal for USDT",
      {
        tag: buildTags({ currencyId: parentAccount.currency.id }),
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

test.describe("LiveApp delegate - ETH", () => {
  const account = Account.ETH_1;

  test.use({
    teamOwner: Team.EARN,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
    featureFlags: { ...FF_STAKE_PROGRAMS_MODAL },
  });

  test(
    "[Ethereum] - Select validator",
    {
      tag: buildTags({ currencyId: account.currency.id, extraTags: ["@smoke"] }),
      annotation: { type: "TMS", description: "B2CQA-3024" },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.startStakingFlowFromMainStakeButton();
      await app.earnV2Dashboard.verifyDepositFlowVisible();
      await app.earnV2Dashboard.selectEthProvider(EarnProvider.LIDO.name);
    },
  );
});
