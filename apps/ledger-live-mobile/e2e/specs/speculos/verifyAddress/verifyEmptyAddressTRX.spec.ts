import { CLI } from "../../../utils/cliUtils";
import { Application } from "../../../page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

const app = new Application();
const account = Account.TRX_3;

describe(`Verify Address warnings - ${account.currency.name}`, () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
      cliCommands: [
        () => {
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

  $TmsLink("B2CQA-1551");
  it(`Verify address warning for ${account.currency.name}`, async () => {
    await app.accounts.openViaDeeplink();
    await app.common.goToAccountByName(account.accountName);
    await app.account.tapReceive();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed(account.currency.ticker, account.accountName);
    await app.receive.expectTronNewAddressWarning();
  });

  afterAll(async () => {
    await app?.common.removeSpeculos();
  });
});
