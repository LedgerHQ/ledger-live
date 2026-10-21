import { test } from "tests/fixtures/fakeTronify";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FAKE_TRONIFY_RENT, TRONIFY_OPTION_ID } from "@ledgerhq/live-e2e-shared/tronify/index";
import { deviceShowsTronifyService } from "@ledgerhq/live-e2e-shared/families/tronSponsored";
import { FF_NEW_SEND_FLOW_ENABLED } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { reachAmountStep } from "tests/utils/newSendFlowUtils";

// No B2CQA test exists for the sponsored send yet.
const TMS_TICKET = "LIVE-32798";

const tx = new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "1");

// The fake's rents as the app rounds them; the device shows them in full (FAKE_TRONIFY_RENT).
const QUOTED_RENT_SHOWN = "3.16945 USDT";
const RAISED_RENT_SHOWN = "4.75418 USDT";

const testOptions = {
  tag: buildTags({
    currencyId: tx.accountToDebit.currency.id,
    // The Nano S Tron app predates the Tronify service page.
    skipLNS: true,
  }),
  annotation: { type: "TMS", description: TMS_TICKET },
};
const label = tx.accountToDebit.currency.testLabel;

test.describe("Send - new flow - fee paid in USDT with Tronify", () => {
  test.skip(
    !deviceShowsTronifyService(),
    "This device's Tron app predates the Tronify service page",
  );

  test.use({
    teamOwner: Team.COIN_INTEGRATION,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: tx.accountToDebit.currency.speculosApp,
    cliCommands: [liveDataWithRecipientAddressCommand(tx)],
    featureFlags: { ...FF_NEW_SEND_FLOW_ENABLED, gasSponsorship: { enabled: true } },
    // Broadcasts reach the fake TronGrid, which answers them and never forwards them.
    env: { DISABLE_TRANSACTION_BROADCAST: "0" },
  });

  test.describe("happy path", () => {
    test.use({ tronifyScenario: { scenario: "happy" } });

    test(
      `[${label}] - Send paying the network fee in USDT, rent payment then transfer on device`,
      testOptions,
      async ({ app, tronify }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);
        await app.newSendFlow.expectSponsoredNudgeVisible();

        await app.newSendFlow.openFeePayment();
        await app.newSendFlow.expectFeePaymentOptionFee(TRONIFY_OPTION_ID, QUOTED_RENT_SHOWN);
        await app.newSendFlow.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSendFlow.confirmFeePayment();
        await app.newSendFlow.expectSponsoredFeeSelected();
        await app.newSendFlow.clickReview();

        // TX-A: the device shows the payee of the app's one rent order.
        const payee = await tronify.expectRentOrdered();
        await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, payee);
        await app.speculos.resetSpeculosEvents();
        await app.newSendFlow.waitForSponsoredPolling();
        await tronify.expectRentPaidOnce();

        // TX-C: the user's own transfer, once the rented energy has landed.
        await app.newSendFlow.waitForSignature();
        await app.speculos.signSendTransaction(tx);
        await app.newSendFlow.waitForSuccessConfirmation();
        await tronify.expectUsdtTransferBroadcast(tx.accountToCredit.address, tx.amount);
      },
    );
  });

  test.describe("insufficient USDT", () => {
    // Covers the 1 USDT sent and the rent alone, not both together.
    test.use({
      tronifyScenario: { scenario: "insufficientBalance", params: { usdtBalance: 4_000_000 } },
    });

    test(
      `[${label}] - Send paying the network fee in USDT is blocked when USDT can't cover amount and rent`,
      testOptions,
      async ({ app }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);

        await app.newSendFlow.openFeePayment();
        await app.newSendFlow.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSendFlow.confirmFeePayment();

        await app.newSendFlow.expectSponsoredFeeError(
          "You don't have enough USDT to cover the amount and the Tronify energy rental fee.",
        );
        await app.newSendFlow.expectReviewDisabled();
      },
    );
  });

  test.describe("energy delivery timeout", () => {
    test.use({ tronifyScenario: { scenario: "deliveryTimeout" } });

    test(
      `[${label}] - Send paying the network fee in USDT fails with Retry locked when energy never arrives, and a reopened Send waits for it`,
      testOptions,
      async ({ app, tronify }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);

        await app.newSendFlow.openFeePayment();
        await app.newSendFlow.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSendFlow.confirmFeePayment();
        await app.newSendFlow.expectSponsoredFeeSelected();
        await app.newSendFlow.clickReview();

        const payee = await tronify.expectRentOrdered();
        await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, payee);
        await app.newSendFlow.waitForSponsoredPolling();

        await app.newSendFlow.expectSponsoredFailure("Energy was not delivered.");
        await app.newSendFlow.expectRetryLocked();
        await app.newSendFlow.cancelSponsoredFailure();

        // The paid rent may still land: a reopened Send must not rent again meanwhile.
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);
        await app.newSendFlow.expectRentArriving();
        const feesBefore = await app.newSendFlow.networkFees();

        await tronify.landPaidRents();
        await app.newSendFlow.expectFeesReestimatedOnRentDelivery(feesBefore);
        await tronify.expectRentPaidOnce();
      },
    );
  });

  test.describe("rent price rose", () => {
    test.use({ tronifyScenario: { scenario: "priceRose" } });

    test(
      `[${label}] - Send paying the network fee in USDT shows the new price when the order costs more than the quote`,
      testOptions,
      async ({ app }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);

        await app.newSendFlow.openFeePayment();
        await app.newSendFlow.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSendFlow.confirmFeePayment();
        await app.newSendFlow.expectSponsoredFeeSelected();
        await app.newSendFlow.clickReview();

        await app.newSendFlow.expectSponsoredFailure(
          `The energy rental price went up to ${RAISED_RENT_SHOWN}.`,
        );
        await app.newSendFlow.expectRetryOffered("Accept new price");
        await app.newSendFlow.expectNoFeeTokenShortfall("USDT");
        await app.newSendFlow.cancelSponsoredFailure();
      },
    );
  });
});
