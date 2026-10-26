import { test } from "tests/fixtures/fakeTronify";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { SendScenario, TestFolder } from "@ledgerhq/live-e2e-shared/enum/TestFolder";
import { ownedBy } from "tests/utils/allureUtils";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import { FAKE_TRONIFY_RENT, TRONIFY_OPTION_ID } from "@ledgerhq/live-e2e-shared/tronify/index";
import { deviceShowsTronifyService } from "@ledgerhq/live-e2e-shared/families/tronSponsored";
import { FF_NEW_SEND_FLOW_ENABLED } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { reachAmountStep, reachAmountStepFromCurrentAccount } from "tests/utils/newSendFlowUtils";

const tx = new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "1");

// The fake's rents as the app rounds them; the device shows them in full (FAKE_TRONIFY_RENT).
const QUOTED_RENT_SHOWN = "3.16945 USDT";
const RAISED_RENT_SHOWN = "4.75418 USDT";

const testOptions = (tmsTicket: string) => ({
  tag: buildTags({
    currencyId: tx.accountToDebit.currency.id,
    // The Nano S Tron app predates the Tronify service page.
    skipLNS: true,
  }),
  annotation: { type: "TMS", description: tmsTicket },
});
const label = tx.accountToDebit.currency.testLabel;

const owner = ownedBy(Team.COIN_INTEGRATION, {
  folder: TestFolder.SEND_TOKEN_ACCOUNT,
  scenario: SendScenario.FEE_PAID_WITH_TRONIFY,
});

test.describe("Send - new flow - fee paid in USDT with Tronify", owner, () => {
  test.skip(
    !deviceShowsTronifyService(),
    "This device's Tron app predates the Tronify service page",
  );

  test.use({
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
      `[${label}] - Send - fee paid in USDT - rent then transfer`,
      testOptions("B2CQA-6705"),
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

        // Back on the USDT account, its latest operation is the transfer just sent.
        await app.newSendFlow.closeConfirmation();
        await app.account.clickOnLastOperationAndReturnStatus();
        await app.sendDrawer.expectOperationType("Sent");
        await app.sendDrawer.expectAmountVisible(tx.amount);
        await app.sendDrawer.addressValueIsVisible(tx.accountToCredit.address);
      },
    );
  });

  test.describe("insufficient USDT", () => {
    // Covers the 1 USDT sent and the rent alone, not both together.
    test.use({
      tronifyScenario: { scenario: "insufficientBalance", params: { usdtBalance: 4_000_000 } },
    });

    test(
      `[${label}] - Send - fee paid in USDT - blocked when USDT can't cover amount and rent`,
      testOptions("B2CQA-6706"),
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
      `[${label}] - Send - fee paid in USDT - retry locked until energy arrives`,
      testOptions("B2CQA-6707"),
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
        const quotesBefore = await tronify.rentQuoteCount();

        // The paid rent may still land: a reopened Send must not rent again meanwhile.
        await reachAmountStepFromCurrentAccount(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);
        await app.newSendFlow.expectRentArriving();
        const feeBefore = await app.newSendFlow.settledNetworkFeeTrx();
        // Once the step has settled: an offer would follow a quote.
        await app.newSendFlow.expectNoFeePaymentOffer();
        await tronify.expectNoNewRentQuote(quotesBefore);

        await tronify.landPaidRents();
        await app.newSendFlow.expectFeeDroppedOnRentDelivery(feeBefore);
      },
    );
  });

  test.describe("rent price rose", () => {
    test.use({ tronifyScenario: { scenario: "priceRose" } });

    test(
      `[${label}] - Send - fee paid in USDT - new price when the order costs more`,
      testOptions("B2CQA-6708"),
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
