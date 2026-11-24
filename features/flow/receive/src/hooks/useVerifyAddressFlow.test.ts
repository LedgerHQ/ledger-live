import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { AccountUUIDSchema } from "@domain/entity-account";
import type { VerifyAddressOutcome, VerifyAddressSelection } from "../types";
import { useVerifyAddressFlow } from "./useVerifyAddressFlow";

const { verification } = mockAccountReceive();

const SELECTION: VerifyAddressSelection = {
  accountUUID: AccountUUIDSchema.parse("0fd543d7-5125-5f32-95c7-937d6a169ed4"),
  assetId: CryptoOrTokenCurrencyIdSchema.parse("ethereum"),
  verification: verification!,
};

function renderFlow() {
  const { result } = renderHook(() => useVerifyAddressFlow());
  return { result };
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

  it("should keep the running verification when start is called again", () => {
    const { result } = renderFlow();
    act(() => result.current.start(SELECTION));
    const other = { ...SELECTION, assetId: CryptoOrTokenCurrencyIdSchema.parse("bitcoin") };

    act(() => result.current.start(other));

    expect(result.current.selection).toBe(SELECTION);
  });

  it("should start a new verification once the previous one exited", () => {
    const { result } = renderFlow();
    act(() => result.current.start(SELECTION));
    act(() => result.current.onExit("displayed"));
    const other = { ...SELECTION, assetId: CryptoOrTokenCurrencyIdSchema.parse("bitcoin") };

    act(() => result.current.start(other));

    expect(result.current.selection).toBe(other);
  });

  it.each<VerifyAddressOutcome>([
    "displayed",
    "verified",
    "cancelled",
    "mismatch",
    "unsupported",
    "dismissed",
    "failed",
  ])("should return to the address screen when the verification ends as %s", outcome => {
    const { result } = renderFlow();
    act(() => result.current.start(SELECTION));

    act(() => result.current.onExit(outcome));

    expect(result.current).toMatchObject({ active: false, selection: null });
  });
});
