import { setEnv } from "@ledgerhq/live-env";
import { BuySell } from "@ledgerhq/live-common/e2e/models/BuySell";
import { ApplicationOptions } from "page";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { isWallet40 } from "../../helpers/commonHelpers";
import { liveDataCommand } from "@ledgerhq/live-common/e2e";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

export async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
    featureFlags: options.featureFlags,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
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
        cliCommands: [liveDataCommand(buySell.crypto)],
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

      await app.buySell.handleBuyFlow(buySell, paymentMethod);
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
        cliCommands: [liveDataCommand(buySell.crypto)],
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
      await app.buySell.handleBuyFlow(buySell, paymentMethod);
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
        cliCommands: [liveDataCommand(buySell.crypto)],
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
      await app.buySell.handleBuyFlow(buySell, paymentMethod);
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
        cliCommands: [liveDataCommand(buySell.crypto)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Navigate to Buy / Sell [${buySell.crypto.currency.name}] asset from asset page`, async () => {
      await app.portfolio.goToSpecificAsset(buySell.crypto.currency.name);
      await app.assetAccountsPage.waitForAccountPageToLoad(buySell.crypto.currency.name);
      await app.assetAccountsPage.tapOnAssetQuickActionButton("buy");
      await app.buySell.handleBuyFlow(buySell, paymentMethod);
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
        cliCommands: [liveDataCommand(buySell.crypto)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Sell [${buySell.crypto.currency.name}] flow via deeplink`, async () => {
      await app.buySell.openViaDeeplink(buySell.operation);
      await app.buySell.handleSellFlow(buySell, paymentMethod, provider);
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
        cliCommands: [liveDataCommand(buySell.crypto)],
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Buy / Sell [${buySell.crypto.currency.name}] asset - query parameters`, async () => {
      await app.buySell.openViaDeeplink(buySell.operation);
      await app.buySell.handleBuyFlow(buySell, paymentMethod);
    });
  });
}
