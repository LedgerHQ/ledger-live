import test from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Swap } from "@ledgerhq/live-e2e-shared/models/Swap";
import { SwapProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import {
  setupEnv,
  performSwapUntilQuoteSelectionStep,
  ensureTokenApproval,
  tokenApprovalBroadcastAccounts,
} from "tests/utils/swapUtils";
import { exclusiveLockFor } from "tests/utils/exclusiveLock";
import { liveDataWithAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { DEVICE_TAGS, deviceTagsWithoutLNS } from "tests/utils/tagsUtils";

const providerFlowTests = [
  {
    fromAccount: Account.ETH_1,
    toAccount: TokenAccount.ETH_USDC_1,
    provider: SwapProvider.ONE_INCH,
    xrayTicket: "B2CQA-3120, B2CQA-2918, B2CQA-2327, B2CQA-4295",
    bugTickets: ["LIVE-29454", "LIVE-29858"],
    checkLandingPage: true,
  },
  {
    fromAccount: TokenAccount.ETH_USDT_5,
    toAccount: Account.ETH_5,
    provider: SwapProvider.OKX,
    xrayTicket: "B2CQA-4728",
    bugTickets: ["LIVE-29858"],
    checkLandingPage: false,
  },
];

for (const {
  fromAccount,
  toAccount,
  provider,
  xrayTicket,
  bugTickets,
  checkLandingPage,
} of providerFlowTests) {
  const approvalLock = exclusiveLockFor({
    cliBroadcastAccounts: tokenApprovalBroadcastAccounts(fromAccount, provider),
  });

  test.describe("Swap - DEX native flow", { lock: approvalLock.names }, () => {
    setupEnv(true);

    test.use({
      teamOwner: Team.SWAP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: provider.app,
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
      `[${fromAccount.currency.testLabel}-${toAccount.currency.testLabel}] - Swap DEX native flow with ${provider.uiName}`,
      {
        tag: [
          ...(provider.availableOnLns ? DEVICE_TAGS : deviceTagsWithoutLNS()),
          "@ethereum",
          "@family-evm",
        ],
        annotation: [
          {
            type: "TMS",
            description: xrayTicket,
          },
          ...bugTickets.map(id => ({ type: "BUG", description: id })),
        ],
      },
      async ({ app }) => {
        await app.speculos.enableBlindSigningOnNanoS();
        const minAmount = await app.swap.getMinimumAmount(fromAccount, toAccount);
        await ensureTokenApproval(fromAccount, provider, minAmount);
        const swap = new Swap(fromAccount, toAccount, minAmount, provider);

        await performSwapUntilQuoteSelectionStep({ app, swap, minAmount, checkLandingPage });
        if (checkLandingPage) {
          const providerList = await app.swap.getProviderList();
          await app.swap.checkQuotesContainerInfos(providerList, toAccount.currency.ticker);
          await app.swap.checkBestOffer();
        }
        await app.swap.selectSpecificProvider(provider);
        await app.swap.checkQuoteCardCtaPresence(provider.uiName);

        await app.swap.clickExchangeButton(provider.name);
        await app.swap.checkElementsPresenceOnSwapApprovalStep();
        await app.swap.clickExecuteSwapButton();
        await app.swap.clickContinueButton();
        await app.speculos.verifyAmountsAndAcceptSwap(swap, minAmount);
        await app.swap.expectTransactionSentToasterToBeVisible();
      },
    );
  });
}
