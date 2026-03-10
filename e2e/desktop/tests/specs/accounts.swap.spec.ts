import test from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setExchangeDependencies } from "@ledgerhq/live-common/e2e/speculos";
import { Swap } from "@ledgerhq/live-common/e2e/models/Swap";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  handleSwapErrorOrSuccess,
  selectAccountMAD,
} from "tests/utils/swapUtils";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { liveDataWithAddressCommand } from "tests/utils/cliCommandsUtils";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

const app: AppInfos = AppInfos.EXCHANGE;

test.describe("Swap - Default currency when landing on swap", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;
  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(fromAccount),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(toAccount),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name} - Default currency`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: "B2CQA-3079" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
      await app.swap.checkAssetFrom(electronApp, "BTC");
      await app.swap.checkAssetTo(electronApp, "");
    },
  );

  test(
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name} - Previous set up`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: "B2CQA-3080" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);
      await app.layout.goToAccounts();
      await app.accounts.expectAccountsTitleVisibility();
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());
      await app.swap.checkAssetFrom(electronApp, swap.accountToDebit.currency.ticker);
      await app.swap.checkAssetTo(electronApp, swap.accountToCredit.currency.ticker);
    },
  );
});

test.describe("Swap - Rejected on device", () => {
  const fromAccount = Account.ETH_1;
  const toAccount = Account.BTC_NATIVE_SEGWIT_1;

  setupEnv(true);

  test.beforeEach(async () => {
    const accountPair: string[] = [fromAccount, toAccount].map(acc =>
      acc.currency.speculosApp.name.replace(/ /g, "_"),
    );
    setExchangeDependencies(accountPair.map(name => ({ name })));
  });

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: app,

    cliCommandsOnApp: [
      [
        {
          app: fromAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(fromAccount),
        },
        {
          app: toAccount.currency.speculosApp,
          cmd: liveDataWithAddressCommand(toAccount),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    `Swap ${fromAccount.currency.name} to ${toAccount.currency.name}`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: "B2CQA-2212" },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const rejectedSwap = new Swap(fromAccount, toAccount, minAmount);

      await performSwapUntilQuoteSelectionStep(app, electronApp, rejectedSwap, minAmount);
      await app.swap.selectExchangeWithoutKyc(electronApp);

      await app.swap.clickExchangeButton(electronApp);
      await app.speculos.verifyAmountsAndRejectSwap(rejectedSwap, minAmount);
      await app.swapDrawer.verifyExchangeErrorTextContent("Operation denied on device");
    },
  );
});

interface SwapTestCase {
  swap: Swap;
  xrayTicket: string;
  errorMessage?: string | null;
  expectedErrorPerDevice?: {
    [deviceId: string]: string;
  };
  addressFrom: string;
  addressTo: string;
}

const swapWithDifferentSeed: SwapTestCase[] = [
  {
    swap: new Swap(Account.ETH_1, Account.SOL_1, "0.03"),
    xrayTicket: "B2CQA-3089",
    errorMessage:
      "This sending account does not belong to the device you have connected. Please change and retry",
    addressFrom: Addresses.ETH_OTHER_SEED,
    addressTo: Addresses.SOL_OTHER_SEED,
    expectedErrorPerDevice: {
      [DeviceModelId.nanoS]:
        "This receiving account does not belong to the device you have connected. Please change and retry",
    },
  },
  {
    swap: new Swap(Account.BTC_NATIVE_SEGWIT_1, Account.ETH_1, "0.002"),
    xrayTicket: "B2CQA-3090",
    errorMessage: null,
    addressFrom: Addresses.BTC_NATIVE_SEGWIT_1,
    addressTo: Addresses.ETH_OTHER_SEED,
  },
  {
    swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03"),
    xrayTicket: "B2CQA-3091",
    errorMessage:
      "This sending account does not belong to the device you have connected. Please change and retry",
    addressFrom: Addresses.ETH_OTHER_SEED,
    addressTo: Addresses.BTC_NATIVE_SEGWIT_1,
    expectedErrorPerDevice: {
      [DeviceModelId.nanoS]:
        "This sending account does not belong to the device you have connected. Please change and retry",
    },
  },
];

for (const {
  swap,
  xrayTicket,
  errorMessage,
  expectedErrorPerDevice,
  addressFrom,
  addressTo,
} of swapWithDifferentSeed) {
  test.describe("Swap - Using different seed", () => {
    setupEnv(true);

    test.use({
      userdata: "speculos-x-other-account",
      speculosApp: app,
    });

    const familyDebit = getFamilyByCurrencyId(swap.accountToDebit.currency.id);
    const familyCredit = getFamilyByCurrencyId(swap.accountToCredit.currency.id);

    test.beforeEach(async () => {
      const accountPair = [swap.accountToDebit, swap.accountToCredit].map(acc =>
        acc.currency.speculosApp.name.replaceAll(" ", "_"),
      );
      setExchangeDependencies(accountPair.map(name => ({ name })));
    });

    test(
      `Swap using a different seed - ${swap.accountToDebit.currency.name} → ${swap.accountToCredit.currency.name}`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${swap.accountToDebit.currency.id}`,
          ...(familyDebit ? [`@family-${familyDebit}`] : []),
          `@${swap.accountToCredit.currency.id}`,
          ...(familyCredit ? [`@family-${familyCredit}`] : []),
        ],
        annotation: { type: "TMS", description: xrayTicket },
      },
      async ({ app, electronApp }) => {
        const tmsDescription = getDescription(test.info().annotations, "TMS");
        await addTmsLink(tmsDescription.split(", "));
        swap.accountToDebit.address = addressFrom;
        swap.accountToCredit.address = addressTo;

        const minAmount = await app.swap.getMinimumAmount(
          swap.accountToDebit,
          swap.accountToCredit,
        );

        await performSwapUntilQuoteSelectionStep(app, electronApp, swap, minAmount);

        await handleSwapErrorOrSuccess(
          app,
          electronApp,
          swap,
          minAmount,
          errorMessage ?? null,
          expectedErrorPerDevice,
        );
      },
    );
  });
}

test.describe("Swap a coin for which you have no account yet - from present to not present", () => {
  setupEnv(true);
  const account1 = Account.BTC_NATIVE_SEGWIT_1;
  const account2 = Account.ETH_1;
  const xrayTicket = "B2CQA-3353";

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account2.currency.speculosApp,
    cliCommandsOnApp: [
      [
        {
          app: account1.currency.speculosApp,
          cmd: liveDataWithAddressCommand(account1),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    "from Account present to Account not present",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectFromAccountCoinSelector(electronApp);

      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selectAccountMAD(selector, account1);

        await app.swap.selectToAccountCoinSelector(electronApp);
        await selector.selectAsset(account2.currency);
        await selector.selectNetwork(account2.currency);
        await selector.clickOnAddAndExistingAccount();

        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();
      } else {
        await app.swap.selectAssetFrom(electronApp, account1.currency.name);
        await app.swapDrawer.selectAccountByName(account1);

        await app.swap.selectAssetTo(electronApp, account2.currency.name);
        await app.swapDrawer.clickOnAddAccountButton();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.swapDrawer.selectAccountByName(account2);
      }
      await app.swap.checkAssetFrom(electronApp, account1.currency.name);
      await app.swap.checkAssetTo(electronApp, account2.currency.name);
    },
  );
});

test.describe("Swap a coin for which you have no account yet - from not present to present", () => {
  setupEnv(true);
  const account1 = Account.ETH_1;
  const account2 = Account.BTC_NATIVE_SEGWIT_1;
  const xrayTicket = "B2CQA-3354";

  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account1.currency.speculosApp,
    cliCommandsOnApp: [
      [
        {
          app: account2.currency.speculosApp,
          cmd: liveDataWithAddressCommand(account2),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    "from Account not present to Account present",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectFromAccountCoinSelector(electronApp);
      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selector.selectAsset(account1.currency);
        await selector.selectNetwork(account1.currency);
        await selector.clickOnAddAndExistingAccount();

        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();

        await app.swap.selectToAccountCoinSelector(electronApp);
        await selectAccountMAD(selector, account2);
      } else {
        await app.swap.selectAssetFrom(electronApp, account1.currency.name);
        await app.swapDrawer.clickOnAddAccountButton();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.swapDrawer.selectAccountByName(account1);

        await app.swap.selectAssetTo(electronApp, account2.currency.name);
        await app.swapDrawer.selectAccountByName(account2);
      }
      await app.swap.checkAssetFrom(electronApp, account1.currency.name);
      await app.swap.checkAssetTo(electronApp, account2.currency.name);
    },
  );
});

test.describe("Swap a coin for which you have no account yet - both not present", () => {
  const account1 = Account.ETH_1;
  const account2 = Account.BSC_1;
  const xrayTicket = "B2CQA-3355, B2CQA-3282, B2CQA-3288";

  setupEnv(true);

  test.use({
    userdata: "1AccountDOT",
    speculosApp: account2.currency.speculosApp,
  });

  test(
    "from Account not present to Account not present",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bsc",
      ],
      annotation: { type: "TMS", description: xrayTicket },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() => app.layout.goToSwap());

      await app.swap.selectFromAccountCoinSelector(electronApp);

      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selector.selectAsset(account1.currency);
        await selector.selectNetwork(account1.currency);
        await selector.clickOnAddAndExistingAccount();

        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();

        await app.swap.selectToAccountCoinSelector(electronApp);
        await selector.selectAsset(account2.currency);
        await selector.selectNetwork(account2.currency);
        await selector.clickOnAddAndExistingAccount();

        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickContinueButton();
        await app.swap.checkAssetFrom(electronApp, account1.currency.name);
        await app.swap.checkAssetTo(electronApp, account2.currency.name);
      }
    },
  );
});

test.describe("Swap - Switch You send and You receive currency", () => {
  const swap = new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "0.03");
  setupEnv(true);

  const accPair: string[] = [swap.accountToDebit, swap.accountToCredit].map(acc =>
    acc.currency.speculosApp.name.replace(/ /g, "_"),
  );

  test.beforeEach(async () => {
    setExchangeDependencies(
      accPair.map(appName => ({
        name: appName,
      })),
    );
  });

  test.use({
    userdata: "speculos-tests-app",
    speculosApp: app,
  });

  test(
    "Switch You send and You receive currency",
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        "@ethereum",
        "@family-evm",
        "@bitcoin",
        "@family-bitcoin",
      ],
      annotation: {
        type: "TMS",
        description: "B2CQA-2136",
      },
    },
    async ({ app, electronApp }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await performSwapUntilQuoteSelectionStep(app, electronApp, swap, swap.amount ?? "0");
      await app.swap.switchYouSendAndYouReceive(electronApp);
      await app.swap.checkAssetFrom(electronApp, swap.accountToCredit.currency.ticker);
      await app.swap.checkAssetTo(electronApp, swap.accountToDebit.currency.ticker);
    },
  );
});
