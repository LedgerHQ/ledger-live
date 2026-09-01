import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner, setXrayDataset } from "@e2e/helpers/allure/allure-helper";
import { ADD_ACCOUNT_XRAY_TEST } from "@e2e/specs/addAccount/addAccount";

const tags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aleo", "@family-aleo"];

describe("Add account", () => {
  beforeAll(async () => {
    await app.init({
      userdata: "skip-onboarding",
      speculosApp: Currency.ALEO.speculosApp,
      featureFlags: {
        currencyAleo: { enabled: true },
      },
    });
    await app.mainNavigation.waitForWallet40Ready();
  });

  setTeamOwner(Team.BST);
  tags.forEach(tag => $Tag(tag));
  setXrayDataset(ADD_ACCOUNT_XRAY_TEST, { Currency: Currency.ALEO.testLabel });

  it(`[${Currency.ALEO.testLabel}] - Add account`, async () => {
    await app.portfolio.addAccount();
    await app.addAccount.importWithYourLedger();
    await app.modularDrawer.performSearchByTicker(Currency.ALEO.ticker);
    await app.modularDrawer.selectCurrencyByTicker(Currency.ALEO.ticker);
    await app.modularDrawer.selectNetworkIfAsked(Currency.ALEO.name);

    await waitForElementById("aleo-view-key-warning-screen");
    await tapById("aleo-view-key-warning-allow-button");

    await app.addAccount.addAccountAtIndex(`${Currency.ALEO.name} 1`, Currency.ALEO.id, 0);

    await waitForElementById("aleo-view-key-approve-screen");

    await app.speculos.shareViewKey();
    await app.addAccount.tapCloseAddAccountCta();

    await app.portfolio.goToAccounts(Currency.ALEO.name, Currency.ALEO.id);
    await app.assetAccountsPage.waitForAccountPageToLoad(Currency.ALEO.name, undefined, true);
    await app.assetAccountsPage.expectAccountsBalanceVisible();
  });
});
