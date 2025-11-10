import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { setEnv } from "@ledgerhq/live-env";
import { waitEarnReady } from "../../bridge/server";
import { ApplicationOptions } from "page";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

let earnReady: Promise<string>;

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
  });

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
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Inline Add Account [${account.currency.speculosApp.name}]`, async () => {
      await app.transferMenuDrawer.open();
      await app.transferMenuDrawer.navigateToStake();

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
        await app.common.enableSynchronization();
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
  provider: Provider,
  tmsLinks: string[],
  tags: string[],
) {
  // Kiln disabled as not available
  (provider === Provider.KILN ? describe.skip : describe)(
    "Start ETH staking flow from Earn Dashboard",
    () => {
      beforeAll(async () => {
        await beforeAllFunction({
          userdata: "skip-onboarding",
          speculosApp: account.currency.speculosApp,
          cliCommands: [liveDataCommand(account.currency.speculosApp, account.index)],
        });
      });

      tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      it(`ETH staking flow - Earn Dashboard - Provider : ${provider.uiName}`, async () => {
        await app.portfolio.openEarnTab();
        await earnReady;
        await app.earnDashboard.goToTab("Earn Opportunities");
        await app.earnDashboard.clickEarnCurrencyButton();
        await app.earnDashboard.expectStakingProviderModalTitle("Select staking provider");
        await app.earnDashboard.goToProviderLiveApp(provider);
        await app.earnDashboard.verifyProviderURL(provider, account);
      });
    },
  );
}

export async function runCorrectEarnPageIsLoadedDependingOnUserStakingSituationTest(
  account: Account,
  staking: boolean,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Correct Earn page is loaded depending on user's staking situation", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account.currency.speculosApp, account.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`Correct Earn page - ${account.currency.ticker} - staking situation: ${staking}`, async () => {
      await app.portfolio.openEarnTab();
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
