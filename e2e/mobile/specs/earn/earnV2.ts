import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setEnv } from "@ledgerhq/live-env";
import { waitEarnReady } from "../../bridge/server";
import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

import type { ApplicationOptions } from "page";
import type { PartialFeatures } from "@shared/feature-flags";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const EARN_V2_FLAGS: PartialFeatures = {
  ...WALLET_40_FEATURE_FLAGS,
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
};

// Pins the ETH deposit webview to the `basic_sorting` cohort (mirrors the desktop
// FF_STAKE_PROGRAMS_MODAL). This guarantees the provider category filter bar — including the "All"
// chip we tap to reveal every provider — is deterministically rendered, so the tests can assert on
// it rather than treating it as optional.
const FF_STAKE_PROGRAMS_MODAL: PartialFeatures = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["cosmos"],
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
        ethereum: {
          platform: "earn",
          name: "Earn - Deposit",
          queryParams: {
            cryptoAssetId: "ethereum",
            intent: "deposit",
            ethDepositCohort: "basic_sorting",
          },
        },
      },
    },
  },
};

let earnReady: Promise<string>;

async function navigateToEarn() {
  // EARN_V2_FLAGS always enables lwmWallet40 with mainNavigation: true,
  // so the app always renders the Wallet 4.0 navigator for earnV2 tests.
  await app.mainNavigation.tapWallet40Tab("earn");
  await earnReady;
}

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init(options);
  await app.mainNavigation.waitForWallet40Ready();
  earnReady = waitEarnReady();
}

// --- User States ---

export function runIceColdStartTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe("Earn V2 - Ice cold start", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("displays ice cold start page and CTA opens modular asset drawer", async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.verifyIceColdStartPage();
      await app.earnV2Dashboard.clickIceColdStartEarnCTA();
      await app.earnV2Dashboard.verifyModularAssetDrawerVisible();
    });
  });
}

export function runColdStartTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - Cold start - ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`shows ${account.currency.ticker} ready to earn and clicking CTA initiates staking`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.waitForColdStartPage();
      await app.earnV2Dashboard.verifyColdStartPage();
      await app.earnV2Dashboard.verifyAssetReadyToEarn(account.currency.ticker);
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      await app.earnV2Dashboard.verifyEarnFlowStarted(account.currency.ticker);
    });
  });
}

export function runHotStartTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - Hot start & Position - ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} hot start: rewards summary, position row -> manage -> account page`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.waitForHotStartPage();
      await app.earnV2Dashboard.verifyRewardsSummaryBoxes();
      await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
      await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
      await app.earnV2Dashboard.waitForManageDrawerAndVerifyOptions(["Manage", "Earn more"]);
      await app.earnV2Dashboard.tapManageDrawerOption("Manage");
      await app.account.waitAndVerifyAccountName(account.accountName);
    });
  });
}

// --- Navigation: CTA Flows ---

export function runNativeStakingCTATest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - CTA -> Native staking (${account.currency.ticker})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} earn CTA initiates staking flow`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      await app.earnV2Dashboard.verifyStakingFlowOpened(account.currency.ticker);
    });
  });
}

export function runScyStakingCTATest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - CTA -> Earn staking (${account.currency.ticker})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} earn CTA initiates deposit flow`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      await app.earnV2Dashboard.verifyDepositFlowVisible();
    });
  });
}

// --- Partner Dapp Flows ---

export function runPartnerDappCTATest(
  account: Account,
  providerId: string,
  dappUrlSubstring: string,
  tmsLinks: string[],
  tags: string[],
) {
  // ETH selects a provider in the deposit webview, which requires the category filter bar; pin its
  // cohort so that bar is guaranteed to render. Other tickers use the native staking drawer.
  const featureFlags =
    account.currency.ticker === "ETH"
      ? { ...EARN_V2_FLAGS, ...FF_STAKE_PROGRAMS_MODAL }
      : EARN_V2_FLAGS;
  describe(`Earn V2 - CTA -> Partner dapp (${account.currency.ticker} / ${providerId})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} earn CTA -> ${providerId} provider -> dapp`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      if (account.currency.ticker === "ETH") {
        // ETH redirects into the earn deposit webview: pick an amount, choose the provider, then
        // confirm to open the partner dapp (no native staking drawer in this flow).
        await app.earnV2Dashboard.verifyDepositFlowVisible();
        await app.earnV2Dashboard.completeEthDepositAmountStep("0.02");
        await app.earnV2Dashboard.selectEthProviderInWebview(providerId);
        await app.earnV2Dashboard.confirmEthDepositProvider();
      } else {
        await app.earnV2Dashboard.verifyStakingFlowOpened(account.currency.ticker);
        await app.earnV2Dashboard.tapStakingProvider(providerId);
      }
      await app.earnV2Dashboard.verifyPartnerDappLoaded(dappUrlSubstring);
    });
  });
}

export function runPartnerDappPositionTest(
  account: Account,
  dappUrlSubstring: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Earn V2 - Position -> Partner dapp (${account.currency.ticker})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} position row -> manage -> dapp`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.waitForHotStartPage();
      await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
      await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
      await app.earnV2Dashboard.waitForManageDrawerAndVerifyOptions(["Manage", "Earn more"]);
      await app.earnV2Dashboard.tapManageDrawerOption("Manage");
      await app.earnV2Dashboard.verifyPartnerDappLoaded(dappUrlSubstring);
    });
  });
}

// --- Position Row Flows ---

export function runPositionToWithdrawalTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - Position -> Withdrawal (${account.currency.ticker}) via manage drawer`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} position row -> withdraw all -> webview /redeem`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.waitForHotStartPage();
      await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
      await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
      // USDT (KilnDefi) shows Withdraw all + Earn more, not Manage.
      await app.earnV2Dashboard.waitForManageDrawerAndVerifyOptions(["Withdraw all", "Earn more"]);
      await app.earnV2Dashboard.tapManageDrawerOption("Withdraw all");
      await app.earnV2Dashboard.verifyWithdrawalFlowVisible();
    });
  });
}

// --- Inline Add Account ---

export function runInlineAddAccountTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe("Earn V2 - Inline Add Account", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
      });
    });

    setTeamOwner(Team.EARN);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Inline Add Account [${account.currency.speculosApp.name}]`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.verifyIceColdStartPage();
      await app.earnV2Dashboard.clickIceColdStartEarnCTA();
      await app.earnV2Dashboard.verifyModularAssetDrawerVisible();

      await app.modularDrawer.performSearchByTicker(account.currency.ticker);
      await app.modularDrawer.selectCurrencyByTicker(account.currency.ticker);
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
      await app.addAccount.addAccountAtIndex(`${account.currency.name} 1`, account.currency.id, 0);

      await app.earnV2Dashboard.verifyEarnFlowStarted(account.currency.ticker);
    });
  });
}
