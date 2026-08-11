import { Account, type AccountType, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import test from "tests/fixtures/common";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { setupEnv } from "tests/utils/swapUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const xrayTicket = "B2CQA-2457";
const fundedAssetsAccounts: AccountType[] = [
  Account.BTC_NATIVE_SEGWIT_1,
  Account.ETH_1,
  TokenAccount.ETH_USDC_1,
  TokenAccount.ETH_USDT_1,
];
// Masking is currency-agnostic, so a single account covers the balance-masking checks below.
const balanceCheckAccount = Account.ETH_1;

test.describe("Swap - discreet mode", () => {
  setupEnv();

  test.use({
    teamOwner: Team.SWAP,
    userdata: "discreet-mode-on",

    cliCommandsOnApp: [
      [
        {
          app: Account.BTC_NATIVE_SEGWIT_1.currency.speculosApp,
          cmd: liveDataWithAddressCommand(Account.BTC_NATIVE_SEGWIT_1),
        },
        {
          app: Account.ETH_1.currency.speculosApp,
          cmd: liveDataWithAddressCommand(Account.ETH_1),
        },
      ],
      { scope: "test" },
    ],
  });

  test(
    "Swap amount is hidden in the asset drawer in discreet mode",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin"],
      annotation: [
        {
          type: "TMS",
          description: xrayTicket,
        },
      ],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      const fundedAssetTickers = fundedAssetsAccounts.map(account => account.currency.ticker);
      await app.swap.selectFromAccountCoinSelector();
      await app.modularDialog.validateItems();
      await app.modularDialog.checkAssetAmountsAreDiscreet(fundedAssetTickers);
    },
  );

  test(
    "Swap balance is hidden in the swap widget in discreet mode",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: [
        {
          type: "TMS",
          description: xrayTicket,
        },
      ],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.selectFromAccountCoinSelector();
      await app.modularDialog.selectAsset(balanceCheckAccount.currency);
      await app.modularDialog.selectNetwork(balanceCheckAccount.currency);
      await app.modularDialog.selectAccountByName(balanceCheckAccount);
      await app.swap.checkAssetFromContains(balanceCheckAccount.currency.ticker);
      await app.swap.checkFromAccountBalanceIsDiscreet(balanceCheckAccount.currency.ticker);
    },
  );

  test(
    "Swap balance is hidden in the swap main form in discreet mode",
    {
      tag: [...DEVICE_TAGS, "@ethereum", "@family-evm"],
      annotation: [
        {
          type: "TMS",
          description: xrayTicket,
        },
      ],
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("swap"),
      );
      await app.swap.selectFromAccountCoinSelector();
      await app.modularDialog.selectAsset(balanceCheckAccount.currency);
      await app.modularDialog.selectNetwork(balanceCheckAccount.currency);
      await app.modularDialog.selectAccountByName(balanceCheckAccount);
      await app.swap.checkAssetFromContains(balanceCheckAccount.currency.ticker);
      await app.swap.checkFromAccountBalanceIsDiscreet(balanceCheckAccount.currency.ticker);
    },
  );
});
