import { writeFile } from "fs/promises";
import { BigNumber } from "bignumber.js";
import { formatFeeCurrencyAmount } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { test } from "tests/fixtures/common";
import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import { liveDataWithRecipientAddressCommand } from "@ledgerhq/live-e2e-shared/cliCommandsUtils";
import {
  FAKE_TRONIFY_PORT,
  FAKE_TRONIFY_RENT,
  TRONIFY_E2E_PAYEES,
  TRONIFY_OPTION_ID,
  USDT_UNIT,
  expectRentOrderedFromFake,
  expectUsdtTransferBroadcastToFake,
  fakeTronifyCoinConfig,
  startFakeTronify,
  upstreamTronGrid,
  type FakeTronify,
  type FakeTronifyScenario,
} from "@ledgerhq/live-e2e-shared/tronify/index";
import { deviceShowsTronifyService } from "@ledgerhq/live-e2e-shared/families/tronSponsored";
import { FF_NEW_SEND_FLOW_ENABLED } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";
import { reachAmountStep } from "tests/utils/newSendFlowUtils";

// No B2CQA test exists for the sponsored send yet.
const TMS_TICKET = "LIVE-32798";

const tx = new Transaction(TokenAccount.TRX_USDT, TokenAccount.TRX_USDT_2, "1");

// The device shows the rent in full; the app rounds it the way it rounds every fee.
const appFee = (usdt: string) =>
  formatFeeCurrencyAmount(USDT_UNIT, new BigNumber(usdt).shiftedBy(USDT_UNIT.magnitude));

// The fake owns a fixed port (FAKE_TRONIFY_PORT, default 4790) and one global scenario, so this file
// runs serially: --repeat-each and parallel workers are unsupported.
test.describe.configure({ mode: "default" });

let fake: FakeTronify;

test.beforeAll(async () => {
  fake = await startFakeTronify({
    port: FAKE_TRONIFY_PORT,
    payees: TRONIFY_E2E_PAYEES,
    upstreamTronGrid: upstreamTronGrid(),
    usdtBalance: 50_000_000n,
    trxBalanceSun: 20_000_000n,
  });
});

test.afterAll(async () => {
  await fake?.close();
});

test.afterEach(async () => {
  // A fake that failed to start (EADDRINUSE) has no log; its own error is the report.
  if (!fake) return;
  const testInfo = test.info();
  const logPath = testInfo.outputPath("fake-tronify-log.json");
  await writeFile(logPath, JSON.stringify(fake.log(), null, 2));
  await testInfo.attach("Fake Tronify requests", {
    path: logPath,
    contentType: "application/json",
  });
});

/** Runs before the app launches, so its first sync already reads the scenario's balances. */
function useScenario(scenario: FakeTronifyScenario, params?: Record<string, unknown>) {
  test.beforeEach(() => fake.setScenario(scenario, params));
}

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
    coinConfigOverrides: fakeTronifyCoinConfig(),
  });

  test.describe("happy path", () => {
    useScenario("happy");

    test(
      `[${label}] - Send paying the network fee in USDT, rent payment then transfer on device`,
      testOptions,
      async ({ app }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);
        await app.newSendFlow.expectSponsoredNudgeVisible();

        await app.newSendFlow.openFeePayment();
        await app.newSendFlow.expectFeePaymentOptionFee(
          TRONIFY_OPTION_ID,
          appFee(FAKE_TRONIFY_RENT.quoted),
        );
        await app.newSendFlow.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSendFlow.confirmFeePayment();
        await app.newSendFlow.expectSponsoredFeeSelected();
        await app.newSendFlow.clickReview();

        // TX-A: the scenario's first order pays the first payee.
        await expectRentOrderedFromFake(fake);
        await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, TRONIFY_E2E_PAYEES[0]);
        await app.speculos.resetSpeculosEvents();
        await app.newSendFlow.waitForSponsoredPolling();

        // TX-C: the user's own transfer, once the rented energy has landed.
        await app.newSendFlow.waitForSignature();
        await app.speculos.signSendTransaction(tx);
        await app.newSendFlow.waitForSuccessConfirmation();
        await expectUsdtTransferBroadcastToFake(fake, tx.accountToCredit.address, tx.amount);
      },
    );
  });

  test.describe("insufficient USDT", () => {
    // Covers the 1 USDT sent and the rent alone, not both together.
    useScenario("insufficientBalance", { usdtBalance: 4_000_000 });

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
    useScenario("deliveryTimeout");

    test(
      `[${label}] - Send paying the network fee in USDT fails with Retry locked when energy never arrives`,
      testOptions,
      async ({ app }) => {
        await reachAmountStep(app, tx);
        await app.newSendFlow.fillCryptoAmount(tx.amount);

        await app.newSendFlow.openFeePayment();
        await app.newSendFlow.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSendFlow.confirmFeePayment();
        await app.newSendFlow.expectSponsoredFeeSelected();
        await app.newSendFlow.clickReview();

        await expectRentOrderedFromFake(fake);
        await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, TRONIFY_E2E_PAYEES[0]);
        await app.newSendFlow.waitForSponsoredPolling();

        await app.newSendFlow.expectSponsoredFailure("Energy was not delivered.");
        await app.newSendFlow.expectRetryLocked();
        await app.newSendFlow.cancelSponsoredFailure();
      },
    );
  });

  test.describe("rent price rose", () => {
    useScenario("priceRose");

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
          `The energy rental price went up to ${appFee(FAKE_TRONIFY_RENT.raised)}.`,
        );
        await app.newSendFlow.expectRetryOffered("Accept new price");
        await app.newSendFlow.cancelSponsoredFailure();
      },
    );
  });
});
