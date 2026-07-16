/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { OperationType } from "@ledgerhq/types-live";
import type { SuiAccount, SuiValidator } from "./types";

jest.mock("@ledgerhq/coin-sui/preload", () => ({
  getCurrentSuiPreloadData: jest.fn(),
}));

jest.mock("@ledgerhq/coin-sui/getStakingExtraByDigest", () => ({
  getStakingExtraByDigest: jest.fn(),
}));

jest.mock("../../account", () => ({
  getAccountCurrency: jest.fn(),
}));

import { getCurrentSuiPreloadData } from "@ledgerhq/coin-sui/preload";
import { getStakingExtraByDigest } from "@ledgerhq/coin-sui/getStakingExtraByDigest";
import { getAccountCurrency } from "../../account";
import { useGetExtraDetails } from "./react";

const mockedGetPreloadData = getCurrentSuiPreloadData as jest.Mock;
const mockedGetStakingExtraByDigest = getStakingExtraByDigest as jest.Mock;
const mockedGetAccountCurrency = getAccountCurrency as jest.Mock;

const DIGEST = "FwkKBfz8vqKLrPNjqWUz26PamUehgMKkFkYaoEMxuCsz";
const VALIDATOR = "0xvalidator";
const VALIDATOR_NAME = "Ledger by Figment";
const STAKED = "1000000000";

const validator = (suiAddress: string, name: string): SuiValidator =>
  ({
    suiAddress,
    name,
    description: "",
    imageUrl: "",
    projectUrl: "",
    stakingPoolId: "",
    stakingPoolSuiBalance: "0",
    commissionRate: "0",
    apy: 0,
  }) as SuiValidator;

const makeAccount = (operations: unknown[] = []): SuiAccount =>
  ({ type: "Account", operations }) as unknown as SuiAccount;

const stakingOp = (extra: Record<string, unknown>, hash = DIGEST) =>
  ({
    id: "op",
    hash,
    type: "DELEGATE" as OperationType,
    extra,
  }) as unknown as SuiAccount["operations"][number];

describe("useGetExtraDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPreloadData.mockReturnValue({ validators: [validator(VALIDATOR, VALIDATOR_NAME)] });
    mockedGetAccountCurrency.mockReturnValue({ id: "sui", units: [{ code: "SUI", magnitude: 9 }] });
  });

  it("synced fast-path: resolves amount/address/name from op.extra without fetching", () => {
    const account = makeAccount([stakingOp({ validatorAddress: VALIDATOR, stakedAmount: STAKED })]);

    const { result } = renderHook(() => useGetExtraDetails(account, "DELEGATE", DIGEST));

    expect(result.current).toEqual({ amount: STAKED, address: VALIDATOR, name: VALIDATOR_NAME });
    expect(mockedGetStakingExtraByDigest).not.toHaveBeenCalled();
  });

  it("leaves name undefined when the validator is absent from preload", () => {
    const unknown = "0xunknown";
    const account = makeAccount([stakingOp({ validatorAddress: unknown, stakedAmount: STAKED })]);

    const { result } = renderHook(() => useGetExtraDetails(account, "DELEGATE", DIGEST));

    expect(result.current).toEqual({ amount: STAKED, address: unknown, name: undefined });
  });

  it("fallback: fetches by digest when the op carries no staking extra", async () => {
    mockedGetStakingExtraByDigest.mockResolvedValue({
      validatorAddress: VALIDATOR,
      stakedAmount: STAKED,
    });
    const account = makeAccount([]); // no op matches the digest

    const { result } = renderHook(() => useGetExtraDetails(account, "UNDELEGATE", DIGEST));

    expect(result.current).toEqual({}); // nothing synced yet

    await waitFor(() =>
      expect(result.current).toEqual({ amount: STAKED, address: VALIDATOR, name: VALIDATOR_NAME }),
    );
    expect(mockedGetStakingExtraByDigest).toHaveBeenCalledWith(DIGEST, "UNDELEGATE", "sui");
  });

  it("stays empty when the fallback resolves null", async () => {
    mockedGetStakingExtraByDigest.mockResolvedValue(null);
    const account = makeAccount([]);

    const { result } = renderHook(() => useGetExtraDetails(account, "DELEGATE", DIGEST));

    await waitFor(() => expect(mockedGetStakingExtraByDigest).toHaveBeenCalledTimes(1));
    expect(result.current).toEqual({});
  });

  it("returns {} for a non-staking op and never fetches", () => {
    const account = makeAccount([stakingOp({ validatorAddress: VALIDATOR, stakedAmount: STAKED })]);

    const { result } = renderHook(() => useGetExtraDetails(account, "OUT", DIGEST));

    expect(result.current).toEqual({});
    expect(mockedGetStakingExtraByDigest).not.toHaveBeenCalled();
  });
});
