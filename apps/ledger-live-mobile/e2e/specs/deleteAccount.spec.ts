import { expect } from "detox";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { loadAccounts, loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import AccountPage from "../models/accounts/accountPage";
import AccountsPage from "../models/accounts/accountsPage";

import { scrollToId, tapByElement, tapById } from "../helpers";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { getElementByText, itifAndroid } from "../helpers";

let portfolioPage: PortfolioPage;
let accountPage: AccountPage;
let accountsPage: AccountsPage;

const testedCurrencies: CryptoCurrencyId[] = ["bitcoin"]; //, "ethereum", "cosmos"
const testAccounts = testedCurrencies.map(currencyId =>
  genAccount("mock" + currencyId, { currency: getCryptoCurrencyById(currencyId) }),
);
setSupportedCurrencies(testedCurrencies);

describe("Load accounts", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadAccounts(testAccounts);
    portfolioPage = new PortfolioPage();
    accountPage = new AccountPage();
    accountsPage= new AccountsPage();
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it.each(testAccounts.map(account => [account.currency.name, account]))(
    "%s: delete accounts",
    async (currency, account: Account) => {
      await portfolioPage.openViaDeeplink(); //Same starting state between all currency
      await accountPage.openViaDeeplink(currency);
      await accountPage.waitForAccountAssetsToLoad(currency);
      await scrollToId("account-row-" + account.name, "accounts-list-scrollView");
      await tapById("account-row-" + account.name);
      await tapById("account-settings-button");
      await tapById("account-settings-delete");
      await tapById("account-settings-delete-confirm");
    },
  );

  it.each(testAccounts.map(account => [account.currency.name, account]))(
    "%s: account should be deleted",
    async (currency, account: Account) => {
      await portfolioPage.openViaDeeplink(); //Same starting state between all currency
      await accountPage.openViaDeeplink(currency);
      await accountPage.waitForAccountAssetsToLoad(currency);
      const curr = account.currency.ticker;
      await expect(getElementByText(`You have no ${curr} yet`)).toExist();
    },
  );
});
