import { act, renderHook } from "@testing-library/react";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import type { VerifyAddressOutcome, VerifyAddressSelection } from "../types";
import { useVerifyAddressFlow } from "./useVerifyAddressFlow";

const { verification } = mockAccountReceive();

const SELECTION: VerifyAddressSelection = {
  accountUUID: AccountUUIDSchema.parse("0fd543d7-5125-5f32-95c7-937d6a169ed4"),
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  verification: verification!,
};

function renderFlow() {
  const onCloseFlow = jest.fn();
  const { result } = renderHook(() => useVerifyAddressFlow({ onCloseFlow }));
  return { onCloseFlow, result };
}

describe("useVerifyAddressFlow", () => {
  it("should not run any verification at first", () => {
    const { result } = renderFlow();

    expect(result.current).toMatchObject({ active: false, selection: null });
  });

  it("should mount the device verification right away on start", () => {
    const { result } = renderFlow();

    act(() => result.current.start(SELECTION));

    expect(result.current).toMatchObject({ active: true, selection: SELECTION });
  });

  it.each<VerifyAddressOutcome>([
    "verified",
    "cancelled",
    "unsupported",
    "dismissed",
    "initFailed",
  ])("should return to the address screen when the verification ends as %s", outcome => {
    const { onCloseFlow, result } = renderFlow();
    act(() => result.current.start(SELECTION));

    act(() => result.current.onExit(outcome));

    expect(result.current).toMatchObject({ active: false, selection: null });
    expect(onCloseFlow).not.toHaveBeenCalled();
  });

  it("should close the receive flow when the device shows another address", () => {
    const { onCloseFlow, result } = renderFlow();
    act(() => result.current.start(SELECTION));

    act(() => result.current.onExit("mismatch"));

    expect(result.current).toMatchObject({ active: false, selection: null });
    expect(onCloseFlow).toHaveBeenCalledTimes(1);
  });
});
