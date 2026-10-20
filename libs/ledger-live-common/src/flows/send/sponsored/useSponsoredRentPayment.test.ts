/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import type { EnergyRentOrder } from "../../../bridge/generic-coin-framework/sponsored";
import { USDT_RENT_PAYMENT } from "./fixtures/usdt";
import { SPONSORED_PHASE, type SponsoredState } from "./types";
import type { SponsoredSendActions } from "./useSponsoredSendOrchestration";
import { useSponsoredRentPayment } from "./useSponsoredRentPayment";

const IDLE_STATE: SponsoredState = {
  phase: SPONSORED_PHASE.IDLE,
  order: null,
  toSign: null,
  rentPayment: null,
  payerAddress: null,
  receiverAddress: null,
  energyNeeded: null,
  paymentTxId: null,
  failureKind: null,
  failureError: null,
  rentOrderRejection: null,
  retryLockedUntil: null,
};

const ORDER = { orderId: "order-1" } as unknown as EnergyRentOrder;
const SIGNING_STATE: SponsoredState = {
  ...IDLE_STATE,
  phase: SPONSORED_PHASE.RENT_SIGNING,
  order: ORDER,
  toSign: "0a02",
  rentPayment: USDT_RENT_PAYMENT,
  paymentTxId: "txA",
};

const makeActions = (craftRent = jest.fn().mockResolvedValue(undefined)) =>
  ({
    craftRent,
    startRentPayment: jest.fn().mockResolvedValue(undefined),
  }) as unknown as SponsoredSendActions & {
    craftRent: jest.Mock;
    startRentPayment: jest.Mock;
  };

const REVIEW_FEE = 3_200_000n;

const render = (
  state: SponsoredState,
  actions: SponsoredSendActions,
  approvedFee: bigint | null = REVIEW_FEE,
) =>
  renderHook(
    ({ state: current, actions: currentActions }) =>
      useSponsoredRentPayment({
        state: current,
        actions: currentActions,
        approvedFee,
        locale: "en",
      }),
    { initialProps: { state, actions } },
  );

describe("useSponsoredRentPayment", () => {
  it.each([
    ["the fee shown on Review", REVIEW_FEE],
    ["no fee when Review showed none", null],
  ])("crafts with %s", (_label, approvedFee) => {
    const actions = makeActions();
    render(IDLE_STATE, actions, approvedFee);

    expect(actions.craftRent).toHaveBeenCalledWith(approvedFee);
  });

  it("crafts once on entry, even when the actions are rebuilt mid-craft", async () => {
    let finishCraft: (() => void) | undefined;
    const craftRent = jest.fn(
      () =>
        new Promise<void>(resolve => {
          finishCraft = resolve;
        }),
    );
    const { rerender, result } = render(IDLE_STATE, makeActions(craftRent));
    expect(result.current.isCrafting).toBe(true);

    rerender({ state: IDLE_STATE, actions: makeActions(craftRent) });
    await act(async () => finishCraft?.());

    expect(craftRent).toHaveBeenCalledTimes(1);
  });

  it("doesn't craft while an order is already there", () => {
    const actions = makeActions();
    const { result } = render(SIGNING_STATE, actions);

    expect(actions.craftRent).not.toHaveBeenCalled();
    expect(result.current.isCrafting).toBe(false);
  });

  it("submits each order's signature once, with the paymentTxId of its order", () => {
    const actions = makeActions();
    const { result } = render(SIGNING_STATE, actions);

    act(() => result.current.submitSignature("sig"));
    act(() => result.current.submitSignature("sig"));

    expect(actions.startRentPayment).toHaveBeenCalledTimes(1);
    expect(actions.startRentPayment).toHaveBeenCalledWith("sig", "txA");
  });

  it("formats the rent in its fee asset", () => {
    const { result } = render(SIGNING_STATE, makeActions());

    expect(result.current.feeAmountLabel).toMatch(/3\.2.*USDT/);
  });

  it("has no fee label before a rent is crafted", () => {
    const { result } = render(IDLE_STATE, makeActions());

    expect(result.current.feeAmountLabel).toBeNull();
  });
});
