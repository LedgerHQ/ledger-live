import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { launchApp } from "../../helpers/commonHelpers";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { loadConfig } from "../../bridge/server";
import { device } from "detox";

setTeamOwner(Team.WALLET_XP);
$TmsLink("B2CQA-2996");

const tags: string[] = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  `@bitcoin`,
  `@family-bitcoin`,
];
tags.forEach(tag => $Tag(tag));
describe("Account name change", () => {
  const account = Account.BTC_NATIVE_SEGWIT_1;
  const newAccountName = "New Account Name";

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [liveDataCommand(account)],
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  it("should persist Account name change after app restart", async () => {
    await app.accounts.openViaDeeplink();
    await app.common.expectAccountName(account.accountName);
    await app.common.goToAccountByName(account.accountName);
    await app.account.openAccountSettings();
    await app.account.selectAccountRename();
    await app.account.enterNewAccountName(newAccountName);
    await app.accounts.openViaDeeplink();
    await app.common.expectAccountName(newAccountName);
    await device.terminateApp();
    await launchApp();
    await device.disableSynchronization();
    await loadConfig("skip-onboarding", true);
    await app.mainNavigation.waitForWallet40Ready();
    await device.enableSynchronization();
    await app.portfolio.goToSpecificAsset(account.currency.name);
    await app.common.expectAccountName(newAccountName);
  });
});
