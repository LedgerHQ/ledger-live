import { setEnv } from "@ledgerhq/live-env";
import { BuySell } from "@ledgerhq/live-common/e2e/models/BuySell";
import { ApplicationOptions } from "page";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
import { getParentAccountName } from "@ledgerhq/live-common/lib/e2e/enum/Account";
import { isIos } from "../../helpers/commonHelpers";

setEnv("DISABLE_TRANSACTION_BROADCAST", true);

const liveDataCommand = (currencyApp: { name: string }, index: number) => (userdataPath?: string) =>
  CLI.liveData({
    currency: currencyApp.name,
    index,
    add: true,
    appjson: userdataPath,
  });

async function beforeAllFunction(options: ApplicationOptions) {
  await app.init({
    userdata: options.userdata,
    speculosApp: options.speculosApp,
    cliCommands: options.cliCommands,
    featureFlags: options.featureFlags,
  });
  await app.portfolio.waitForPortfolioPageToLoad();
}

async function handleBuySellFlow(buySell: BuySell, paymentMethod: string, provider: Provider) {
  await app.buySell.expectBuySellScreenToBeVisible(buySell.operation);
  await app.buySell.chooseAssetIfNotSelected(buySell.crypto);
  await app.buySell.verifyQuickAmountButtonsFunctionality();
  await app.buySell.setAmountToPay(buySell.amount);
  await app.buySell.chooseCountryIfNotSelected(buySell.fiat);
  await app.buySell.tapSeeQuotes();
  await app.buySell.selectPaymentMethod(paymentMethod);
  await app.buySell.selectProvider(provider.name);
  await app.buySell.tapBuySellWithCta(provider.uiName, buySell.operation);
  await app.buySell.verifyProviderPageLoadedWithQueryParameters(
    buySell,
    provider.uiName,
    paymentMethod,
  );
}

// NOTE: We skip these tests on iOS because the simulator is currently freezing and having issues with the BuySell Live App on iOS.
// This causes CI runs to hang or take much longer. Until we investigate and fix the root cause, we skip these tests on iOS to avoid slowing down CI execution.
// [JIRA: https://ledgerhq.atlassian.net/browse/QAA-769]

export async function runNavigateToBuyFromPortfolioPageTest(
  buySell: BuySell,
  provider: Provider,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  (isIos() ? describe.skip : describe)(
    "Navigate to Buy / Sell flow from portfolio page - LLM",
    () => {
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
        await app.transferMenuDrawer.open();
        await app.transferMenuDrawer.navigateToBuy();
        await handleBuySellFlow(buySell, paymentMethod, provider);
      });
    },
  );
}

export async function runNavigateToBuyFromAccountPageTest(
  buySell: BuySell,
  provider: Provider,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  (isIos() ? describe.skip : describe)(
    "Navigate to Buy / Sell flow from account page - LLM",
    () => {
      beforeAll(async () => {
        await beforeAllFunction({
          userdata: "skip-onboarding",
          speculosApp: buySell.crypto.currency.speculosApp,
          cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
        });
      });

      tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
      tags.forEach(tag => $Tag(tag));
      test(`Navigate to Buy / Sell [${buySell.crypto.currency.name}] asset from account page`, async () => {
        await app.accounts.openViaDeeplink();
        await app.accounts.goToAccountByName(getParentAccountName(buySell.crypto));
        if (buySell.crypto.tokenType) {
          await app.account.navigateToTokenInAccount(buySell.crypto);
        }
        await app.account.tapBuy();
        await handleBuySellFlow(buySell, paymentMethod, provider);
      });
    },
  );
}

export async function runNavigateToBuyFromMarketPageTest(
  buySell: BuySell,
  provider: Provider,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  (isIos() ? describe.skip : describe)("Navigate to Buy / Sell flow from market page - LLM", () => {
    beforeAll(async () => {
      await beforeAllFunction({
        userdata: "skip-onboarding",
        speculosApp: buySell.crypto.currency.speculosApp,
        cliCommands: [liveDataCommand(buySell.crypto.currency.speculosApp, buySell.crypto.index)],
        featureFlags: {
          llmMarketQuickActions: {
            enabled: true,
          },
        },
      });
    });

    tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
    tags.forEach(tag => $Tag(tag));
    test(`Navigate to Buy / Sell [${buySell.crypto.currency.name}] asset from market page`, async () => {
      await app.portfolio.tapWalletTabSelector("Market");
      await app.market.searchAsset(buySell.crypto.currency.ticker);
      await app.market.openAssetPage(buySell.crypto.currency.ticker);
      await app.market.tapOnMarketQuickActionButton("buy");
      await handleBuySellFlow(buySell, paymentMethod, provider);
    });
  });
}

export async function runNavigateToBuyFromAssetPageTest(
  buySell: BuySell,
  provider: Provider,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  (isIos() ? describe.skip : describe)("Navigate to Buy / Sell flow from asset page - LLM", () => {
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
      await handleBuySellFlow(buySell, paymentMethod, provider);
    });
  });
}

export async function runQueryParametersTest(
  buySell: BuySell,
  provider: Provider,
  paymentMethod: string,
  tmsLinks: string[],
  tags: string[],
) {
  (isIos() ? describe.skip : describe)("Buy / Sell flow - query parameters - LLM", () => {
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
      await handleBuySellFlow(buySell, paymentMethod, provider);
    });
  });
}
