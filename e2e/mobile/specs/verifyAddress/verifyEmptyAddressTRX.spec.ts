import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";

setTeamOwner(Team.COIN_INTEGRATION);
describe("Verify Address warnings", () => {
  const account = Account.TRX_3;

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [liveDataCommand(account)],
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  $TmsLink("B2CQA-1551");
  const tags: string[] = [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@tron",
    "@family-tron",
  ];
  tags.forEach(tag => $Tag(tag));
  it(`Verify empty address warning for ${account.currency.name}`, async () => {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(account.accountName);
    await app.account.tapReceive();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
    await app.receive.expectTronNewAddressWarning();
  });
});
