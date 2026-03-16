import { setEnv } from "@ledgerhq/live-env";
import { BuySell } from "@ledgerhq/live-common/e2e/models/BuySell";
import { ApplicationOptions } from "page";
import { Provider } from "@ledgerhq/live-common/e2e/enum/Provider";
<<<<<<< HEAD
import { getParentAccountName } from "@ledgerhq/live-common/e2e/enum/Account";
import { isWallet40 } from "../../helpers/commonHelpers";
=======
>>>>>>> 987b24d8686 (refactor(e2e): merging buySell tests to speedup CI)

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

export async function handleBuySellFlow(
  buySell: BuySell,
  paymentMethod: string,
  provider: Provider,
) {
  await app.buySell.expectBuySellScreenToBeVisible(buySell.operation);
  await app.buySell.chooseAssetIfNotSelected(buySell.crypto);
  await app.buySell.verifyQuickAmountButtonsFunctionality();
  await app.buySell.setAmountToPay(buySell.amount);
  await app.buySell.chooseCountryIfNotSelected(buySell.fiat);
  await app.buySell.tapSeeQuotes();
  await app.buySell.selectPaymentMethod(paymentMethod);
  await app.buySell.selectProvider(provider.name);
  await app.buySell.tapBuySellWithCta(provider.uiName, buySell.operation);
  await app.buySell.verifyProviderPageLoadedWithCorrectUrl(provider.uiName);
}

export async function runQueryParametersTest(
  buySell: BuySell,
  provider: Provider,
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
      await handleBuySellFlow(buySell, paymentMethod, provider);
    });
  });
}
