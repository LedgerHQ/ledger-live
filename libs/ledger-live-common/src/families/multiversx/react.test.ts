/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type { MultiversXProvider } from "./types";
import { useSearchValidators } from "./react";

const provider = (contract: string, stakes: Partial<MultiversXProvider>): MultiversXProvider =>
  ({
    contract,
    maxDelegationCap: "0",
    totalActiveStake: "0",
    withDelegationCap: false,
    identity: { name: contract },
    ...stakes,
  }) as MultiversXProvider;

describe("useSearchValidators", () => {
  it("sorts by stake and keeps validators with unreadable stakes instead of throwing", () => {
    const validators = [
      provider("missing", { totalActiveStake: undefined as unknown as string }),
      provider("big", { totalActiveStake: "3000000000000000000000" }),
      provider("garbage", {
        totalActiveStake: "abc",
        maxDelegationCap: "abc",
        withDelegationCap: true,
      }),
      provider("small", { totalActiveStake: "1000000000000000000" }),
    ];

    const { result } = renderHook(() => useSearchValidators(validators, ""));

    expect(result.current.map(v => v.contract).slice(0, 2)).toEqual(["big", "small"]);
    expect(result.current).toHaveLength(4);
    expect(result.current.find(v => v.contract === "garbage")?.disabled).toBe(true);
    expect(result.current.map(v => v.totalActiveStake).slice(2)).toEqual(["0", "0"]);
  });

  it("treats an out-of-range stake as 0 instead of expanding it", () => {
    const validators = [
      provider("huge", { totalActiveStake: "1e1000000" }),
      provider("negative", { totalActiveStake: "-5" }),
      provider("fractional", { totalActiveStake: "1.5" }),
    ];

    const { result } = renderHook(() => useSearchValidators(validators, ""));

    expect(result.current.map(v => v.totalActiveStake)).toEqual(["0", "0", "0"]);
  });

  it.each([
    ["stake", { totalActiveStake: "1e1000000", maxDelegationCap: "5000000000000000000000" }],
    ["cap", { totalActiveStake: "1000", maxDelegationCap: "1e1000000" }],
  ])("disables a capped validator whose %s cannot be read", (_label, values) => {
    const validators = [provider("unreadable", { ...values, withDelegationCap: true })];

    const { result } = renderHook(() => useSearchValidators(validators, ""));

    expect(result.current[0]).toMatchObject({ disabled: true });
  });

  it("does not mutate the preloaded validators", () => {
    const original = provider("huge", { totalActiveStake: "1e1000000" });

    const { result } = renderHook(() => useSearchValidators([original], ""));

    expect(result.current[0].totalActiveStake).toBe("0");
    expect(original.totalActiveStake).toBe("1e1000000");
    expect(original).not.toHaveProperty("disabled");
  });

  it("disables a capped validator whose remaining room is below the minimum delegation", () => {
    const validators = [
      provider("full", {
        totalActiveStake: "1000",
        maxDelegationCap: "1000",
        withDelegationCap: true,
      }),
    ];

    const { result } = renderHook(() => useSearchValidators(validators, ""));

    expect(result.current[0].disabled).toBe(true);
  });
});
