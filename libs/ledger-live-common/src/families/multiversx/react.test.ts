/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { useSearchValidators } from "./react";
import type { MultiversXProvider } from "./types";

const EGLD = "000000000000000000";

const makeValidator = (
  contract: string,
  totalActiveStake: string,
  maxDelegationCap = "0",
): MultiversXProvider =>
  ({
    contract,
    totalActiveStake,
    maxDelegationCap,
    withDelegationCap: maxDelegationCap !== "0",
    identity: { key: contract, name: contract, avatar: "", description: "" },
  }) as MultiversXProvider;

describe("useSearchValidators", () => {
  it("sorts by stake, with an unreadable stake last", () => {
    const validators = [
      makeValidator("a", `1${EGLD}`),
      makeValidator("b", ""),
      makeValidator("c", `5${EGLD}`),
    ];

    const { result } = renderHook(() => useSearchValidators(validators, ""));

    expect(result.current.map(v => v.contract)).toEqual(["c", "a", "b"]);
  });

  it("disables a capped validator whose cap or stake is unreadable", () => {
    const validators = [
      makeValidator("full", `10${EGLD}`, `10${EGLD}`),
      makeValidator("open", `1${EGLD}`, `10${EGLD}`),
      makeValidator("badStake", "abc", `10${EGLD}`),
      makeValidator("badCap", `1${EGLD}`, "abc"),
      makeValidator("uncapped", "abc"),
    ];

    const { result } = renderHook(() => useSearchValidators(validators, ""));
    const disabled = Object.fromEntries(result.current.map(v => [v.contract, v.disabled]));

    expect(disabled).toEqual({
      full: true,
      open: false,
      badStake: true,
      badCap: true,
      uncapped: false,
    });
  });
});
