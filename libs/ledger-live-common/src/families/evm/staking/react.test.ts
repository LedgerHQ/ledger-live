/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import BigNumber from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type { StakingValidatorItem, StakingAccount, StakingDelegation } from "@ledgerhq/types-live";
import * as stakingIndex from "@ledgerhq/coin-evm/staking/index";
import * as accountModule from "../../../account";
import {
  useEvmStakingValidators,
  useEvmFamilyPreloadData,
  useEvmFamilyMappedDelegations,
} from "./react";

jest.mock("@ledgerhq/coin-evm/staking/index", () => {
  const actual = jest.requireActual("@ledgerhq/coin-evm/staking/index");
  return {
    ...actual,
    getValidators: jest.fn(),
  };
});

jest.mock("../../../account", () => ({
  getAccountCurrency: jest.fn(),
}));

const mockedGetValidators = jest.mocked(stakingIndex.getValidators);
const mockedGetAccountCurrency = jest.mocked(accountModule.getAccountCurrency);

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

const seiUnit: Unit = { name: "SEI", code: "SEI", magnitude: 6 };

const makeAccount = (delegations: StakingDelegation[]): StakingAccount =>
  ({
    currency: { id: "sei_evm" },
    stakingResources: { delegations },
  }) as unknown as StakingAccount;

describe("useEvmFamilyPreloadData", () => {
  beforeEach(() => {
    mockedGetValidators.mockReset();
  });

  it("should return validators once loaded", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const { result } = renderHook(() => useEvmFamilyPreloadData("sei_evm"));

    await waitFor(() => expect(result.current.validators).toHaveLength(2));

    expect(result.current.validators.map(v => v.validatorAddress)).toEqual(["addr-c", "addr-a"]);
  });

  it("should return empty validators while loading", () => {
    mockedGetValidators.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useEvmFamilyPreloadData("sei_evm"));

    expect(result.current.validators).toEqual([]);
  });

  it("should not expose loading or error fields", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const { result } = renderHook(() => useEvmFamilyPreloadData("sei_evm"));

    await waitFor(() => expect(result.current.validators).toHaveLength(2));

    expect(result.current).not.toHaveProperty("loading");
    expect(result.current).not.toHaveProperty("error");
  });
});

describe("useEvmFamilyMappedDelegations", () => {
  beforeEach(() => {
    mockedGetValidators.mockReset();
    mockedGetAccountCurrency.mockReturnValue({ units: [seiUnit] } as ReturnType<
      typeof accountModule.getAccountCurrency
    >);
  });

  it("should return mapped delegations enriched with matching validator and rank", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const delegations: StakingDelegation[] = [
      {
        validatorAddress: "addr-c",
        amount: new BigNumber(1_000_000),
        pendingRewards: new BigNumber(500),
        status: "bonded",
      },
    ];
    const account = makeAccount(delegations);

    const { result } = renderHook(() => useEvmFamilyMappedDelegations(account));

    await waitFor(() => expect(result.current[0]?.validator).toBeDefined());

    const [mapped] = result.current;
    expect(mapped.validatorAddress).toBe("addr-c");
    expect(mapped.validator?.name).toBe("Bruce");
    expect(mapped.rank).toBe(0);
    expect(mapped.formattedAmount).toMatch(/SEI/);
    expect(mapped.formattedPendingRewards).toMatch(/SEI/);
  });

  it("should set validator to undefined when no matching validator is found", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const delegations: StakingDelegation[] = [
      {
        validatorAddress: "addr-unknown",
        amount: new BigNumber(1_000_000),
        pendingRewards: new BigNumber(0),
        status: "bonded",
      },
    ];
    const account = makeAccount(delegations);

    const { result } = renderHook(() => useEvmFamilyMappedDelegations(account));

    await waitFor(() => expect(mockedGetValidators).toHaveBeenCalled());

    expect(result.current[0].validator).toBeUndefined();
    expect(result.current[0].rank).toBe(-1);
  });

  it("should return an empty array when account has no delegations", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const account = makeAccount([]);

    const { result } = renderHook(() => useEvmFamilyMappedDelegations(account));

    await waitFor(() => expect(mockedGetValidators).toHaveBeenCalled());

    expect(result.current).toEqual([]);
  });

  it("should return an empty array when stakingResources is absent", async () => {
    mockedGetValidators.mockResolvedValue(sampleValidators);

    const account = {
      currency: { id: "sei_evm" },
    } as unknown as StakingAccount;

    const { result } = renderHook(() => useEvmFamilyMappedDelegations(account));

    await waitFor(() => expect(mockedGetValidators).toHaveBeenCalled());

    expect(result.current).toEqual([]);
  });
});
