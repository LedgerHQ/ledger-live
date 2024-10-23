import { Application } from "../../page";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";

let app: Application;
let deviceNumber: number;

const currencies = [
  { currency: Currency.BTC, tmsLink: "B2CQA-2499, B2CQA-2644, B2CQA-2672, B2CQA-786" },
  { currency: Currency.ETH, tmsLink: "B2CQA-2503, B2CQA-2645, B2CQA-2673" },
  { currency: Currency.ETC, tmsLink: "B2CQA-2502, B2CQA-2646, B2CQA-2674" },
  { currency: Currency.XRP, tmsLink: "B2CQA-2505, B2CQA-2647, B2CQA-2675" },
  { currency: Currency.DOT, tmsLink: "B2CQA-2504, B2CQA-2648, B2CQA-2676" },
  { currency: Currency.TRX, tmsLink: "B2CQA-2508, B2CQA-2649, B2CQA-2677" },
  { currency: Currency.ADA, tmsLink: "B2CQA-2500, B2CQA-2650, B2CQA-2678" },
  { currency: Currency.XLM, tmsLink: "B2CQA-2506, B2CQA-2651, B2CQA-2679" },
  { currency: Currency.BCH, tmsLink: "B2CQA-2498, B2CQA-2652, B2CQA-2680" },
  { currency: Currency.ALGO, tmsLink: "B2CQA-2497, B2CQA-2653, B2CQA-2681" },
  { currency: Currency.ATOM, tmsLink: "B2CQA-2501, B2CQA-2654, B2CQA-2682" },
  { currency: Currency.XTZ, tmsLink: "B2CQA-2507, B2CQA-2655, B2CQA-2683" },
  { currency: Currency.SOL, tmsLink: "B2CQA-2642, B2CQA-2656, B2CQA-2684" },
  { currency: Currency.TON, tmsLink: "B2CQA-2643, B2CQA-2657, B2CQA-2685" },
];

beforeAll(async () => {
  app = await Application.init("onboardingcompleted");
  await app.portfolio.waitForPortfolioPageToLoad();
});

currencies.forEach(({ currency, tmsLink }) => {
  $TmsLink(tmsLink);
  describe(`Add accounts - ${currency.name}`, () => {
    it(`Perform an add account`, async () => {
      await app.addAccount.openViaDeeplink();
      await app.common.performSearch(currency.name);
      await app.addAccount.selectCurrency(currency.currencyId);

      deviceNumber = await app.common.addSpeculos(currency.speculosApp.name);

      await app.addAccount.startAccountsDiscovery();
      await app.addAccount.expectAccountDiscovery(currency.name, currency.currencyId);
      await app.addAccount.finishAccountsDiscovery();
      await app.addAccount.tapSuccessCta();
      await app.account.waitForAccountPageToLoad(currency.name);
      await app.account.expectAccountBalanceVisible();
    });

    afterAll(async () => {
      await app.common.removeSpeculos(deviceNumber);
    });
  });
});
