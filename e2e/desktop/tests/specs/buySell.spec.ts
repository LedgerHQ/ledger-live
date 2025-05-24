import { test } from "../fixtures/common";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { CLI } from "../utils/cliUtils";
import { setupEnv } from "../utils/swapUtils";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { BuySell } from "@ledgerhq/live-common/e2e/models/BuySell";

const app: AppInfos = AppInfos.EXCHANGE;

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

const assets: Array<{ buy: BuySell; xrayTicket: string }> = [
  {
    buy: {
      crypto: Account.BTC_NATIVE_SEGWIT_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "2",
    },
    xrayTicket: "B2CQA-3392, B2CQA-3413, B2CQA-3466",
  },
  {
    buy: {
      crypto: Account.ETH_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "230",
    },
    xrayTicket: "B2CQA-3392, B2CQA-3413, B2CQA-3466",
  },
  {
    buy: {
      crypto: Account.ETH_USDT_1,
      fiat: { locale: "en-US", currencyTicker: "USD" },
      amount: "140",
    },
    xrayTicket: "B2CQA-3393, B2CQA-3414, B2CQA-3468",
  },
];

for (const asset of assets) {
  test.describe("Buy / Sell flow from different entry point", () => {
    setupEnv(true);

    const { crypto, fiat } = asset.buy;
    const ignoreForAccountPage = crypto === Account.ETH_USDT_1;

    test.use({
      userdata: "skip-onboarding",
      speculosApp: app,

      cliCommandsOnApp: [
        [
          {
            app: crypto.currency.speculosApp,
            cmd: liveDataCommand(crypto.currency.speculosApp, crypto.index),
          },
        ],
        { scope: "test" },
      ],
    });

    test(
      `Entry Point - Asset Allocation page with [${crypto.currency.name}] asset`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
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
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, "Buy");
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    test(
      `Entry Point - Market page with [${crypto.currency.name}] asset`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
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
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, "Buy");
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );

    const accountPageTest = ignoreForAccountPage ? test.skip : test;
    accountPageTest(
      `Entry Point - Account page with [${crypto.currency.name}] asset`,
      {
        tag: ["@NanoSP", "@LNS", "@NanoX"],
        annotation: {
          type: "TMS",
          description: asset.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(crypto.accountName);
        await app.account.clickBuy();

        await app.layout.verifyBuySellSideBarIsSelected();
        await app.buyAndSell.verifyBuySellLandingAndCryptoAssetSelector(crypto, "Buy");
        await app.buyAndSell.verifyFiatAssetSelector(fiat.currencyTicker);
      },
    );
  });
}
