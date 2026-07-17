import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { setTeamOwner } from "../../helpers/allure/allure-helper";
import { DEFAULT_TIMEOUT } from "../../helpers/elementHelpers";

const tmsLinks = ["B2CQA-4450", "B2CQA-4451", "B2CQA-4452"];
const tags = ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@aleo", "@family-aleo"];

describe("Add accounts - Aleo", () => {
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
  tmsLinks.forEach(link => $TmsLink(link));
  tags.forEach(tag => $Tag(tag));

  it(`Perform add account - ${Currency.ALEO.name}`, async () => {
    await app.portfolio.addAccount();
    await app.addAccount.importWithYourLedger();
    await app.modularDrawer.performSearchByTicker(Currency.ALEO.ticker);
    await app.modularDrawer.selectCurrencyByTicker(Currency.ALEO.ticker);
    await app.modularDrawer.selectNetworkIfAsked(Currency.ALEO.name);

    await waitForElementById("aleo-view-key-warning-screen");
    await tapById("aleo-view-key-warning-allow-button");

    await app.addAccount.addAccountAtIndex(`${Currency.ALEO.name} 1`, Currency.ALEO.id, 0);

    await waitForElementById("aleo-view-key-approve-screen", DEFAULT_TIMEOUT, {
      checkVisibility: false,
    });

    await app.speculos.shareViewKey();
    await app.addAccount.tapCloseAddAccountCta();

    await app.portfolio.goToAccounts(Currency.ALEO.name, Currency.ALEO.id);
    await app.assetAccountsPage.waitForAccountPageToLoad(Currency.ALEO.name, undefined, true);
    await app.assetAccountsPage.expectAccountsBalanceVisible();
  });
});
