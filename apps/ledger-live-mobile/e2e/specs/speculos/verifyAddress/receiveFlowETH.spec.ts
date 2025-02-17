import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Application } from "../../../page";

const app = new Application("EthAccountXrpAccountReadOnlyFalse");
const account = Account.ETH_1;

describe("Receive Flow", () => {
  beforeAll(async () => {
    await app.init({
      speculosApp: account.currency.speculosApp,
    });

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  async function openReceive() {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.receive.openViaDeeplink();
  }

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.expectNumberOfAccountInListIsDisplayed("ethereum", 3);
    await app.receive.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.selectNetwork("optimism");
    await app.receive.createAccount();
    await app.receive.continueCreateAccount();
    await app.receive.expectAccountIsCreated("OP Mainnet 1");
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await app.common.performSearch("Polygon");
    await app.receive.selectCurrency("Polygon");
    await app.receive.selectNetwork("bsc");
    await app.receive.selectAccount("Binance Smart Chain 1");
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("BNB", "Binance Smart Chain 1");
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await openReceive();
    await app.receive.selectAsset("XRP");
    await app.receive.selectAccount("XRP 2");
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
