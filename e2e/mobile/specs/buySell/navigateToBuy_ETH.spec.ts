import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { beforeAllFunction, handleBuySellFlow, liveDataCommand } from "./buySell";

const usdtBuySell = {
  crypto: TokenAccount.ETH_USDT_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "900",
  operation: OperationType.Buy,
};

const ethBuySell = {
  crypto: Account.ETH_1,
  fiat: { locale: "en-US", currencyTicker: "USD" },
  amount: "230",
  operation: OperationType.Buy,
};

const provider = Provider.MOONPAY;
const paymentMethod = "card";

const tags = [
  "@NanoSP",
  "@LNS",
  "@NanoX",
  "@Stax",
  "@Flex",
  "@NanoGen5",
  "@ethereum",
  "@family-evm",
];

describe("Navigate to Buy from market and asset pages - ETH", () => {
  beforeAll(async () => {
    await beforeAllFunction({
      userdata: "skip-onboarding",
      speculosApp: ethBuySell.crypto.currency.speculosApp,
      cliCommands: [
        liveDataCommand(ethBuySell.crypto.currency.speculosApp, ethBuySell.crypto.index),
        liveDataCommand(usdtBuySell.crypto.currency.speculosApp, usdtBuySell.crypto.index),
      ],
    });
  });

  $TmsLink("B2CQA-3414");
  tags.forEach(tag => $Tag(tag));
  it("should navigate to Buy USDT from market page", async () => {
    await app.market.openViaDeeplink();
    await app.market.searchAsset(usdtBuySell.crypto.currency.ticker);
    await app.market.expectMarketRowTitle(usdtBuySell.crypto.currency.ticker);
    await app.market.openAssetPage(usdtBuySell.crypto.currency.ticker);
    await app.market.tapOnMarketQuickActionButton("buy");
    await handleBuySellFlow(usdtBuySell, paymentMethod, provider);
  });

  $TmsLink("B2CQA-3392");
  [...tags, "@smoke"].forEach(tag => $Tag(tag));
  it("should navigate to Buy ETH from asset page", async () => {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.goToSpecificAsset(ethBuySell.crypto.currency.name);
    await app.assetAccountsPage.waitForAccountPageToLoad(ethBuySell.crypto.currency.name);
    await app.assetAccountsPage.tapOnAssetQuickActionButton("buy");
    await handleBuySellFlow(ethBuySell, paymentMethod, provider);
  });
});
