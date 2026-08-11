import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-e2e-shared/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import type { Application } from "tests/page";
import {
  addEmptyAccountCommand,
  liveDataCommand,
} from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { buildTags } from "tests/utils/tagsUtils";

const nativeAccounts = [
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
  test.describe("Receive", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: receive.account.currency.speculosApp,
      cliCommands: [liveDataCommand(receive.account)],
    });

    test(
      `[${receive.account.currency.testLabel}] - Verify address`,
      {
        tag: buildTags({
          currencyId: receive.account.currency.id,
          extraTags: receive.account === Account.ETH_1 ? ["@smoke"] : [],
        }),
        annotation: {
          type: "TMS",
          description: receive.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
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

test.describe("Receive", () => {
  const account = Account.TRX_3;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [addEmptyAccountCommand(account)],
  });

  test(
    `[${account.currency.testLabel}] - Verify address activation warning on empty account`,
    {
      tag: buildTags({ currencyId: account.currency.id }),
      annotation: {
        type: "TMS",
        description: "B2CQA-1551",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);
      await app.account.clickReceive();
      await app.receive.continue();
      await app.receive.verifyTronAddressActivationWarningMessage();
    },
  );
});

test.describe("Receive", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
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
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

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
