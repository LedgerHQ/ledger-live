import test from "../../fixtures/common";
import { Account } from "tests/enum/Account";
import { AppInfos } from "tests/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Fee } from "tests/enum/Fee";
import { Swap } from "tests/models/Swap";
import { Provider, Rates } from "tests/enum/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

const swaps = [
  {
    swap: new Swap(
      Account.ETH_1,
      Account.BTC_NATIVE_SEGWIT_1,
      "0.02",
      Fee.MEDIUM,
      Provider.CHANGELLY,
    ),
    xrayTicket: "B2CQA-2750",
  },
  {
    swap: new Swap(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.ETH_1,
      "0.00067",
      Fee.MEDIUM,
      Provider.CHANGELLY,
    ),
    xrayTicket: "B2CQA-2744",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.ETH_1, "40", Fee.MEDIUM, Provider.CHANGELLY),
    xrayTicket: "B2CQA-2752",
  },
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.018", Fee.MEDIUM, Provider.CHANGELLY),
    xrayTicket: "B2CQA-2748",
  },
  {
    swap: new Swap(Account.ETH_1, Account.ETH_USDT_1, "0.02", Fee.MEDIUM, Provider.CHANGELLY),
    xrayTicket: "B2CQA-2749",
  },
  {
    swap: new Swap(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.SOL_1,
      "0.0006",
      Fee.MEDIUM,
      Provider.CHANGELLY,
    ),
    xrayTicket: "B2CQA-2747",
  },
  {
    swap: new Swap(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.ETH_USDT_1,
      "0.0006",
      Fee.MEDIUM,
      Provider.CHANGELLY,
    ),
    xrayTicket: "B2CQA-2746",
  },
  {
    swap: new Swap(
      Account.ETH_USDT_1,
      Account.BTC_NATIVE_SEGWIT_1,
      "40",
      Fee.MEDIUM,
      Provider.CHANGELLY,
    ),
    xrayTicket: "B2CQA-2753",
  },
  {
    swap: new Swap(Account.ETH_USDT_1, Account.SOL_1, "40", Fee.MEDIUM, Provider.CHANGELLY),
    xrayTicket: "B2CQA-2751",
  },
];

const app: AppInfos = AppInfos.EXCHANGE;

for (const { swap, xrayTicket } of swaps) {
  test.describe("Swap", () => {
    test.beforeAll(async () => {
      process.env.SWAP_DISABLE_APPS_INSTALL = "true";
      process.env.SWAP_API_BASE = "https://swap-stg.ledger.com/v5";
    });

    test.beforeEach(async () => {
      setExchangeDependencies(
        accPair.map(appName => ({
          name: appName,
        })),
      );
    });

    test.afterAll(async () => {
      delete process.env.SWAP_DISABLE_APPS_INSTALL;
      delete process.env.SWAP_API_BASE;
    });

    const accPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );

    test.use({
      userdata: "speculos-tests-app",
      speculosApp: app,
    });

    test(
      `Swap ${swap.accountToDebit.currency.name} to ${swap.accountToCredit.currency.name}`,
      {
        annotation: {
          type: "TMS",
          description: xrayTicket,
        },
      },
      async ({ app, electronApp }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));
        const rate = Rates.FLOAT;
        await app.layout.goToSwap();
        await app.swap.waitForPageNetworkidleState();
        await app.swap.selectAccountToSwapFrom(swap.accountToDebit);
        await app.swap.selectCurrencyToSwapTo(swap.accountToCredit.currency.name);
        await app.swap.fillInOriginAmount(swap.amount);
        await app.swap.selectExchangeQuote(swap.provider.name, rate);
        await app.swap.clickExchangeButton(electronApp, swap.provider.uiName);
        const amountTo = await app.swapDrawer.getAmountToReceive();
        const fees = await app.swapDrawer.getFees();
        swap.setAmountToReceive(amountTo);
        swap.setFeesAmount(fees);
        await app.swapDrawer.verifyAmountToReceive(amountTo);
        await app.swapDrawer.verifyAmountSent(swap.amount, swap.accountToDebit.currency.ticker);
        await app.swapDrawer.verifySourceAccount(swap.accountToDebit.currency.name);
        await app.swapDrawer.verifyTargetCurrency(swap.accountToCredit.currency.name);
        await app.swapDrawer.verifyProvider(swap.provider.name);
        await app.speculos.verifyAmountsAndRejectSwap(swap);
        await app.swapDrawer.verifyExchangeErrorTextContent("Operation denied on device");
      },
    );
  });
}
