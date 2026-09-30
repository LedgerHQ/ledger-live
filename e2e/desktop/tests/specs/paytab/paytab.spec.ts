import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { test } from "tests/fixtures/common";
import {
  FF_LWD_PAY_TAB,
  FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} from "tests/utils/featureFlagUtils";
import { NEW_SEND_FLOW_FAMILIES } from "tests/utils/newSendFlowUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

const ALL_STABLECOINS = "All stablecoins";
const FILTER_TICKER = "USDT";
const REQUEST_TITLE = "Request Tether USD";
const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_3, "0.01");

const TMS_LINKS = ["B2CQA-6325", "B2CQA-6326"];

test.describe("Pay tab", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: transaction.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
    settings: {
      shareAnalytics: false,
      hasSeenAnalyticsOptInPrompt: true,
      hasDismissedContactsFeatureIntroduction: true,
    },
    featureFlags: {
      ...FF_LWD_PAY_TAB,
      ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
      newSendFlow: {
        enabled: true,
        params: { families: NEW_SEND_FLOW_FAMILIES },
      },
    },
  });

  test(
    "Pay tab end to end",
    {
      tag: [...DEVICE_TAGS],
      annotation: TMS_LINKS.map(description => ({ type: "TMS", description })),
    },
    async ({ app }) => {
      await test.step("Balance, stablecoin filter and deposit options", async () => {
        await app.mainNavigation.openTargetFromMainNavigation("pay");
        await app.payTab.dismissFeatureTourIfVisible();
        await app.payTab.expectScreenVisible();
        await app.payTab.expectFundedBalance();
        await app.payTab.expectBalanceAmount();
        await app.payTab.expectFilterPill(ALL_STABLECOINS);

        await app.payTab.filterBalance(FILTER_TICKER.toLowerCase());
        await app.payTab.expectFilterPill(FILTER_TICKER);
        await app.payTab.filterBalance("all");
        await app.payTab.expectFilterPill(ALL_STABLECOINS);

        await app.payTab.openDepositOptions();
        await app.payTab.expectDepositOptions();
        await app.payTab.selectDepositOption("bankTransfer");
        await app.payTab.expectBankTransferIntro();
        await app.payTab.closeBankTransferIntro();
        await app.payTab.expectScreenVisible();

        await app.payTab.openDepositOptions();
        await app.swap.goAndWaitForSwapToBeReady(() => app.payTab.selectDepositOption("swap"));
        await app.mainNavigation.openTargetFromMainNavigation("pay");
        await app.payTab.expectScreenVisible();

        await app.payTab.openDepositOptions();
        await app.payTab.selectDepositOption("buy");
        await app.buyAndSell.verifyBuySellScreenIsVisible();
        await app.mainNavigation.openTargetFromMainNavigation("pay");
        await app.payTab.expectScreenVisible();

        await app.payTab.openDepositOptions();
        await app.payTab.selectDepositOption("receive");
        await app.modularDialog.validateAssetsDialogItems();
        await app.payTab.closeDialog();
        await app.payTab.expectScreenVisible();
      });

      await test.step("Request a stablecoin payment", async () => {
        await app.mainNavigation.openTargetFromMainNavigation("pay");
        await app.payTab.openRequest();
        await app.modularDialog.selectAssetByTicker(Currency.ETH_USDT);
        await app.modularDialog.selectNetwork(Currency.ETH_USDT);
        await app.modularDialog.selectAccountByName(transaction.accountToDebit);
        await app.payTab.expectRequestTitle(REQUEST_TITLE);
        await app.payTab.expectRequestAddress();
        await app.payTab.expectRequestQrCode();
        await app.payTab.expectRequestSave();
        await app.payTab.expectRequestCopy();
        await app.payTab.expectRequestVerify();
        await app.payTab.closeRequest();
        await app.payTab.expectFundedBalance();
      });
    },
  );
});
