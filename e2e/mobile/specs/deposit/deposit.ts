import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { setEnv } from "@ledgerhq/live-env";
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
    featureFlags: {
      currencyZkSync: { enabled: true },
      currencyScroll: { enabled: true },
    },
  });

  await app.portfolio.waitForPortfolioPageToLoad();
}

export async function runCreateNewAccountAndDepositTest(
  currentAccount: Account,
  newAccount: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Create new account and deposit for ${currentAccount.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: currentAccount.currency.speculosApp,
        cliCommands: [liveDataCommand(currentAccount.currency.speculosApp, currentAccount.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it("should create new account and deposit", async () => {
      await app.transferMenuDrawer.open();
      await app.transferMenuDrawer.navigateToReceive();
      await app.receive.expectFirstStep();
      await app.receive.selectAsset(currentAccount.currency.name);
      await app.receive.createAccount();
      await app.receive.continueCreateAccount();
      await app.receive.expectAccountIsCreated(newAccount.accountName);
      await app.common.selectAccount(newAccount);
      await app.receive.selectDontVerifyAddress();
      await app.receive.selectReconfirmDontVerify();
      await app.receive.expectReceivePageIsDisplayed(
        newAccount.currency.ticker,
        newAccount.accountName,
      );
      await app.receive.verifyAddress(newAccount.address);
    });
  });
}

export async function runSelectCryptoNetworkTest(
  account: Account,
  withAccount: boolean,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Select crypto network with ${withAccount ? "account" : "no account"} for ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: withAccount ? account.currency.speculosApp : undefined,
        cliCommands: withAccount
          ? [liveDataCommand(account.currency.speculosApp, account.index)]
          : undefined,
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`should select crypto network with ${withAccount ? "account" : "no account"} for ${account.currency.ticker}`, async () => {
      const networks = ["ethereum", "optimism", "arbitrum", "zksync", "scroll"];
      await app.receive.openViaDeeplink();
      await app.receive.expectFirstStep();
      await app.common.performSearch(account.currency.name);
      await app.receive.selectAsset(account.currency.ticker);
      await app.receive.expectSecondStepNetworks(networks);
    });
  });
}

export async function runSelectCryptoWithoutNetworkAndAccountTest(
  account: Account,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Select crypto without network and account for ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`should select crypto without network and account for ${account.currency.ticker}`, async () => {
      await app.receive.openViaDeeplink();
      await app.receive.expectFirstStep();
      await app.common.performSearch(account.currency.name);
      await app.receive.selectAsset(account.currency.ticker);
      await app.receive.expectDeviceConnectionScreen();
    });
  });
}

export async function runDepositInExistingAccountTest(
  account: Account,
  networkName: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Deposit in existing account for ${account.currency.ticker}`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account.currency.speculosApp, account.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`should deposit in existing account for ${account.currency.ticker}`, async () => {
      await app.receive.openViaDeeplink();
      await app.receive.expectFirstStep();
      await app.common.performSearch(account.currency.name);
      await app.receive.selectAsset(account.currency.ticker);
      await app.receive.selectNetwork(networkName);
      await app.common.selectAccount(account);
      await app.receive.selectDontVerifyAddress();
      await app.receive.selectReconfirmDontVerify();
      await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
      await app.receive.verifyAddress(account.address);
    });
  });
}
