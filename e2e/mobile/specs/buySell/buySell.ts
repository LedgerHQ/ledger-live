import { setEnv } from "@ledgerhq/live-env";
import { BuySell } from "@ledgerhq/live-common/e2e/models/BuySell";
import { ApplicationOptions } from "page";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { isWallet40 } from "../../helpers/commonHelpers";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

export const liveDataCommand =
  (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
    CLI.liveData({
      currency: currencyApp.name,
      index,
      add: true,
      appjson: userdataPath,
    });

export async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
    featureFlags: options.featureFlags,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}

export async function handleBuyFlow(buySell: BuySell, paymentMethod: string) {
  await app.buySell.expectBuySellScreenToBeVisible(buySell.operation);
  await app.buySell.chooseAssetIfNotSelected(buySell.crypto);
  await app.buySell.verifyQuickAmountButtonsFunctionality();
  await app.buySell.setAmountToPay(buySell.amount);
  await app.buySell.chooseCountryIfNotSelected(buySell.fiat);
  await app.buySell.tapSeeQuotes();
  await app.buySell.selectPaymentMethod(paymentMethod);
  const selectedProvider = await app.buySell.selectRandomProvider();
  await app.buySell.tapBuySellWithCta(selectedProvider, buySell.operation);
  await app.buySell.verifyProviderPageLoadedWithCorrectUrl(selectedProvider);
}

export async function handleSellFlow(buySell: BuySell, paymentMethod: string, provider: Provider) {
  await app.buySell.expectBuySellScreenToBeVisible(buySell.operation);
  await app.buySell.chooseAssetIfNotSelected(buySell.crypto);
  await app.buySell.tapSellPercentageButton("50%");
  await app.buySell.chooseCountryIfNotSelected(buySell.fiat);
  await app.buySell.tapSeeQuotes();
  await app.buySell.selectPaymentMethod(paymentMethod);
  await app.buySell.selectProvider(provider.name);
  await app.buySell.tapBuySellWithCta(provider.uiName, buySell.operation);
  await app.buySell.verifyProviderPageLoadedWithCorrectUrl(provider.uiName);
}

export async function runNavigateToBuyFromPortfolioPageTest(
  buySell: BuySell,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Navigate to Buy / Sell flow from portfolio page - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Buy / Sell [${buySell.crypto.currency.name}] asset from portfolio page`, async () => {
      if (isWallet40) {
        await app.portfolio.pressQuickActionBuyButton();
      } else {
        await app.transferMenuDrawer.open();
        await app.transferMenuDrawer.navigateToBuy();
      }

      await handleBuyFlow(buySell, paymentMethod);
    });
  });
}

export async function runNavigateToBuyFromAccountPageTest(
  buySell: BuySell,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Navigate to Buy / Sell flow from account page - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
        featureFlags: {
          llmAccountListUI: { enabled: true },
        },
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Navigate to Buy / Sell [${buySell.crypto.currency.name}] asset from account page`, async () => {
      await app.accounts.openViaDeeplink();
      await app.common.goToAccountByName(getParentAccountName(buySell.crypto));
      if (buySell.crypto.tokenType) {
        await app.account.navigateToTokenInAccount(buySell.crypto);
      }
      await app.account.tapBuy();
      await handleBuyFlow(buySell, paymentMethod);
    });
  });
}

export async function runNavigateToBuyFromMarketPageTest(
  buySell: BuySell,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Navigate to Buy / Sell flow from market page - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Navigate to Buy / Sell [${buySell.crypto.currency.name}] asset from market page`, async () => {
      if (isWallet40) {
        await app.portfolio.tapMarketBannerTitle();
      } else {
        await app.portfolio.tapWalletTabSelector("Market");
      }
      await app.market.searchAsset(buySell.crypto.currency.ticker);
      await app.market.expectMarketRowTitle(buySell.crypto.currency.ticker);
      await app.market.openAssetPage(buySell.crypto.currency.ticker);
      await app.market.tapOnMarketQuickActionButton("buy");
      await handleBuyFlow(buySell, paymentMethod);
    });
  });
}

export async function runNavigateToBuyFromAssetPageTest(
  buySell: BuySell,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Navigate to Buy / Sell flow from asset page - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Navigate to Buy / Sell [${buySell.crypto.currency.name}] asset from asset page`, async () => {
      await app.portfolio.goToSpecificAsset(buySell.crypto.currency.name);
      await app.assetAccountsPage.waitForAccountPageToLoad(buySell.crypto.currency.name);
      await app.assetAccountsPage.tapOnAssetQuickActionButton("buy");
      await handleBuyFlow(buySell, paymentMethod);
    });
  });
}

export async function runSellFlowTest(
  buySell: BuySell,
  provider: Provider,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe(`Sell flow - ${buySell.crypto.currency.name} - LLM`, () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Sell [${buySell.crypto.currency.name}] flow via deeplink`, async () => {
      await app.buySell.openViaDeeplink(buySell.operation);
      await handleSellFlow(buySell, paymentMethod, provider);
    });
  });
}

export async function runQueryParametersTest(
  buySell: BuySell,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  describe("Buy / Sell flow - query parameters - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Buy / Sell [${buySell.crypto.currency.name}] asset - query parameters`, async () => {
      await app.buySell.openViaDeeplink(buySell.operation);
      await handleBuyFlow(buySell, paymentMethod);
    });
  });
}
