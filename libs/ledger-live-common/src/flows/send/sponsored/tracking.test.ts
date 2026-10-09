import { BigNumber } from "bignumber.js";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { IDLE_SPONSORED_STATE } from "./fixtures/state";
import { USDT_FEE_ASSET, USDT_RENT_PAYMENT } from "./fixtures/usdt";
import {
  getSponsoredOrderStatus,
  getSponsoredSendEvent,
  getSponsoredSendTrackingProperties,
} from "./tracking";
import {
  SPONSORED_FAILURE_KIND,
  SPONSORED_ORDER_STATUS,
  SPONSORED_PHASE,
  SPONSORED_SEND_EVENT,
  type SponsoredPhase,
  type SponsoredState,
} from "./types";

const ORDER = {
  orderId: "order-1",
  transaction: {},
  payCoinCode: "USDT",
  payCoinAmt: "3.2",
  paymentExpiresAt: Date.now() + 6 * 60_000,
};

const stateWith = (overrides: Partial<SponsoredState> = {}): SponsoredState => ({
  ...IDLE_SPONSORED_STATE,
  ...overrides,
});

const withOrder = (phase: SponsoredPhase, overrides: Partial<SponsoredState> = {}) =>
  stateWith({
    phase,
    order: ORDER,
    rentPayment: USDT_RENT_PAYMENT,
    energyNeeded: 64_285n,
    ...overrides,
  });

describe("getSponsoredSendEvent", () => {
  it("reports a new order once", () => {
    const crafted = withOrder(SPONSORED_PHASE.RENT_SIGNING);

    expect(getSponsoredSendEvent(stateWith(), crafted)).toBe(SPONSORED_SEND_EVENT.ORDER_CREATED);
    expect(getSponsoredSendEvent(crafted, { ...crafted, toSign: "again" })).toBeNull();
  });

  it("reports the order a retry crafts", () => {
    const retried = withOrder(SPONSORED_PHASE.RENT_SIGNING, {
      order: { ...ORDER, orderId: "order-2" },
    });

    expect(getSponsoredSendEvent(withOrder(SPONSORED_PHASE.RENT_SIGNING), retried)).toBe(
      SPONSORED_SEND_EVENT.ORDER_CREATED,
    );
  });

  it.each([SPONSORED_PHASE.POLLING, SPONSORED_PHASE.RENT_SIGNING])(
    "reports delivery on %s → TRANSFER",
    from => {
      expect(getSponsoredSendEvent(withOrder(from), withOrder(SPONSORED_PHASE.TRANSFER))).toBe(
        SPONSORED_SEND_EVENT.ENERGY_DELIVERED,
      );
    },
  );

  it("does not report delivery again when a retry resumes the transfer", () => {
    const failed = withOrder(SPONSORED_PHASE.FAILED, {
      failureKind: SPONSORED_FAILURE_KIND.TRANSFER,
    });

    expect(getSponsoredSendEvent(failed, withOrder(SPONSORED_PHASE.TRANSFER))).toBeNull();
  });

  it("reports success and failure", () => {
    const transfer = withOrder(SPONSORED_PHASE.TRANSFER);

    expect(getSponsoredSendEvent(transfer, withOrder(SPONSORED_PHASE.DONE))).toBe(
      SPONSORED_SEND_EVENT.SEND_SUCCESS,
    );
    expect(getSponsoredSendEvent(transfer, withOrder(SPONSORED_PHASE.FAILED))).toBe(
      SPONSORED_SEND_EVENT.SEND_FAILED,
    );
  });

  it("reports a craft failure that leaves no order", () => {
    expect(
      getSponsoredSendEvent(
        stateWith({ phase: SPONSORED_PHASE.RENT_SIGNING }),
        stateWith({ phase: SPONSORED_PHASE.FAILED }),
      ),
    ).toBe(SPONSORED_SEND_EVENT.SEND_FAILED);
  });

  it.each<[SponsoredPhase, SponsoredPhase]>([
    [SPONSORED_PHASE.IDLE, SPONSORED_PHASE.RENT_SIGNING],
    [SPONSORED_PHASE.RENT_SIGNING, SPONSORED_PHASE.POLLING],
    [SPONSORED_PHASE.DONE, SPONSORED_PHASE.IDLE],
    [SPONSORED_PHASE.FAILED, SPONSORED_PHASE.RENT_SIGNING],
  ])("reports nothing on %s → %s", (from, to) => {
    expect(getSponsoredSendEvent(stateWith({ phase: from }), stateWith({ phase: to }))).toBeNull();
  });
});

describe("getSponsoredOrderStatus", () => {
  it("is null without an order", () => {
    expect(getSponsoredOrderStatus(stateWith({ phase: SPONSORED_PHASE.FAILED }))).toBeNull();
  });

  it.each<[SponsoredPhase, string]>([
    [SPONSORED_PHASE.RENT_SIGNING, SPONSORED_ORDER_STATUS.CREATED],
    [SPONSORED_PHASE.POLLING, SPONSORED_ORDER_STATUS.SUBMITTED],
    [SPONSORED_PHASE.TRANSFER, SPONSORED_ORDER_STATUS.DELIVERED],
    [SPONSORED_PHASE.DONE, SPONSORED_ORDER_STATUS.DELIVERED],
  ])("maps %s to %s", (phase, expected) => {
    expect(getSponsoredOrderStatus(withOrder(phase))).toBe(expected);
  });

  it.each<[Partial<SponsoredState>, string]>([
    [{ failureKind: SPONSORED_FAILURE_KIND.RENT_PAYMENT }, SPONSORED_ORDER_STATUS.CREATED],
    [{ failureKind: SPONSORED_FAILURE_KIND.DELIVERY_FAILED }, SPONSORED_ORDER_STATUS.SUBMITTED],
    [{ failureKind: SPONSORED_FAILURE_KIND.TRANSFER }, SPONSORED_ORDER_STATUS.DELIVERED],
  ])("maps a failure (%o) to %s", (failure, expected) => {
    expect(getSponsoredOrderStatus(withOrder(SPONSORED_PHASE.FAILED, failure))).toBe(expected);
  });
});

describe("getSponsoredSendTrackingProperties", () => {
  const usd = getFiatCurrencyByTicker("USD");
  const input = {
    provider: "tronify",
    quotedFee: { asset: USDT_FEE_ASSET, amount: 2_840_000n },
    standardFeeFiat: null,
    sponsoredFeeFiat: null,
    fiatCurrency: usd,
  };

  it("reports the ordered rent, in the fee asset's main unit", () => {
    expect(
      getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.ORDER_CREATED, {
        ...input,
        state: withOrder(SPONSORED_PHASE.RENT_SIGNING),
      }),
    ).toEqual({
      provider: "tronify",
      order_status: SPONSORED_ORDER_STATUS.CREATED,
      energy_ordered: 64_285,
      fee_amount: 3.2,
      fee_currency: "USDT",
      savings_fiat: null,
      fiat_currency: "USD",
    });
  });

  it("falls back to the quoted fee before an order exists", () => {
    const properties = getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_FAILED, {
      ...input,
      state: stateWith({
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.RENT_PAYMENT,
        failureError: Object.assign(new Error("short"), { name: "EnergyRentInsufficientBalance" }),
      }),
    });

    expect(properties).toMatchObject({
      order_status: null,
      energy_ordered: null,
      fee_amount: 2.84,
      fee_currency: "USDT",
      failure_kind: SPONSORED_FAILURE_KIND.RENT_PAYMENT,
      error_name: "EnergyRentInsufficientBalance",
    });
  });

  it("reports no fee without an order or a quote", () => {
    expect(
      getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_FAILED, {
        ...input,
        quotedFee: null,
        state: stateWith({ phase: SPONSORED_PHASE.FAILED }),
      }),
    ).toMatchObject({ fee_amount: null, fee_currency: null, error_name: null });
  });

  it("reports no fee amount for an asset without a unit", () => {
    expect(
      getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.ORDER_CREATED, {
        ...input,
        state: withOrder(SPONSORED_PHASE.RENT_SIGNING, {
          rentPayment: { asset: { type: "trc20" }, amount: 3_200_000n },
        }),
      }),
    ).toMatchObject({ fee_amount: null, fee_currency: null });
  });

  describe("savings", () => {
    // In USD cents: the 2.84 USDT quote prices at $2.84 against a $5 standard fee.
    const priced = {
      ...input,
      standardFeeFiat: new BigNumber(500),
      sponsoredFeeFiat: new BigNumber(284),
    };

    it("reports the quote's savings in the fiat's main unit before an order exists", () => {
      expect(
        getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_FAILED, {
          ...priced,
          state: stateWith({ phase: SPONSORED_PHASE.FAILED }),
        }),
      ).toMatchObject({ savings_fiat: 2.16, fiat_currency: "USD" });
    });

    it("prices the savings on the rent an accepted price rise orders", () => {
      expect(
        getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_SUCCESS, {
          ...priced,
          state: withOrder(SPONSORED_PHASE.DONE),
        }),
      ).toMatchObject({ fee_amount: 3.2, savings_fiat: 1.8 });
    });

    it("reports no savings once the rent costs more than the standard fee", () => {
      expect(
        getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_SUCCESS, {
          ...priced,
          standardFeeFiat: new BigNumber(300),
          state: withOrder(SPONSORED_PHASE.DONE),
        }),
      ).toMatchObject({ savings_fiat: null });
    });

    it("reports no savings without a fiat price", () => {
      expect(
        getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_SUCCESS, {
          ...priced,
          sponsoredFeeFiat: null,
          state: withOrder(SPONSORED_PHASE.DONE),
        }),
      ).toMatchObject({ savings_fiat: null });
    });
  });

  it("adds the failure only to the failure event", () => {
    const properties = getSponsoredSendTrackingProperties(SPONSORED_SEND_EVENT.SEND_SUCCESS, {
      ...input,
      state: withOrder(SPONSORED_PHASE.DONE),
    });

    expect(properties).not.toHaveProperty("failure_kind");
    expect(properties).not.toHaveProperty("error_name");
  });
});
