import { BigNumber } from "bignumber.js";
import { allure } from "jest-allure2-reporter/api";
import { formatFeeCurrencyAmount } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
  FAKE_TRONIFY_PORT,
  FAKE_TRONIFY_RENT,
  TRONIFY_E2E_PAYEES,
  TRONIFY_OPTION_ID,
  USDT_UNIT,
  expectRentOrderedFromFake,
  fakeTronifyCoinConfig,
  startFakeTronify,
  upstreamTronGrid,
  type FakeTronify,
  type FakeTronifyScenario,
} from "@ledgerhq/live-e2e-shared/tronify/index";
import { deviceShowsTronifyService } from "@ledgerhq/live-e2e-shared/families/tronSponsored";
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import { isAndroid, launchApp } from "@e2e/helpers/commonHelpers";
import { overrideLiveConfig } from "@e2e/bridge/server";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";
import { beforeAllTokenFunction } from "@e2e/specs/send/newSendFlow";

const FEATURE_FLAGS = { ...FF_NEW_SEND_FLOW_ENABLED, gasSponsorship: { enabled: true } };

// The device shows the rent in full; the app rounds it the way it rounds every fee.
const appFee = (usdt: string) =>
  formatFeeCurrencyAmount(USDT_UNIT, new BigNumber(usdt).shiftedBy(USDT_UNIT.magnitude));

const describeIfDeviceShowsTronify = (...args: Parameters<typeof describe>) =>
  deviceShowsTronifyService()
    ? describe(...args)
    : describe.skip(
        "[this device's Tron app predates the Tronify service page] " + args[0],
        args[1],
      );

/**
 * The Tronify sponsored send: the network fee of a USDT transfer paid in USDT, through a rent
 * payment (TX-A) signed before the transfer (TX-C). A local fake stands in for Tronify and TronGrid.
 */
export function runNewSendFlowSponsoredTest(
  transaction: TransactionType,
  tmsLinks: string[],
  tags: string[],
) {
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));

  const label = transaction.accountToDebit.currency.testLabel;
  let fake: FakeTronify;

  /**
   * A fresh app per scenario, as on desktop: its first sync reads the scenario's balances, and no
   * rent a failed scenario left pending holds back the next one's offer. The coin config goes in
   * before the accounts are imported, so nothing syncs against the real TronGrid.
   */
  function useScenario(scenario: FakeTronifyScenario, params?: Record<string, unknown>) {
    beforeAll(async () => {
      fake.setScenario(scenario, params);
      await launchApp({ newInstance: true, delete: true });
      // The emulator reaches this machine's loopback through 10.0.2.2; the simulator shares it.
      await overrideLiveConfig(fakeTronifyCoinConfig(isAndroid() ? "10.0.2.2" : "127.0.0.1"));
      await beforeAllTokenFunction(transaction, { featureFlags: FEATURE_FLAGS });
    });

    afterAll(async () => {
      await app.common.removeSpeculos();
    });
  }

  async function reachAmountStep() {
    await app.newSend.navigateToTokenSendScreen(
      transaction.accountToDebit.parentAccount!.accountName,
      transaction.accountToDebit,
    );
    await app.newSend.setRecipientAndContinueNewFlow(
      transaction.accountToCredit.address,
      transaction.memoTag,
    );
    await app.newSend.setAmountNewFlow(transaction.amount);
  }

  describeIfDeviceShowsTronify("Send - new flow - fee paid in USDT with Tronify", () => {
    // The fake owns a fixed port (FAKE_TRONIFY_PORT, default 4790) and one global scenario, so this
    // file runs serially: parallel workers and repeated runs are unsupported.
    beforeAll(async () => {
      fake = await startFakeTronify({
        port: FAKE_TRONIFY_PORT,
        payees: TRONIFY_E2E_PAYEES,
        upstreamTronGrid: upstreamTronGrid(),
        usdtBalance: 50_000_000n,
        trxBalanceSun: 20_000_000n,
      });
    });

    afterAll(async () => {
      await fake?.close();
    });

    afterEach(async () => {
      // A fake that failed to start (EADDRINUSE) has no log; its own error is the report.
      if (!fake) return;
      await allure.attachment(
        "Fake Tronify requests",
        JSON.stringify(fake.log(), null, 2),
        "application/json",
      );
    });

    describe("happy path", () => {
      useScenario("happy");

      it(`[${label}] - Send paying the network fee in USDT, rent payment then transfer on device`, async () => {
        await reachAmountStep();
        await app.newSend.expectSponsoredNudgeVisible();

        await app.newSend.openFeePayment();
        await app.newSend.expectFeePaymentOptionFee(
          TRONIFY_OPTION_ID,
          appFee(FAKE_TRONIFY_RENT.quoted),
        );
        await app.newSend.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSend.confirmFeePayment();
        await app.newSend.expectSponsoredFeeSelected();
        await app.newSend.tapReviewNewFlow();

        // TX-A: the scenario's first order pays the first payee.
        await app.newSend.waitForRentSignature();
        await expectRentOrderedFromFake(fake);
        await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, TRONIFY_E2E_PAYEES[0]);
        await app.speculos.resetSpeculosEvents();
        await app.newSend.waitForSponsoredPolling();

        // TX-C: the user's own transfer, once the rented energy has landed.
        await app.newSend.waitForSignature();
        await app.speculos.signSendTransaction(transaction);
        await app.newSend.waitForSuccessConfirmation();
      });
    });

    describe("insufficient USDT", () => {
      // Covers the 1 USDT sent and the rent alone, not both together.
      useScenario("insufficientBalance", { usdtBalance: 4_000_000 });

      it(`[${label}] - Send paying the network fee in USDT is blocked when USDT can't cover amount and rent`, async () => {
        await reachAmountStep();

        await app.newSend.openFeePayment();
        await app.newSend.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSend.confirmFeePayment();

        await app.newSend.expectSponsoredFeeError(
          "You don't have enough USDT to cover the amount and the Tronify energy rental fee.",
        );
        await app.newSend.expectReviewDisabled();
      });
    });

    describe("energy delivery timeout", () => {
      useScenario("deliveryTimeout");

      it(`[${label}] - Send paying the network fee in USDT fails with Retry locked when energy never arrives`, async () => {
        await reachAmountStep();

        await app.newSend.openFeePayment();
        await app.newSend.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSend.confirmFeePayment();
        await app.newSend.expectSponsoredFeeSelected();
        await app.newSend.tapReviewNewFlow();

        await app.newSend.waitForRentSignature();
        await expectRentOrderedFromFake(fake);
        await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, TRONIFY_E2E_PAYEES[0]);
        await app.newSend.waitForSponsoredPolling();

        await app.newSend.expectSponsoredFailure("Energy was not delivered.");
        await app.newSend.expectRetryLocked();
        await app.newSend.cancelSponsoredFailure();
      });
    });

    describe("rent price rose", () => {
      useScenario("priceRose");

      it(`[${label}] - Send paying the network fee in USDT shows the new price when the order costs more than the quote`, async () => {
        await reachAmountStep();

        await app.newSend.openFeePayment();
        await app.newSend.selectFeePaymentOption(TRONIFY_OPTION_ID);
        await app.newSend.confirmFeePayment();
        await app.newSend.expectSponsoredFeeSelected();
        await app.newSend.tapReviewNewFlow();

        await app.newSend.expectSponsoredFailure(
          `The energy rental price went up to ${appFee(FAKE_TRONIFY_RENT.raised)}.`,
        );
        await app.newSend.expectRetryOffered("Accept new price");
        await app.newSend.cancelSponsoredFailure();
      });
    });
  });
}
