import { launchApp } from "../../../helpers";
import { Application } from "../../../page";
import { CLI } from "../../../utils/cliUtils";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { device } from "detox";

const app = new Application();
const account = Account.BTC_NATIVE_SEGWIT_1;
const newAccountName = "New Account Name";

$TmsLink("B2CQA-2996");
describe("Account name change", () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        async () => {
          return CLI.liveData({
            currency: account.currency.currencyId,
            index: account.index,
            appjson: app.userdataPath,
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
