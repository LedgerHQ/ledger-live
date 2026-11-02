import { AccountType } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { describeIfNanoS, describeIfNotNanoS } from "@e2e/helpers/commonHelpers";
import { isReceiveBlockedOnLNS } from "@ledgerhq/live-e2e-shared/nanoSSupport";

const LNS_DEPRECATION_ERROR_TITLE = "Ledger Nano S™ does not support this feature";

export function runVerifyAddressTest(
  account: AccountType,
  tmsLinks: string[],
  tags: string[],
  teamOwner: Team = Team.COIN_INTEGRATION,
) {
  const describeOnDevice = isReceiveBlockedOnLNS(account.currency.id)
    ? describeIfNotNanoS
    : describe;
  describeOnDevice("Receive", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(teamOwner);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.testLabel}] - Verify address`, async () => {
      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapReceive();
      await app.receive.selectVerifyAddress();
      const displayedAddress = await app.receive.getFreshAddressDisplayed();
      await app.speculos.expectValidAddressDevice(account, displayedAddress);
      await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
      await app.receive.expectAddressIsCorrect(displayedAddress);
    });
  });
}

type ReceiveBlockedOnLNSTestOptions = {
  account: AccountType;
  tmsLinks: string[];
  tags: string[];
  teamOwner?: Team;
};

export function runReceiveBlockedOnLNSTest(options: ReceiveBlockedOnLNSTestOptions) {
  const { account, tmsLinks, tags, teamOwner = Team.COIN_INTEGRATION } = options;
  describeIfNanoS("Receive", () => {
    beforeAll(async () => {
      await app.init({
        speculosApp: account.currency.speculosApp,
        cliCommands: [liveDataCommand(account)],
      });
      await app.mainNavigation.waitForWallet40Ready();
    });

    setTeamOwner(teamOwner);
    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    it(`[${account.currency.testLabel}] - Receive blocked by device deprecation on Nano S`, async () => {
      await app.account.openViaDeeplink();
      await app.account.goToAccountByName(account.accountName);
      await app.account.tapReceive();
      await app.receive.selectVerifyAddress();
      await app.receive.expectDeviceDeprecationError(LNS_DEPRECATION_ERROR_TITLE);
    });
  });
}
