import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Provider } from "@ledgerhq/live-common/lib/e2e/enum/Provider";
import { setEnv } from "@ledgerhq/live-env";
import { waitEarnReady } from "../../bridge/server";
import { ApplicationOptions } from "page";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

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
  await waitEarnReady();
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
      await app.stake.selectCurrency(account.currency.id);
      await app.common.tapProceedButton();
      await app.addAccount.addAccountAtIndex(`${account.currency.name} 1`, account.currency.id, 0);
      await app.common.selectFirstAccount();
      await app.earnDashboard.expectStakingProviderModalTitle("Select staking provider");
    });
  });
}

export async function runStartETHStakingFromEarnDashboardTest(
  account: Account,
  earnButtonId: string,
  provider: Provider,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Start ETH staking flow from Earn Dashboard", () => {
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
      await app.earnDashboard.goToEarnMoreTab();
      await app.earnDashboard.clickEarnCurrencyButton(earnButtonId);
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
  earnButtonId?: string,
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
      if (staking) {
        await app.earnDashboard.verifyTotalDeposited();
        await app.earnDashboard.verifyTotalRewardsEarned();
        await app.earnDashboard.verifyDepositedAssets(account);
        await app.earnDashboard.goToEarnMoreTab();
        await app.earnDashboard.verifyAmountAvailableToEarn();
      } else {
        await app.earnDashboard.goToEarnMoreTab();
        await app.earnDashboard.verifyAmountAvailableToEarn();
        await app.earnDashboard.verifyRewardsPotentials();
        await app.earnDashboard.verifyYourEligibleAssets(account, earnButtonId);
        await app.earnDashboard.verifyEarnByStackingButton();
      }
    });
  });
}
