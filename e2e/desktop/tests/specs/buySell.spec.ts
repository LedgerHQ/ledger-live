import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { setupEnv } from "tests/utils/swapUtils";
import { BuySell } from "@ledgerhq/live-e2e-shared/models/BuySell";
import { OperationType } from "@ledgerhq/live-e2e-shared/enum/OperationType";
import { liveDataCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { getMinimumSellAmount } from "@ledgerhq/live-e2e-shared/buySell";
import { buildTags, DEVICE_TAGS } from "tests/utils/tagsUtils";

const assets: Array<{ buySell: BuySell; xrayTicket: string }> = [
  {
    buySell: {
      crypto: Account.BTC_NATIVE_SEGWIT_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "900",
      operation: OperationType.Buy,
    },
    xrayTicket:
      "B2CQA-3391, B2CQA-3412, B2CQA-3467, B2CQA-3520, B2CQA-3521, B2CQA-3449, B2CQA-3282",
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
  },
  {
    buySell: {
      crypto: TokenAccount.ETH_USDT_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "900",
      operation: OperationType.Buy,
    },
    xrayTicket: "B2CQA-3393, B2CQA-3414, B2CQA-3468, B2CQA-3518, B2CQA-3523, B2CQA-3449",
  },
];

for (const asset of assets) {
  test.describe("Buy / Sell flow from different entry point", () => {
    setupEnv(true);

    const { crypto, fiat, operation, amount } = asset.buySell;

    test.use({
      teamOwner: Team.BUY_AND_SELL,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: crypto.currency.speculosApp,
      cliCommands: [liveDataCommand(crypto)],
      speculosForSetupOnly: true,
    });

    test(
      `Entry Point - Asset Allocation page with [${crypto.currency.name}] asset`,
      {
        tag: buildTags({ currencyId: crypto.currency.id }),
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.clickAsset(crypto.currency);
        await app.assetPage.startBuyFlow();
        await app.buyAndSell.selectNetworkAndAccountIfShown(crypto);
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, operation);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    test(
      `Entry Point - Market page with [${crypto.currency.name}] asset`,
      {
        tag: [...DEVICE_TAGS],
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.marketBanner.clickExploreMarketHeader();
        await app.market.search(crypto.currency.ticker);
        await app.market.openBuyPage(crypto.currency.ticker);
        await app.buyAndSell.selectNetworkAndAccountIfShown(crypto);
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, operation);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    test(
      `Entry Point - Account page with [${crypto.currency.name}] asset`,
      {
        tag: buildTags({ currencyId: crypto.currency.id }),
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
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
        tag: buildTags({ currencyId: crypto.currency.id }),
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app, userdataDestinationPath }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.portfolio.clickBuyButton();
        await app.buyAndSell.chooseAssetIfNotSelected(crypto);
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, operation);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
        await app.buyAndSell.verifyBuyInfoBox();
        await app.buyAndSell.verifyProviderInfoIsNotVisible();
        await app.buyAndSell.setAmountToPay(amount, operation);
        const provider = await app.buyAndSell.selectRandomProvider(operation);
        await app.buyAndSell.selectQuote();
        await app.buyAndSell.verifyProviderUrl(provider, asset.buySell, userdataDestinationPath);
      },
    );
  });
}

const sellAssets: Array<{ buySell: Omit<BuySell, "amount">; xrayTicket: string }> = [
  {
    buySell: {
      crypto: Account.BTC_NATIVE_SEGWIT_1,
      fiat: { locale: "fr-FR", currencyTicker: "EUR" },
      operation: OperationType.Sell,
    },
    xrayTicket: "B2CQA-6131",
  },
  {
    buySell: {
      crypto: Account.ETH_1,
      fiat: { locale: "fr-FR", currencyTicker: "EUR" },
      operation: OperationType.Sell,
    },
    xrayTicket: "B2CQA-6132",
  },
  {
    buySell: {
      crypto: TokenAccount.ETH_USDT_1,
      fiat: { locale: "fr-FR", currencyTicker: "EUR" },
      operation: OperationType.Sell,
    },
    xrayTicket: "B2CQA-6133",
  },
];

for (const sellAsset of sellAssets) {
  test.describe("Sell flow - ", () => {
    setupEnv(true);

    const { crypto, fiat, operation } = sellAsset.buySell;

    test.use({
      teamOwner: Team.BUY_AND_SELL,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: crypto.currency.speculosApp,
      cliCommands: [liveDataCommand(crypto)],
      speculosForSetupOnly: true,
    });

    test(
      `Sell [${crypto.currency.name}] asset`,
      {
        tag: buildTags({ currencyId: crypto.currency.id }),
        annotation: {
          type: "TMS",
          description: sellAsset.xrayTicket,
        },
      },
      async ({ app, userdataDestinationPath }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.portfolio.clickSellButton();
        await app.buyAndSell.chooseAssetIfNotSelected(crypto);
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, OperationType.Sell);
        await app.buyAndSell.verifyFiatAssetSelector("USD");
        await app.buyAndSell.verifySellInfoBox();
        await app.buyAndSell.verifyProviderInfoIsNotVisible();
        await app.buyAndSell.changeRegionAndCurrency(fiat);
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
        const amount = await getMinimumSellAmount(crypto.currency.id);
        const buySell = { ...sellAsset.buySell, amount };
        await app.buyAndSell.setAmountToPay(amount, operation);
        const provider = await app.buyAndSell.selectRandomProvider(operation);
        await app.buyAndSell.selectQuote();
        await app.buyAndSell.verifyProviderUrl(provider, buySell, userdataDestinationPath);
      },
    );
  });
}
