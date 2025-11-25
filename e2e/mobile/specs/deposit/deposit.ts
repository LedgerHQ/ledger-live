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
      await app.modularDrawer.selectCurrencyByTicker(currentAccount.currency.ticker);
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
      await app.receive.continueCreateAccount();
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
  networks: string[],
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
      withAccount
        ? await app.portfolio.tapQuickActionReceiveButton()
        : await app.portfolioEmptyState.navigateToReceive();
      await app.modularDrawer.performSearchByTicker(account.currency.ticker);
      await app.modularDrawer.selectCurrencyByTicker(account.currency.ticker);
      await app.modularDrawer.validateNetworksScreen(networks);
      await app.modularDrawer.selectNetwork(account.currency.networks[0]);
      const accountName = account.parentAccount?.accountName ?? account.accountName;
      await app.modularDrawer.validateAccountsScreen(withAccount ? [accountName] : undefined);
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
      await app.portfolioEmptyState.navigateToReceive();
      await app.modularDrawer.validateAssetsScreen([account.currency.ticker]);
      await app.modularDrawer.performSearchByTicker(account.currency.ticker);
      await app.modularDrawer.selectCurrencyByTicker(account.currency.ticker);
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
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
      await app.portfolio.tapQuickActionReceiveButton();
      await app.modularDrawer.selectAsset(account);
      await app.receive.selectDontVerifyAddress();
      await app.receive.selectReconfirmDontVerify();
      await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
      await app.receive.verifyAddress(account.address);
    });
  });
}
