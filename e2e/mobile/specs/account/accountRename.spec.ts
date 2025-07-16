import { launchApp } from "../../helpers/commonHelpers";
import { device } from "detox";

$TmsLink("B2CQA-2996");
describe.skip("Account name change", () => {
  const account = Account.BTC_NATIVE_SEGWIT_1;
  const newAccountName = "New Account Name";

  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        async (userdataPath?: string) => {
          return CLI.liveData({
            currency: account.currency.id,
            index: account.index,
            appjson: userdataPath,
            add: true,
          });
        },
      ],
    });
    await app.portfolio.waitForPortfolioPageToLoad();
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
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.accounts.openViaDeeplink();
    await app.common.expectAccountName(newAccountName);
  });
});
