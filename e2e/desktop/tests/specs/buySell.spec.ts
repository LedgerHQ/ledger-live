import { test } from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "tests/utils/cliUtils";
import { setupEnv } from "tests/utils/swapUtils";
import { BuySell } from "@ledgerhq/live-common/e2e/models/BuySell";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { OperationType } from "@ledgerhq/live-common/e2e/enum/OperationType";

const assets: Array<{ buySell: BuySell; xrayTicket: string; provider: Provider }> = [
  {
    buySell: {
      crypto: Account.BTC_NATIVE_SEGWIT_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "900",
      operation: OperationType.Buy,
    },
    xrayTicket:
      "B2CQA-3391, B2CQA-3412, B2CQA-3467, B2CQA-3520, B2CQA-3521, B2CQA-3449, B2CQA-3282",
    provider: Provider.MOONPAY,
  },
  {
    buySell: {
      crypto: Account.ETH_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "230",
      operation: OperationType.Buy,
    },
    xrayTicket:
      "B2CQA-3392, B2CQA-3413, B2CQA-3466, B2CQA-3519, B2CQA-3522, B2CQA-3449, B2CQA-3289",
    provider: Provider.MOONPAY,
  },
  {
    buySell: {
      crypto: TokenAccount.ETH_USDT_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "900",
      operation: OperationType.Buy,
    },
    xrayTicket: "B2CQA-3393, B2CQA-3414, B2CQA-3468, B2CQA-3518, B2CQA-3523, B2CQA-3449",
    provider: Provider.MOONPAY,
  },
];

for (const asset of assets) {
  test.describe("Buy / Sell flow from different entry point", () => {
    setupEnv(true);

    const { crypto, fiat, operation, amount } = asset.buySell;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: crypto.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: crypto.currency.speculosApp.name,
            index: crypto.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
    });

    test(
      `Entry Point - Asset Allocation page with [${crypto.currency.name}] asset`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.layout.goToPortfolio();
        await app.portfolio.clickOnSelectedAssetRow(crypto.currency.name);
        await app.assetPage.startBuyFlow();

        await app.layout.verifyBuySellSideBarIsSelected();
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, operation);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    test(
      `Entry Point - Market page with [${crypto.currency.name}] asset`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.layout.goToMarket();
        await app.market.search(crypto.currency.name);
        await app.market.openBuyPage(crypto.currency.ticker);

        await app.layout.verifyBuySellSideBarIsSelected();
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, operation);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    test(
      `Entry Point - Account page with [${crypto.currency.name}] asset`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(getParentAccountName(asset.buySell.crypto));
        if (asset.buySell.crypto.tokenType) {
          await app.account.navigateToTokenInAccount(asset.buySell.crypto);
        }
        await app.account.verifyAccountHeaderNameIsVisible(
          asset.buySell.crypto.tokenType
            ? asset.buySell.crypto.currency.name
            : asset.buySell.crypto.accountName,
        );
        await app.account.clickBuy();

        await app.layout.verifyBuySellSideBarIsSelected();
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(
          asset.buySell.crypto,
          operation,
        );
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    test(
      `Buy [${crypto.currency.name}] asset from portfolio page`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app, userdataDestinationPath }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.portfolio.clickBuySellButton();

        await app.layout.verifyBuySellSideBarIsSelected();
        await app.buyAndSell.chooseAssetIfNotSelected(crypto);
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, operation);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
        await app.buyAndSell.verifyInfoBox();
        await app.buyAndSell.verifyProviderInfoIsNotVisible();

        await app.buyAndSell.setAmountToPay(amount, operation);
        await app.buyAndSell.selectProviderQuote(operation, asset.provider.uiName);
        await app.buyAndSell.selectQuote();

        await app.buyAndSell.verifyProviderUrl(
          asset.provider.uiName,
          asset.buySell,
          userdataDestinationPath,
        );
      },
    );
  });
}

const sellAsset: { buySell: BuySell; xrayTicket: string; provider: Provider } = {
  buySell: {
    crypto: Account.BTC_NATIVE_SEGWIT_1,
    fiat: { locale: "fr-FR", currencyTicker: "EUR" },
    amount: "0.0006",
    operation: OperationType.Sell,
  },
  xrayTicket: "B2CQA-3524",
  provider: Provider.MOONPAY,
};

test.describe("Sell flow - ", () => {
  setupEnv(true);

  const { crypto, fiat, amount, operation } = sellAsset.buySell;

  test.use({
    userdata: "skip-onboarding",
    speculosApp: crypto.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: crypto.currency.speculosApp.name,
          index: crypto.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });

  test(
    `Sell [${crypto.currency.name}] asset`,
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
      annotation: {
        type: "TMS",
        description: sellAsset.xrayTicket,
      },
    },
    async ({ app, userdataDestinationPath }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.layout.goToBuySellCrypto();

      await app.layout.verifyBuySellSideBarIsSelected();
      await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, OperationType.Buy);
      await app.buyAndSell.verifyFiatAssetSelector("USD");
      await app.buyAndSell.verifyInfoBox();
      await app.buyAndSell.verifyProviderInfoIsNotVisible();

      await app.buyAndSell.selectTab(operation);
      await app.buyAndSell.changeRegionAndCurrency(fiat);
      await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);

      await app.buyAndSell.setAmountToPay(amount, operation);
      await app.buyAndSell.selectProviderQuote(operation, sellAsset.provider.uiName);
      await app.buyAndSell.selectQuote();

      await app.buyAndSell.verifyProviderUrl(
        sellAsset.provider.uiName,
        sellAsset.buySell,
        userdataDestinationPath,
      );
    },
  );
});
