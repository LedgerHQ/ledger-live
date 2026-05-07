/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import type { ChainAPI } from "../../network";
import type { StakeAccount } from "../../network/chain/stake-activation/rpc";
import { getBalance } from "../getBalance";
import { getStakeAccounts, computeUnstakeReserve } from "../getStakes";

jest.mock("../getStakes", () => ({
  getStakeAccounts: jest.fn().mockResolvedValue([]),
  computeUnstakeReserve: jest.fn().mockResolvedValue(0),
}));

const mockGetStakeAccounts = jest.mocked(getStakeAccounts);
const mockComputeUnstakeReserve = jest.mocked(computeUnstakeReserve);

const DEFAULT_RENT_EXEMPT_RESERVE = 2_282_880;

function makeStakeAccountStub(
  lamports: number,
  options?: {
    pubkey?: string;
    state?: string;
    voter?: string;
    stake?: string;
    rentExemptReserve?: number;
  },
) {
  const pubkey = options?.pubkey ?? "StakeAddr1111111111111111111111111111111111";
  const state = options?.state ?? "active";
  const voter = options?.voter ?? "Validator111111111111111111111111111111111111";
  const rentExemptReserve = options?.rentExemptReserve ?? DEFAULT_RENT_EXEMPT_RESERVE;
  // On Solana delegation.stake includes the rent-exempt reserve (full amount deposited).
  const delegatedStake = options?.stake ?? String(lamports);
  return {
    account: {
      onChainAcc: {
        pubkey: { toBase58: () => pubkey },
        account: { lamports },
      },
      info: {
        meta: { rentExemptReserve: { toString: () => String(rentExemptReserve) } },
        stake: {
          delegation: {
            voter: { toBase58: () => voter },
            activationEpoch: { toString: () => "100" },
            deactivationEpoch: { toString: () => "9999999999999999" },
            stake: { toString: () => delegatedStake },
          },
        },
      },
    },
    activation: { state, active: lamports, inactive: 0 },
  };
}

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

describe("getBalance", () => {
  const mockGetBalance = jest.fn() as jest.MockedFunction<ChainAPI["getBalance"]>;
  const mockGetMinimumBalanceForRentExemption = jest.fn() as jest.MockedFunction<
    ChainAPI["getMinimumBalanceForRentExemption"]
  >;
  const mockGetParsedTokenAccountsByOwner = jest.fn() as jest.MockedFunction<
    DeepPartialReturn<ChainAPI["getParsedTokenAccountsByOwner"]>
  >;
  const mockGetParsedToken2022AccountsByOwner = jest.fn() as jest.MockedFunction<
    DeepPartialReturn<ChainAPI["getParsedTokenAccountsByOwner"]>
  >;

  const api = {
    getBalance: mockGetBalance,
    getMinimumBalanceForRentExemption: mockGetMinimumBalanceForRentExemption,
    getParsedTokenAccountsByOwner: mockGetParsedTokenAccountsByOwner,
    getParsedToken2022AccountsByOwner: mockGetParsedToken2022AccountsByOwner,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return native balance with locked rent exemption", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toEqual([
      {
        value: BigInt(1_000_000_000),
        asset: { type: "native" },
        locked: BigInt(890880),
      },
    ]);
    expect(mockGetBalance).toHaveBeenCalledWith(TEST_ADDRESS);
    expect(mockGetMinimumBalanceForRentExemption).toHaveBeenCalledWith(0);
    expect(mockGetParsedToken2022AccountsByOwner).not.toHaveBeenCalled();
  });

  it("should include SPL Token balances", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  mint: USDC_MINT,
                  tokenAmount: { amount: "5000000" },
                },
              },
            },
          },
        },
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 5_000_000n,
      asset: { type: "spl-token", assetReference: USDC_MINT, assetOwner: TEST_ADDRESS },
    });
    expect(mockGetParsedToken2022AccountsByOwner).not.toHaveBeenCalled();
  });

  it("should include Token-2022 balances when enabled", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
    mockGetParsedToken2022AccountsByOwner.mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  mint: PYUSD_MINT,
                  tokenAmount: { amount: "10000000" },
                },
              },
            },
          },
        },
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS, { token2022Enabled: true });

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 10_000_000n,
      asset: { type: "spl-token-2022", assetReference: PYUSD_MINT, assetOwner: TEST_ADDRESS },
    });
    expect(mockGetParsedToken2022AccountsByOwner).toHaveBeenCalledWith(TEST_ADDRESS);
  });

  it("should aggregate multiple token accounts for the same mint", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [
        {
          account: {
            data: { parsed: { info: { mint: USDC_MINT, tokenAmount: { amount: "3000000" } } } },
          },
        },
        {
          account: {
            data: { parsed: { info: { mint: USDC_MINT, tokenAmount: { amount: "7000000" } } } },
          },
        },
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      value: 10_000_000n,
      asset: { type: "spl-token", assetReference: USDC_MINT, assetOwner: TEST_ADDRESS },
    });
  });

  it("should propagate errors from getBalance", async () => {
    mockGetBalance.mockRejectedValue(new Error("RPC error"));
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });

    await expect(getBalance(api, TEST_ADDRESS)).rejects.toThrow("RPC error");
  });

  describe("stakeAccounts", () => {
    it("should include staked lamports in totalBalance", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(2_000_000_000),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(0);

      const result = await getBalance(api, TEST_ADDRESS);

      expect(result[0]).toEqual({
        value: 3_000_000_000n,
        asset: { type: "native" },
        locked: 890880n + 2_000_000_000n,
      });
      expect(result[1]).toMatchObject({
        value: 2_000_000_000n,
        asset: { type: "native" },
        stake: expect.objectContaining({ amount: 2_000_000_000n, state: "active" }),
      });
      const stake = result[1].stake!;
      // Invariant: total stake amount equals deposited principal plus accrued rewards.
      expect(stake.amount).toBe((stake.amountDeposited ?? 0n) + (stake.amountRewarded ?? 0n));
    });

    it("should report zero rewards for a freshly delegated stake with no accrued rewards", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      const lamports = 2_000_000_000;
      // No-rewards case: delegated stake equals the full account lamports
      // (e.g. just after delegation, before any epoch reward has accrued).
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(lamports, { stake: String(lamports) }),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(0);

      const result = await getBalance(api, TEST_ADDRESS);

      const stake = result[1].stake!;
      expect(stake.amount).toBe(BigInt(lamports));
      expect(stake.amountDeposited).toBe(BigInt(lamports));
      expect(stake.amountRewarded).toBe(0n);
      expect(stake.amount).toBe((stake.amountDeposited ?? 0n) + (stake.amountRewarded ?? 0n));
    });

    it("should compute amountRewarded as the delta between lamports and delegated stake", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      const lamports = 2_050_000_000;
      const delegated = lamports - DEFAULT_RENT_EXEMPT_RESERVE - 10_000_000;
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(lamports, { stake: String(delegated) }),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(0);

      const result = await getBalance(api, TEST_ADDRESS);

      const stake = result[1].stake!;
      expect(stake.amount).toBe(BigInt(lamports));
      expect(stake.amountDeposited).toBe(BigInt(delegated));
      expect(stake.amountRewarded).toBe(BigInt(lamports - delegated));
      expect(stake.amount).toBe((stake.amountDeposited ?? 0n) + (stake.amountRewarded ?? 0n));
    });

    it("should include unstakeReserve in locked", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(2_000_000_000),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(11000);

      const result = await getBalance(api, TEST_ADDRESS);

      // locked = rentExemptMin + stakedLamports + unstakeReserve
      expect(result[0]).toEqual({
        value: 3_000_000_000n,
        asset: { type: "native" },
        locked: 890880n + 2_000_000_000n + 11000n,
      });
    });

    it("should clamp locked to totalBalance when rawLocked exceeds it", async () => {
      mockGetBalance.mockResolvedValue(100);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([makeStakeAccountStub(1000)] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(999_999);

      const result = await getBalance(api, TEST_ADDRESS);

      // totalBalance = 100 + 1000 = 1100
      // rawLocked = 100 (balance < rentExemptMin) + 1000 + 999_999 = 1_001_099 > 1100
      expect(result[0]).toEqual({
        value: 1100n,
        asset: { type: "native" },
        locked: 1100n,
      });
    });

    it("should sum lamports across multiple stake accounts", async () => {
      mockGetBalance.mockResolvedValue(500_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      mockGetStakeAccounts.mockResolvedValue([
        makeStakeAccountStub(1_000_000_000, { pubkey: "Stake1" }),
        makeStakeAccountStub(3_000_000_000, { pubkey: "Stake2" }),
      ] as StakeAccount[]);
      mockComputeUnstakeReserve.mockResolvedValue(0);

      const result = await getBalance(api, TEST_ADDRESS);

      expect(result[0]).toEqual({
        value: 4_500_000_000n,
        asset: { type: "native" },
        locked: 890880n + 4_000_000_000n,
      });
      // two stake balance entries
      expect(result).toHaveLength(3);
      expect(result[1]).toMatchObject({ value: 1_000_000_000n, stake: { uid: "Stake1" } });
      expect(result[2]).toMatchObject({ value: 3_000_000_000n, stake: { uid: "Stake2" } });
    });
  });
});
