import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setEnv } from "@ledgerhq/live-env";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { ApplicationOptions } from "page";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
  });

  await app.mainNavigation.waitForWallet40Ready();
}

export async function runSelectCryptoNetworkTest(
  account: Account,
  networks: string[],
  withAccount: boolean,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Select crypto network with ${withAccount ? "account" : "no account"} for ${
    account.currency.ticker
  }`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: withAccount ? account.currency.speculosApp : undefined,
        cliCommands: withAccount ? [liveDataCommand(account)] : undefined,
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`should select crypto network with ${withAccount ? "account" : "no account"} for ${
      account.currency.ticker
    }`, async () => {
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

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

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`should select crypto without network and account for ${account.currency.ticker}`, async () => {
      await app.portfolio.pressQuickActionTransferButton();
      await app.portfolio.pressTransferBottomSheetReceiveButton();

      await app.modularDrawer.validateAssetsScreen([account.currency.ticker]);
      await app.modularDrawer.performSearchByTicker(account.currency.ticker);
      await app.modularDrawer.selectCurrencyByTicker(account.currency.ticker);
      await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
      await app.receive.expectDeviceConnectionScreen();
    });
  });
}
