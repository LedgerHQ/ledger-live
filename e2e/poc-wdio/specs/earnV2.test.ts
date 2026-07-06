import pages from "../pages/pages.ts";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { PartialFeatures } from "@shared/feature-flags/src/data/schema.ts";
import allureReporter from "@wdio/allure-reporter";
import { liveDataCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";

const EARN_V2_FLAGS: PartialFeatures = {
  lwmWallet40: {
    enabled: true,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      mainNavigation: true,
      tour: true,
      lazyOnboarding: true,
      balanceRefreshRework: true,
      assetSection: true,
      operationsList: true,
      aggregatedAssets: false,
      myWallet: true,
      pnl: false,
      assetDiscoverability: false,
    },
  },
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
};

export const runEarnTest = async (
  account: Account,
  tmsLinks: string[],
  tags: string[],
) => {
  // allure data
  for (const tmsLink of tmsLinks) {
    await allureReporter.addTestId(tmsLink);
  }
  for (const tag of tags) {
    await allureReporter.addTag(tag);
  }

  // init options
  const options = {
    speculosApp: account.currency.speculosApp,
    featureFlags: EARN_V2_FLAGS,
    cliCommands: [liveDataCommand(account)],
  };

  // init
  await pages.init({
    speculosApp: options.speculosApp,
    featureFlags: options.featureFlags,
    cliCommands: options.cliCommands,
  });

  // go to earn
  await pages.portfolio.waitForPageToLoad();
  await pages.earn.openDeeplink();
  await pages.earn.waitForSuccess();

  await pages.earnLiveApp.waitForColdStartPage();
  await pages.earnLiveApp.verifyColdStartPage();
  await pages.earnLiveApp.verifyAssetReadyToEarn(account.currency.ticker);
  await pages.earnLiveApp.clickAssetEarnCta(account.currency.ticker);
  await pages.earnLiveApp.verifyEarnFlowStarted(account.currency.ticker);
};
