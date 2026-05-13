/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { StakingValidatorItem } from "@ledgerhq/coin-evm/types/index";
import * as stakingIndex from "@ledgerhq/coin-evm/staking/index";
import { useEvmStakingValidators } from "./react";

jest.mock("@ledgerhq/coin-evm/staking/index", () => {
  const actual = jest.requireActual("@ledgerhq/coin-evm/staking/index");
  return {
    ...actual,
    getValidators: jest.fn(),
  };
});

const mockedGetValidators = jest.mocked(stakingIndex.getValidators);

const sampleValidators: StakingValidatorItem[] = [
  {
    validatorAddress: "addr-a",
    name: "Joe",
    commission: 0.05,
    tokens: 100,
    votingPower: 1,
    estimatedYearlyRewardsRate: 0,
  },
  {
    validatorAddress: "addr-b",
    name: "Moxie",
    commission: 1,
    tokens: 999,
    votingPower: 2,
    estimatedYearlyRewardsRate: 0,
  },
  {
    validatorAddress: "addr-c",
    name: "Bruce",
    commission: 0.1,
    tokens: 500,
    votingPower: 3,
    estimatedYearlyRewardsRate: 0,
  },
];

describe("useEvmStakingValidators", () => {
  beforeEach(() => {
    mockedGetValidators.mockReset();
  });

  it("should filter out 100% commission validators, sort by total stake desc, and finish loading", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const { result } = renderHook(() => useEvmStakingValidators("sei_evm"));

    expect(result.current.loading).toBe(true);
    expect(result.current.validators).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetValidators).toHaveBeenCalledWith("sei_evm");
    expect(result.current.error).toBeNull();
    expect(result.current.validators.map(v => v.validatorAddress)).toEqual(["addr-c", "addr-a"]);
  });

  it("should narrow validators by case-insensitive name search", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const { result, rerender } = renderHook(
      ({ search }: { search?: string }) => useEvmStakingValidators("sei_evm", search),
      { initialProps: { search: undefined as string | undefined } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.validators).toHaveLength(2);

    rerender({ search: "jo" });

    expect(result.current.loading).toBe(false);
    expect(result.current.validators).toHaveLength(1);
    expect(result.current.validators[0].name).toBe("Joe");
  });

  it("should set error when getValidators rejects", async () => {
    const boom = new Error("network error");
    mockedGetValidators.mockRejectedValue(boom);

    const { result } = renderHook(() => useEvmStakingValidators("sei_evm"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual(boom);
    expect(result.current.validators).toEqual([]);
  });

  it("should ignore stale responses when currencyId changes mid-flight", async () => {
    const seiValidators: StakingValidatorItem[] = [
      {
        validatorAddress: "sei-addr",
        name: "Sei Validator",
        commission: 0.05,
        tokens: 100,
        votingPower: 1,
        estimatedYearlyRewardsRate: 0,
      },
    ];
    const celoValidators: StakingValidatorItem[] = [
      {
        validatorAddress: "celo-addr",
        name: "Celo Validator",
        commission: 0.1,
        tokens: 200,
        votingPower: 1,
        estimatedYearlyRewardsRate: 0,
      },
    ];

    // sei_evm resolves after celo to simulate a slow first request.
    let resolveSei!: (v: StakingValidatorItem[]) => void;
    const seiPromise = new Promise<StakingValidatorItem[]>(res => {
      resolveSei = res;
    });

    mockedGetValidators.mockImplementation(currencyId =>
      currencyId === "sei_evm" ? seiPromise : Promise.resolve(celoValidators),
    );

    const { result, rerender } = renderHook(
      ({ currencyId }: { currencyId: string }) => useEvmStakingValidators(currencyId),
      { initialProps: { currencyId: "sei_evm" } },
    );

    // Switch to celo before sei_evm resolves.
    rerender({ currencyId: "celo" });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // celo validators should be shown.
    expect(result.current.validators.map(v => v.validatorAddress)).toEqual(["celo-addr"]);

    // Now let the stale sei_evm request resolve — state must not change.
    resolveSei(seiValidators);
    await Promise.resolve();
    await Promise.resolve();

    expect(result.current.validators.map(v => v.validatorAddress)).toEqual(["celo-addr"]);
  });
});
