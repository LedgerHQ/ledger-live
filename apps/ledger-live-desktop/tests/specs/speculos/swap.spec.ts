import test from "../../fixtures/common";
import { Account } from "tests/enum/Account";
import { AppInfos } from "tests/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Fee } from "tests/enum/Fee";
import { Swap } from "tests/models/Swap";
import { Providers, Rates } from "tests/enum/Swap";

const swaps = [
  {
    swap: new Swap(Account.ETH_1, Account.BTC_1, "0.015", Fee.MEDIUM),
  },
];

const app: AppInfos = AppInfos.EXCHANGE;

for (const { swap } of swaps) {
  test.beforeAll(async () => {
    process.env.SWAP_DISABLE_APPS_INSTALL = "true";
    process.env.SWAP_API_BASE = "https://swap-stg.ledger.com/v5";
  });

  test.afterAll(async () => {
    delete process.env.SWAP_DISABLE_APPS_INSTALL;
    delete process.env.SWAP_API_BASE;
  });

  test.describe.serial("Swap", () => {
    const accPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
      acc.currency.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(
      accPair.map(appName => ({
        name: appName,
      })),
    );
    test.use({
      userdata: "speculos-tests-app",
      speculosApp: app,
    });

    test(`Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`, async ({
      app,
      electronApp,
    }) => {
      const provider = Providers.CHANGELLY;
      const rate = Rates.FLOAT;
      await app.layout.goToSwap();
      await app.swap.selectAccountToSwapFrom(swap.accountToDebit.accountName);
      await app.swap.selectCurrencyToSwapTo(swap.accountToCredit.currency.name);

      await app.swap.fillInOriginAmount(swap.amount);
      await app.swap.selectExchangeQuote(provider, rate);
      await app.swap.clickExchangeButton(electronApp, provider);
      const amountTo = await app.swapDrawer.getAmountToReceive();
      const fees = await app.swapDrawer.getFees();
      swap.setAmountToReceive(amountTo);
      swap.setFeesAmount(fees);
      await app.swapDrawer.verifyAmountToReceive(amountTo);
      await app.swapDrawer.verifyAmountSent(swap.amount, swap.accountToDebit.currency.ticker);
      await app.swapDrawer.verifySourceAccount(swap.accountToDebit.currency.name);
      await app.swapDrawer.verifyTargetCurrency(swap.accountToCredit.currency.name);
      await app.swapDrawer.verifyProvider(provider);
      await app.speculos.verifyAmountsAndRejectSwap(swap);
      await app.swapDrawer.verifyExchangeErrorTextContent("Operation denied on device");
    });
  });
}
