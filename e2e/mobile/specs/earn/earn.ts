import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { EarnProvider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { setEnv } from "@ledgerhq/live-env";
import { waitEarnReady } from "../../bridge/server";
import { isWallet40 } from "../../helpers/commonHelpers";

import type { ApplicationOptions } from "page";
import type { PartialFeatures } from "@shared/feature-flags";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const FF_STAKE_PROGRAM_OVERRIDE: PartialFeatures = {
  // TODO: sync Firebase environments and remove this override when final variant is chosen
  stakePrograms: {
    enabled: true,
    params: {
      list: ["ethereum", "cosmos"],
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
};

const FF_PTX_EARN_UI_V1: PartialFeatures = {
  ptxEarnUi: { enabled: false, params: { value: "v1" } },
};

let earnReady: Promise<string>;

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init(options);

  await app.portfolio.waitForPortfolioPageToLoad();
  earnReady = waitEarnReady();
}

export async function runInlineAddAccountTest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Inline Add Account", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: FF_STAKE_PROGRAM_OVERRIDE,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Inline Add Account [${account.currency.speculosApp.name}]`, async () => {
      if (isWallet40) {
        await app.mainNavigation.tapWallet40Tab("earn");
        await earnReady;
        await app.earnDashboard.tapIceColdStartEarnCta();
      } else {
        await app.transferMenuDrawer.open();
        await app.transferMenuDrawer.navigateToStake();
      }

      const isModularDrawer = await app.modularDrawer.isFlowEnabled("live_app");

      if (isModularDrawer) {
        await app.modularDrawer.performSearchByTicker(account.currency.ticker);
        await app.modularDrawer.selectCurrencyByTicker(account.currency.ticker);
        await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
        await app.addAccount.addAccountAtIndex(
          `${account.currency.name} 1`,
          account.currency.id,
          0,
        );
      } else {
        await app.stake.selectCurrency(account.currency.id);
        await app.common.tapProceedButton();
        await app.addAccount.addAccountAtIndex(
          `${account.currency.name} 1`,
          account.currency.id,
          0,
        );
        await app.common.selectFirstAccount();
      }

      await app.earnDashboard.expectStakingProviderModalTitle("Select staking provider");
    });
  });
}

export async function runStartETHStakingFromEarnDashboardTest(
  account: Account,
  provider: EarnProvider,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Earn V1 - Start ETH staking flow from Earn Dashboard", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: {
          ...FF_PTX_EARN_UI_V1,
          ...FF_STAKE_PROGRAM_OVERRIDE,
        },
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`ETH staking flow - Earn Dashboard - Provider : ${provider.uiName}`, async () => {
      if (isWallet40) await app.mainNavigation.tapWallet40Tab("earn");
      else await app.portfolio.openEarnTab();

      await earnReady;
      await app.earnDashboard.goToTab("Earn Opportunities");
      await app.earnDashboard.clickEarnCurrencyButton(account);
      await app.earnDashboard.expectStakingProviderModalTitle("Select staking provider");
      await app.earnDashboard.goToProviderLiveApp(provider);
      await app.earnDashboard.verifyProviderURL(provider, account);
    });
  });
}

export async function runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  account: Account,
  staking: boolean,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Earn V1 - Correct Earn Page is loaded depending on user's staking situation", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account)],
        featureFlags: {
          ...FF_PTX_EARN_UI_V1,
        },
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Correct Earn page - ${account.currency.ticker} - staking situation: ${staking}`, async () => {
      if (isWallet40) await app.mainNavigation.tapWallet40Tab("earn");
      else await app.portfolio.openEarnTab();
      await earnReady;
      if (staking) {
        await app.earnDashboard.goToTab("My Rewards");
        await app.earnDashboard.verifyTotalDeposited();
        await app.earnDashboard.verifyTotalRewardsEarned();
        await app.earnDashboard.verifyDepositedAssets(account);
        await app.earnDashboard.goToTab("Earn Opportunities");
        await app.earnDashboard.verifyAmountAvailableToEarn();
      } else {
        await app.earnDashboard.goToTab("Earn Opportunities");
        await app.earnDashboard.verifyAmountAvailableToEarn();
        await app.earnDashboard.verifyRewardsPotentials();
        await app.earnDashboard.verifyAvailableAssets(account);
        await app.earnDashboard.verifyEarnByStackingButton();
      }
    });
  });
}
