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

test.describe("Swap Discreet mode", () => {
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
    "No amount should be visible in the asset drawer",
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
    "Balance should not be visible in the swap widget",
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
      for (const account of fundedAssetsAccounts) {
        await app.swap.selectFromAccountCoinSelector();
        await app.modularDialog.selectAsset(account.currency);
        await app.modularDialog.selectNetwork(account.currency);
        await app.modularDialog.selectAccountByName(account);
        await app.swap.checkAssetFromContains(account.currency.ticker);
        await app.swap.checkFromAccountBalanceIsDiscreet(account.currency.ticker);
      }
    },
  );

  test(
    "Balance should not be visible in the swap main form",
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
      await app.swap.goAndWaitForSwapToBeReady(() =>
        app.mainNavigation.openTargetFromMainNavigation("swap"),
      );
      for (const account of fundedAssetsAccounts) {
        await app.swap.selectFromAccountCoinSelector();
        await app.modularDialog.selectAsset(account.currency);
        await app.modularDialog.selectNetwork(account.currency);
        await app.modularDialog.selectAccountByName(account);
        await app.swap.checkAssetFromContains(account.currency.ticker);
        await app.swap.checkFromAccountBalanceIsDiscreet(account.currency.ticker);
      }
    },
  );
});
