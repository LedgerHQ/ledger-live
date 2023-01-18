import { expect, by, element } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import Mainaccount from "../models/account/mainAccount";
import Account from "../models/account/account";
import TokenAccount from "../models/account/tokenAccount";
import { loadConfig } from "../bridge/server";

let portfolioPage: PortfolioPage;
let mainAccount: Mainaccount;
let account: Account;
let tokenAccount: TokenAccount;
let coinName = "Ethereum";
let tokenName = "USD Coin";

describe("Open existing Erc20 token account", () => {
  beforeAll(async () => {
    await loadConfig("dataSetEthTokenAccount", true);
    portfolioPage = new PortfolioPage();
    mainAccount = new Mainaccount();
    account = new Account();
    tokenAccount = new TokenAccount();
  });

  it("Open multi account page", async () => {
    await portfolioPage.openFamilyAccount(coinName);
  });

  it("Open account page", async () => {
    await mainAccount.openCryptoAccount(coinName);
  });

  it("Open token account page", async () => {
    await element(by.id("account-graph-currency")).swipe("up");
    await account.openTokenAccount(tokenName);
  });

  it("token account is opened", async () => {
    expect(tokenAccount.getTokenTitle(tokenName)).toBeVisible();
  });
});
