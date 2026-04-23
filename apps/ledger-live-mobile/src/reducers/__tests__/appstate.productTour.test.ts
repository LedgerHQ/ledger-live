import { tickProductTourDeeplink } from "~/actions/appstate";
import type { State } from "../types";
import reducer, { INITIAL_STATE, productTourDeeplinkNonceSelector } from "../appstate";

describe("appstate product tour deeplink nonce", () => {
  it("should increment productTourDeeplinkNonce when tickProductTourDeeplink is dispatched", () => {
    const after = reducer(INITIAL_STATE, tickProductTourDeeplink());

    expect(after.productTourDeeplinkNonce).toBe(1);
  });

  it("should increment on each tick", () => {
    const first = reducer(INITIAL_STATE, tickProductTourDeeplink());
    const second = reducer(first, tickProductTourDeeplink());

    expect(second.productTourDeeplinkNonce).toBe(2);
  });

  it("should expose nonce via productTourDeeplinkNonceSelector", () => {
    const appstate = reducer(INITIAL_STATE, tickProductTourDeeplink());
    const state = { appstate } as unknown as State;

    expect(productTourDeeplinkNonceSelector(state)).toBe(1);
  });
});
