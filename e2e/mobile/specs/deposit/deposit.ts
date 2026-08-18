import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setEnv } from "@shared/env";
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
  describe("Deposit", () => {
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
    it(`[${account.currency.testLabel}] - Deposit select network ${withAccount ? "with" : "without"} an account`, async () => {
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
  describe("Deposit", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
      });
    });

    setTeamOwner(Team.WALLET_XP);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.testLabel}] - Deposit select crypto without network or account`, async () => {
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
