/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { IDLE_SPONSORED_STATE } from "./fixtures/state";
import { USDT_FEE_ASSET, USDT_RENT_PAYMENT } from "./fixtures/usdt";
import {
  SPONSORED_FAILURE_KIND,
  SPONSORED_PHASE,
  SPONSORED_SEND_EVENT,
  type SponsoredState,
} from "./types";
import { useSponsoredSendFunnelTracking } from "./useSponsoredSendFunnelTracking";

const ORDER = {
  orderId: "order-1",
  transaction: {},
  payCoinCode: "USDT",
  payCoinAmt: "3.2",
  paymentExpiresAt: Date.now() + 6 * 60_000,
};

const idle = IDLE_SPONSORED_STATE;
const signing: SponsoredState = {
  ...idle,
  phase: SPONSORED_PHASE.RENT_SIGNING,
  order: ORDER,
  rentPayment: USDT_RENT_PAYMENT,
  energyNeeded: 64_285n,
};
const polling: SponsoredState = { ...signing, phase: SPONSORED_PHASE.POLLING };
const transfer: SponsoredState = { ...signing, phase: SPONSORED_PHASE.TRANSFER };
const done: SponsoredState = { ...signing, phase: SPONSORED_PHASE.DONE };

const quote = { feeAsset: USDT_FEE_ASSET, value: 3_200_000n, originalValue: 6_430_000n };
const properties = { flow: "send" };

type Props = { state: SponsoredState; standardFeeFiat?: BigNumber | null };
const initialProps: Props = { state: idle };

function renderTracking(track: jest.Mock) {
  return renderHook(
    ({ state, standardFeeFiat = null }: Props) =>
      useSponsoredSendFunnelTracking({
        state,
        provider: "tronify",
        quote,
        standardFeeFiat,
        sponsoredFeeFiat: new BigNumber(320),
        fiatCurrency: getFiatCurrencyByTicker("USD"),
        flowSessionId: "session-1",
        properties,
        track,
      }),
    { initialProps },
  );
}

describe("useSponsoredSendFunnelTracking", () => {
  it("tracks each step of a sponsored send once, in order", () => {
    const track = jest.fn();
    const { rerender } = renderTracking(track);

    rerender({ state: signing });
    rerender({ state: signing });
    rerender({ state: polling });
    rerender({ state: transfer });
    rerender({ state: done });
    rerender({ state: idle });

    expect(track.mock.calls.map(([event]) => event)).toEqual([
      SPONSORED_SEND_EVENT.ORDER_CREATED,
      SPONSORED_SEND_EVENT.ENERGY_DELIVERED,
      SPONSORED_SEND_EVENT.SEND_SUCCESS,
    ]);
    expect(track).toHaveBeenLastCalledWith(
      SPONSORED_SEND_EVENT.SEND_SUCCESS,
      expect.objectContaining({
        flow: "send",
        flow_session_id: "session-1",
        provider: "tronify",
        order_status: "delivered",
        fee_amount: 3.2,
      }),
    );
  });

  it("tracks a failure with its kind", () => {
    const track = jest.fn();
    const { rerender } = renderTracking(track);

    rerender({ state: transfer });
    rerender({
      state: {
        ...transfer,
        phase: SPONSORED_PHASE.FAILED,
        failureKind: SPONSORED_FAILURE_KIND.TRANSFER,
        failureError: new Error("broadcast"),
      },
    });

    expect(track).toHaveBeenLastCalledWith(
      SPONSORED_SEND_EVENT.SEND_FAILED,
      expect.objectContaining({
        failure_kind: SPONSORED_FAILURE_KIND.TRANSFER,
        error_name: "Error",
      }),
    );
  });

  it("tracks nothing when only the other inputs change", () => {
    const track = jest.fn();
    const { rerender } = renderTracking(track);

    rerender({ state: idle, standardFeeFiat: new BigNumber(643) });

    expect(track).not.toHaveBeenCalled();
  });
});
