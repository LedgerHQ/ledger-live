import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";

setTeamOwner(coinTeamOwner(Account.TRX_3.currency.id), { folder: TestFolder.RECEIVE });
describe("Receive", () => {
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
  it(`[${account.currency.testLabel}] - Verify address - activation warning on empty account`, async () => {
    await app.account.openViaDeeplink();
    await app.account.goToAccountByName(account.accountName);
    await app.account.tapReceive();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
    await app.receive.expectTronNewAddressWarning();
  });
});
