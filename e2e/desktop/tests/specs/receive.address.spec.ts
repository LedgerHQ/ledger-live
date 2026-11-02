import { test } from "tests/fixtures/common";
import { TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { coinTeamOwner } from "@ledgerhq/live-e2e-shared/data/coinTeamOwner";
import { ownedBy } from "tests/utils/allureUtils";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import type { Application } from "tests/page";
import {
  addEmptyAccountCommand,
  liveDataCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { isReceiveBlockedOnLNS } from "@ledgerhq/live-e2e-shared/nanoSSupport";
import { getSpeculosModel } from "@ledgerhq/live-e2e-shared/speculosAppVersion";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { buildTags } from "tests/utils/tagsUtils";

type ReceiveTestCase = {
  account: Account;
  xrayTicket: string;
};

const nativeAccounts: ReceiveTestCase[] = [
  { account: Account.BTC_NATIVE_SEGWIT_1, xrayTicket: "B2CQA-2559, B2CQA-2687" },
  { account: Account.ETH_1, xrayTicket: "B2CQA-2561, B2CQA-2688, B2CQA-2697" },
  { account: Account.SOL_1, xrayTicket: "B2CQA-2563, B2CQA-2689" },
  { account: Account.TRX_1, xrayTicket: "B2CQA-2565, B2CQA-2690, B2CQA-2699" },
  { account: Account.DOT_1, xrayTicket: "B2CQA-2562, B2CQA-2691" },
  { account: Account.XRP_1, xrayTicket: "B2CQA-2566, B2CQA-2692" },
  { account: Account.BCH_1, xrayTicket: "B2CQA-2558, B2CQA-2693" },
  { account: Account.ATOM_1, xrayTicket: "B2CQA-2560, B2CQA-2694" },
  { account: Account.XTZ_1, xrayTicket: "B2CQA-2564, B2CQA-2695" },
  { account: Account.BSC_1, xrayTicket: "B2CQA-2686, B2CQA-2696, B2CQA-2698" },
  { account: Account.ZEC_1, xrayTicket: "B2CQA-6604" },
];

const tokenAccount = { account: TokenAccount.ETH_USDT_1, xrayTicket: "B2CQA-5694" };

async function verifySendCurrencyTokensWarning(app: Application, account: Account) {
  switch (account) {
    case Account.TRX_1:
      await app.receive.verifySendCurrencyTokensWarningMessage(account, "TRC10/TRC20");
      break;
    case Account.ETH_1:
      await app.receive.expectRecieveMenu();
      await app.receive.clickReceive();
      await app.receive.verifySendCurrencyTokensWarningMessage(account, "Ethereum");
      break;
    case Account.BSC_1:
      await app.receive.verifySendCurrencyTokensWarningMessage(account, "BEP20");
      break;
  }
}

for (const receive of nativeAccounts) {
  const receiveBlockedOnLNS = isReceiveBlockedOnLNS(receive.account.currency.id);
  const owner = ownedBy(coinTeamOwner(receive.account.currency.id), { folder: TestFolder.RECEIVE });
  test.describe("Receive", owner, () => {
    test.skip(
      receiveBlockedOnLNS && getSpeculosModel() === DeviceModelId.nanoS,
      "Receive is blocked on Nano S",
    );
    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: receive.account.currency.speculosApp,
      cliCommands: [liveDataCommand(receive.account)],
    });

    test(
      `[${receive.account.currency.testLabel}] - Verify address`,
      {
        tag: buildTags({
          currencyId: receive.account.currency.id,
          skipLNS: receiveBlockedOnLNS,
          extraTags: receive.account === Account.ETH_1 ? ["@smoke"] : [],
        }),
        annotation: {
          type: "TMS",
          description: receive.xrayTicket,
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(receive.account.accountName);
        await app.account.expectAccountVisibility(receive.account.accountName);
        await app.account.clickReceive();
        await verifySendCurrencyTokensWarning(app, receive.account);
        await app.receive.continue();
        const displayedAddress = await app.receive.getAddressDisplayed();
        await app.receive.expectValidReceiveAddress(displayedAddress);
        await app.speculos.expectValidAddressDevice(receive.account, displayedAddress);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

const zecOwner = ownedBy(coinTeamOwner(Account.ZEC_1.currency.id), { folder: TestFolder.RECEIVE });
test.describe("Receive", zecOwner, () => {
  const account = Account.ZEC_1;
  test.skip(getSpeculosModel() !== DeviceModelId.nanoS, "Nano S only");
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
  });

  test(
    `[${account.currency.testLabel}] - Verify address - blocked on Nano S`,
    {
      tag: buildTags({ currencyId: account.currency.id, onlyLNS: true }),
      annotation: {
        type: "TMS",
        description: "B2CQA-6604",
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);
      await app.account.clickReceive();
      await app.receive.continue();
      await app.receive.expectDeviceDeprecationError("Ledger Nano S");
    },
  );
});

const trxOwner = ownedBy(coinTeamOwner(Account.TRX_3.currency.id), { folder: TestFolder.RECEIVE });
test.describe("Receive", trxOwner, () => {
  const account = Account.TRX_3;
  test.use({
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [addEmptyAccountCommand(account)],
  });

  test(
    `[${account.currency.testLabel}] - Verify address - activation warning on empty account`,
    {
      tag: buildTags({ currencyId: account.currency.id }),
      annotation: {
        type: "TMS",
        description: "B2CQA-1551",
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);
      await app.account.clickReceive();
      await app.receive.continue();
      await app.receive.verifyTronAddressActivationWarningMessage();
    },
  );
});

const tokenOwner = ownedBy(coinTeamOwner(tokenAccount.account.currency.id), {
  folder: TestFolder.RECEIVE,
});
test.describe("Receive", tokenOwner, () => {
  test.use({
    userdata: "speculos-subAccount",
    speculosApp: tokenAccount.account.currency.speculosApp,
  });

  test(
    `[${tokenAccount.account.currency.testLabel}] - Verify address`,
    {
      tag: buildTags({ currencyId: tokenAccount.account.currency.id }),
      annotation: {
        type: "TMS",
        description: tokenAccount.xrayTicket,
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(getParentAccountName(tokenAccount.account));
      await app.account.expectAccountVisibility(getParentAccountName(tokenAccount.account));
      await app.account.navigateToTokenInAccount(tokenAccount.account);
      await app.account.expectTokenAccount(tokenAccount.account);
      await app.account.clickReceive();
      await app.receive.continue();

      const displayedAddress = await app.receive.getAddressDisplayed();
      await app.receive.expectValidReceiveAddress(displayedAddress);
      await app.speculos.expectValidAddressDevice(tokenAccount.account, displayedAddress);
      await app.receive.expectApproveLabel();
    },
  );
});
