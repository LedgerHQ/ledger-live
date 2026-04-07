import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { setEnv } from "@ledgerhq/live-env";
import { waitEarnReady } from "../../bridge/server";
import { ApplicationOptions } from "page";
import { WALLET_40_FEATURE_FLAGS } from "../../utils/constants";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

let earnReady: Promise<string>;

const EARN_V2_FLAGS = {
  ...WALLET_40_FEATURE_FLAGS,
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
};

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

const liveDataWithAddressCommand = (account: Account) => async (userdataPath?: string) => {
  await CLI.liveData({
    currency: account.currency.speculosApp.name,
    index: account.index,
    add: true,
    appjson: userdataPath,
  });
  account.address = await CLI.getAddressForAccount(account);
  return account.address;
};

async function navigateToEarn() {
  // EARN_V2_FLAGS always enables lwmWallet40 with mainNavigation: true,
  // so the app always renders the Wallet 4.0 navigator for earnV2 tests.
  await app.mainNavigation.tapWallet40Tab("earn");
  await earnReady;
}

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init(options);
  await app.portfolio.waitForPortfolioPageToLoad();
  earnReady = waitEarnReady();
}

// --- User States ---

export async function runIceColdStartTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe("Earn V2 - Ice cold start", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
      });
    });

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

export async function runColdStartTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - Cold start - ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataCommand(account.currency.speculosApp, account.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`shows ${account.currency.ticker} ready to earn and clicking CTA initiates staking`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.verifyColdStartPage();
      await app.earnV2Dashboard.verifyAssetReadyToEarn(account.currency.ticker);
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      await app.earnV2Dashboard.verifyStakingFlowOpened(account.currency.ticker);
    });
  });
}

export async function runHotStartTest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - Hot start & Position - ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataCommand(account.currency.speculosApp, account.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} hot start: rewards summary, position row -> manage -> account page`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.verifyHotStartPage();
      await app.earnV2Dashboard.verifyRewardsSummaryBoxes();
      await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
      await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
      await app.earnV2Dashboard.verifyManageDrawerOptions(["Manage", "Earn more"]);
      await app.earnV2Dashboard.tapManageDrawerOption("Manage");
      await app.account.waitForAccountScreenLoaded(account.accountName);
    });
  });
}

// --- Navigation: CTA Flows ---

export async function runNativeStakingCTATest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Earn V2 - CTA -> Native staking (${account.currency.ticker})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} earn CTA initiates staking flow`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      await app.earnV2Dashboard.verifyStakingFlowOpened(account.currency.ticker);
    });
  });
}

export async function runScyStakingCTATest(account: Account, tmsLinks: string[], tags: string[]) {
  describe(`Earn V2 - CTA -> Earn staking (${account.currency.ticker})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

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

export async function runPartnerDappCTATest(
  account: Account,
  providerId: string,
  dappUrlSubstring: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Earn V2 - CTA -> Partner dapp (${account.currency.ticker} / ${providerId})`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} earn CTA -> ${providerId} provider -> dapp`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.clickAssetEarnCta(account.currency.ticker);
      await app.earnV2Dashboard.verifyStakingFlowOpened(account.currency.ticker);
      await app.earnV2Dashboard.tapStakingProvider(providerId);
      await app.earnV2Dashboard.verifyPartnerDappLoaded(dappUrlSubstring);
    });
  });
}

export async function runPartnerDappPositionTest(
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

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} position row -> manage -> dapp`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.verifyHotStartPage();
      await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
      await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
      await app.earnV2Dashboard.verifyManageDrawerOptions(["Manage", "Earn more"]);
      await app.earnV2Dashboard.tapManageDrawerOption("Manage");
      await app.earnV2Dashboard.verifyPartnerDappLoaded(dappUrlSubstring);
    });
  });
}

// --- Position Row Flows ---

export async function runPositionToWithdrawalTest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Earn V2 - Position -> Withdrawal (${account.currency.ticker}) via manage drawer`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        featureFlags: EARN_V2_FLAGS,
        cliCommands: [liveDataWithAddressCommand(account)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`${account.currency.ticker} position row -> withdraw all -> webview /redeem`, async () => {
      await navigateToEarn();
      await app.earnV2Dashboard.verifyHotStartPage();
      await app.earnV2Dashboard.verifyPositionRowPresent(account.currency.ticker);
      await app.earnV2Dashboard.clickPositionRow(account.currency.ticker);
      // USDT (KilnDefi) shows Withdraw all + Earn more, not Manage.
      await app.earnV2Dashboard.verifyManageDrawerOptions(["Withdraw all", "Earn more"]);
      await app.earnV2Dashboard.tapManageDrawerOption("Withdraw all");
      await app.earnV2Dashboard.verifyWithdrawalFlowVisible();
    });
  });
}
