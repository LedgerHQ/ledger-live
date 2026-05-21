import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import {
  Account,
  TokenAccount,
  getParentAccountName,
} from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { liveDataCommand } from "@ledgerhq/live-common/e2e/cliCommandsUtils";
import type { Application } from "tests/page";

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
  //TODO: re-enable test when https://ledgerhq.atlassian.net/browse/LIVE-25852 is fixed
  //{ account: Account.BSC_1, xrayTicket: "B2CQA-2686, B2CQA-2696, B2CQA-2698" },
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
  test.describe("Receive native coin", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: receive.account.currency.speculosApp,
      cliCommands: [liveDataCommand(receive.account)],
    });

    const family = getFamilyByCurrencyId(receive.account.currency.id);

    test(
      `[${receive.account.currency.name}] Receive`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${receive.account.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
          ...(receive.account === Account.SOL_1 ? ["@smoke"] : []),
        ],
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

test.describe("Receive TRX empty balance", () => {
  const account = Account.TRX_3;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: account.currency.speculosApp,
    cliCommands: [liveDataCommand(account)],
  });

  const family = getFamilyByCurrencyId(account.currency.id);

  test(
    `${account.currency.ticker} empty balance Receive displays address activation warning message`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        `@${account.currency.id}`,
        ...(family ? [`@family-${family}`] : []),
      ],
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

test.describe("Receive token", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "speculos-subAccount",
    speculosApp: tokenAccount.account.currency.speculosApp,
  });

  const family = getFamilyByCurrencyId(tokenAccount.account.currency.id);

  test(
    `[${tokenAccount.account.currency.name}] Receive`,
    {
      tag: [
        "@NanoSP",
        "@LNS",
        "@NanoX",
        "@Stax",
        "@Flex",
        "@NanoGen5",
        `@${tokenAccount.account.currency.id}`,
        ...(family ? [`@family-${family}`] : []),
      ],
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
