import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  revokeTokenApproval,
} from "tests/utils/swapUtils";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import { pickRotatingProvider } from "@ledgerhq/live-e2e-shared/swap";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";
import { holdLockLikeBroadcastOnlyFlow } from "tests/utils/lockPlaceholder";

const xrayTicket = "B2CQA-5632";
const fromAccount = TokenAccount.ETH_USDC_1;
const approvalLock = exclusiveLockFor({ broadcastAccounts: [fromAccount] });
const toAccount = Account.ETH_1;
const flowTitle = `[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap token approval flow`;
const flowTags = [...DEVICE_TAGS, "@ethereum", "@family-evm"];
const eligibleProviders = [
  SwapProvider.THORCHAIN,
  SwapProvider.UNISWAP,
  SwapProvider.LIFI,
  SwapProvider.OKX,
  SwapProvider.ONE_INCH,
  SwapProvider.VELORA,
];

// 96 s on the 2026-10-19 broadcast nightly.
holdLockLikeBroadcastOnlyFlow({ flowTitle, tags: flowTags, lock: approvalLock, holdMs: 96_000 });

test.describe("Swap - token approval", { lock: approvalLock.names }, () => {
  test.skip(
    process.env.DISABLE_TRANSACTION_BROADCAST !== "0",
    "Token approval flow requires broadcast to be enabled — runs on Monday nightly only",
  );

  setupEnv(false);

  test.use({
    teamOwner: Team.SWAP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: fromAccount.currency.speculosApp,
    ...approvalLock.fixtures,

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
    flowTitle,
    {
      tag: flowTags,
      annotation: [
        {
          type: "TMS",
          description: xrayTicket,
        },
      ],
    },
    async ({ app }) => {
      const provider = await pickRotatingProvider(eligibleProviders, fromAccount, toAccount);
      // Approval (Step 1) can take 1-5 min; extend beyond the 400s CI default.
      test.setTimeout(480_000);
      await app.swap.logSelectedProvider(provider.uiName);
      await app.speculos.enableBlindSigningOnNanoS();
      await revokeTokenApproval(fromAccount, provider);
      const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
      const swap = new Swap(fromAccount, toAccount, minAmount, provider);
      await performSwapUntilQuoteSelectionStep({ app, swap, minAmount });
      await app.swap.selectSpecificProvider(provider);
      await app.swap.checkQuoteCardCtaPresence(provider.uiName);
      await app.swap.clickExchangeButton(provider.name);
      await app.swap.expectTwoStepApprovalScreen();
      await app.swap.clickGiveApprovalButton();
      await app.swap.clickContinueButton();
      await app.speculos.signTokenApproval();
      if (provider === SwapProvider.UNISWAP) {
        await app.swap.clickGiveAuthorizationButton();
        await app.speculos.signTypedMessage();
      }
      await app.swap.expectTwoStepSignScreen();
      await app.swap.expectTransactionSentToasterToBeVisible();
    },
  );
});
