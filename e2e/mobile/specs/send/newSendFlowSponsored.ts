import { BigNumber } from "bignumber.js";
import { allure } from "jest-allure2-reporter/api";
import { formatFeeCurrencyAmount } from "@ledgerhq/live-common/flows/send/utils/networkFeesDisplay";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { TransactionType } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
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
import { setTeamOwner } from "@e2e/helpers/allure/allure-helper";
import {
  ANDROID_EMULATOR_HOST,
  allowBroadcastToFakeNodes,
  fakeTronifyPort,
  isAndroid,
} from "@e2e/helpers/commonHelpers";
import { overrideLiveConfig } from "@e2e/bridge/server";
import { FF_NEW_SEND_FLOW_ENABLED } from "@e2e/utils/featureFlagUtils";
import { beforeAllTokenFunction } from "@e2e/specs/send/newSendFlow";

const FEATURE_FLAGS = { ...FF_NEW_SEND_FLOW_ENABLED, gasSponsorship: { enabled: true } };
const NOT_ENOUGH_USDT =
  "You don't have enough USDT to cover the amount and the Tronify energy rental fee.";

const USDT_FOR_AMOUNT_OR_RENT_NOT_BOTH = 4_000_000;

const appFormattedFee = (usdt: string) =>
  formatFeeCurrencyAmount(USDT_UNIT, new BigNumber(usdt).shiftedBy(USDT_UNIT.magnitude));

const describeIfDeviceShowsTronify = (...args: Parameters<typeof describe>) =>
  deviceShowsTronifyService()
    ? describe(...args)
    : describe.skip(
        "[this device's Tron app predates the Tronify service page] " + args[0],
        args[1],
      );

type SponsoredTestOptions = {
  transaction: TransactionType;
  tmsLinks: string[];
  tags: string[];
};

type SponsoredSuiteOptions = SponsoredTestOptions & {
  suite: string;
  test: string;
  scenario: FakeTronifyScenario;
  params?: Record<string, unknown>;
  body: (fake: FakeTronify) => Promise<void>;
};

/** One scenario per spec file: each needs a fresh app, with no rent another scenario left pending. */
function sponsoredSendSuite(options: SponsoredSuiteOptions) {
  const { transaction, tmsLinks, tags, suite, test, scenario, params, body } = options;
  setTeamOwner(Team.COIN_INTEGRATION);
  tmsLinks.forEach(tmsLink => $TmsLink(tmsLink));
  tags.forEach(tag => $Tag(tag));
  allowBroadcastToFakeNodes();

  const label = transaction.accountToDebit.currency.testLabel;
  let fake: FakeTronify | undefined;

  describeIfDeviceShowsTronify(`Send - new flow - fee paid in USDT with Tronify - ${suite}`, () => {
    beforeAll(async () => {
      fake = await startFakeTronify({
        port: fakeTronifyPort(),
        payees: TRONIFY_E2E_PAYEES,
        upstreamTronGrid: upstreamTronGrid(),
        usdtBalance: 50_000_000n,
        trxBalanceSun: 20_000_000n,
      });
      fake.setScenario(scenario, params);
      // Before the accounts import, so nothing syncs against the real TronGrid.
      await overrideLiveConfig(
        fakeTronifyCoinConfig(isAndroid() ? ANDROID_EMULATOR_HOST : "127.0.0.1", fakeTronifyPort()),
      );
      await beforeAllTokenFunction(transaction, { featureFlags: FEATURE_FLAGS });
    });

    afterAll(async () => {
      await fake?.close();
    });

    afterEach(async () => {
      if (!fake) return;
      await allure.attachment(
        "Fake Tronify requests",
        JSON.stringify(fake.log(), null, 2),
        "application/json",
      );
    });

    it(`[${label}] - ${test}`, () => {
      if (!fake) throw new Error("The fake Tronify did not start");
      return body(fake);
    });
  });
}

async function reachAmountStep(transaction: TransactionType) {
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

async function signRentPayment(fake: FakeTronify) {
  await app.newSend.waitForRentSignature();
  await expectRentOrderedFromFake(fake);
  await app.speculos.signTronRentPayment(FAKE_TRONIFY_RENT.quoted, TRONIFY_E2E_PAYEES[0]);
  await app.speculos.resetSpeculosEvents();
  await app.newSend.expectSponsoredPolling();
}

export function runNewSendFlowSponsoredTest(options: SponsoredTestOptions) {
  const { transaction } = options;
  sponsoredSendSuite({
    ...options,
    suite: "happy path",
    test: "Send paying the network fee in USDT, rent payment then transfer on device",
    scenario: "happy",
    body: async fake => {
      await reachAmountStep(transaction);
      await app.newSend.expectSponsoredNudgeVisible();

      await app.newSend.openFeePayment();
      await app.newSend.expectFeePaymentOptionFee(
        TRONIFY_OPTION_ID,
        appFormattedFee(FAKE_TRONIFY_RENT.quoted),
      );
      await app.newSend.selectFeePaymentOption(TRONIFY_OPTION_ID);
      await app.newSend.confirmFeePayment();
      await app.newSend.expectSponsoredFeeSelected();
      await app.newSend.tapReviewNewFlow();
      await signRentPayment(fake);

      await app.newSend.waitForSignature();
      await app.speculos.signSendTransaction(transaction);
      await app.newSend.waitForSuccessConfirmation();
      await expectUsdtTransferBroadcastToFake(
        fake,
        transaction.accountToCredit.address,
        transaction.amount,
      );
    },
  });
}

export function runNewSendFlowSponsoredInsufficientUsdtTest(options: SponsoredTestOptions) {
  const { transaction } = options;
  sponsoredSendSuite({
    ...options,
    suite: "insufficient USDT",
    test: "Send paying the network fee in USDT is blocked when USDT can't cover amount and rent",
    scenario: "insufficientBalance",
    params: { usdtBalance: USDT_FOR_AMOUNT_OR_RENT_NOT_BOTH },
    body: async () => {
      await reachAmountStep(transaction);
      await app.newSend.payFeeWith(TRONIFY_OPTION_ID);

      await app.newSend.expectSponsoredFeeError(NOT_ENOUGH_USDT);
      await app.newSend.expectReviewDisabled();
    },
  });
}

export function runNewSendFlowSponsoredDeliveryTimeoutTest(options: SponsoredTestOptions) {
  const { transaction } = options;
  sponsoredSendSuite({
    ...options,
    suite: "energy delivery timeout",
    test: "Send paying the network fee in USDT fails with Retry locked when energy never arrives",
    scenario: "deliveryTimeout",
    body: async fake => {
      await reachAmountStep(transaction);
      await app.newSend.payFeeWith(TRONIFY_OPTION_ID);
      await app.newSend.expectSponsoredFeeSelected();
      await app.newSend.tapReviewNewFlow();
      await signRentPayment(fake);

      await app.newSend.expectSponsoredFailure("Energy was not delivered.");
      await app.newSend.expectRetryLocked();
      await app.newSend.cancelSponsoredFailure();
    },
  });
}

export function runNewSendFlowSponsoredPriceRoseTest(options: SponsoredTestOptions) {
  const { transaction } = options;
  sponsoredSendSuite({
    ...options,
    suite: "rent price rose",
    test: "Send paying the network fee in USDT shows the new price when the order costs more than the quote",
    scenario: "priceRose",
    body: async () => {
      await reachAmountStep(transaction);
      await app.newSend.payFeeWith(TRONIFY_OPTION_ID);
      await app.newSend.expectSponsoredFeeSelected();
      await app.newSend.tapReviewNewFlow();

      await app.newSend.expectSponsoredFailure(
        `The energy rental price went up to ${appFormattedFee(FAKE_TRONIFY_RENT.raised)}.`,
      );
      await app.newSend.expectRetryOffered("Accept new price", NOT_ENOUGH_USDT);
      await app.newSend.cancelSponsoredFailure();
    },
  });
}
