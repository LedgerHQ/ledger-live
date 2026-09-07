import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import { getTokenAccountProgramId } from "../../helpers/token";
import { PARSED_PROGRAMS } from "../../network/chain/program/constants";
import type { SolanaTokenProgram } from "../../types";
import type { ChainAPI } from "../../network";
import type { StakeAccount } from "../../network/chain/stake-activation/rpc";
import { getBalance } from "../getBalance";
import { computeUnstakeReserve, getStakeAccounts } from "../getStakes";

// Only the network-bound helpers are stubbed: `mapStakeAccountToFrameworkStake` is the code
// under test here, so it runs for real.
jest.mock("../getStakes", () => ({
  ...jest.requireActual("../getStakes"),
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
    staker?: string;
    withdrawer?: string;
  },
) {
  const pubkey = options?.pubkey ?? "StakeAddr1111111111111111111111111111111111";
  const state = options?.state ?? "active";
  const voter = options?.voter ?? "Validator111111111111111111111111111111111111";
  const rentExemptReserve = options?.rentExemptReserve ?? DEFAULT_RENT_EXEMPT_RESERVE;
  // On chain `delegation.stake` is the delegated principal and excludes the rent-exempt reserve.
  // The default keeps it equal to the lamports for brevity; tests that care about the difference
  // pass an explicit `stake`.
  const delegatedStake = options?.stake ?? String(lamports);
  return {
    account: {
      onChainAcc: {
        pubkey: { toBase58: () => pubkey },
        account: { lamports },
      },
      info: {
        meta: {
          rentExemptReserve: {
            toString: () => String(rentExemptReserve),
            toNumber: () => rentExemptReserve,
          },
          authorized: {
            staker: { toBase58: () => options?.staker ?? TEST_ADDRESS },
            withdrawer: { toBase58: () => options?.withdrawer ?? TEST_ADDRESS },
          },
          lockup: {
            custodian: { toBase58: () => "Custodian11111111111111111111111111111111111" },
            unixTimestamp: 0,
            epoch: 0,
          },
        },
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
// A token account the wallet owns that is not the associated one for its mint.
const OTHER_TOKEN_ACCOUNT = "35npQR1u7vycmAjRS8H2ozoY7uTXPeZqUCJAm34Kidv1";

/**
 * A parsed on-chain token account as the RPC returns it. Complete rather than minimal: the
 * balance mapper validates it (superstruct) to read `state` and `extensions`.
 */
function parsedTokenAccount(
  mint: string,
  amount: string,
  options?: {
    state?: string;
    extensions?: unknown[];
    tokenProgram?: SolanaTokenProgram;
    /** Defaults to the owner's associated token account — the only one the bridge can spend. */
    pubkey?: PublicKey;
  },
) {
  const tokenProgram = options?.tokenProgram ?? PARSED_PROGRAMS.SPL_TOKEN;
  return {
    pubkey:
      options?.pubkey ??
      getAssociatedTokenAddressSync(
        new PublicKey(mint),
        new PublicKey(TEST_ADDRESS),
        undefined,
        getTokenAccountProgramId(tokenProgram),
      ),
    account: {
      data: {
        parsed: {
          info: {
            mint,
            owner: TEST_ADDRESS,
            state: options?.state ?? "initialized",
            isNative: false,
            tokenAmount: {
              amount,
              decimals: 6,
              uiAmount: Number(amount) / 1e6,
              uiAmountString: String(Number(amount) / 1e6),
            },
            ...(options?.extensions ? { extensions: options.extensions } : {}),
          },
        },
      },
    },
  };
}

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

  const mockGetEpochInfo = jest.fn().mockResolvedValue({ epoch: 400 }) as jest.MockedFunction<
    ChainAPI["getEpochInfo"]
  >;

  const api = {
    getBalance: mockGetBalance,
    getMinimumBalanceForRentExemption: mockGetMinimumBalanceForRentExemption,
    getParsedTokenAccountsByOwner: mockGetParsedTokenAccountsByOwner,
    getParsedToken2022AccountsByOwner: mockGetParsedToken2022AccountsByOwner,
    getEpochInfo: mockGetEpochInfo,
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
      value: [parsedTokenAccount(USDC_MINT, "5000000")],
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
        parsedTokenAccount(PYUSD_MINT, "10000000", {
          tokenProgram: PARSED_PROGRAMS.SPL_TOKEN_2022,
        }),
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

  it("surfaces a frozen token account so the bridge can block spending", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [parsedTokenAccount(USDC_MINT, "5000000", { state: "frozen" })],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    // locked === value, so buildTokenAccount derives spendableBalance 0 and the send is blocked
    expect(result[1].locked).toBe(5_000_000n);
    expect(result[1].value).toBe(5_000_000n);
  });

  // `craftTransaction` derives the associated token account rather than reading it off the
  // sub-account, so anything held elsewhere is unspendable — counting it would report a balance
  // the bridge cannot honour. The legacy bridge dropped those accounts too.
  it("ignores token accounts that are not the owner's associated one", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [
        parsedTokenAccount(USDC_MINT, "7000000"),
        parsedTokenAccount(USDC_MINT, "3000000", { pubkey: new PublicKey(OTHER_TOKEN_ACCOUNT) }),
      ],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result).toHaveLength(2);
    expect(result[1].value).toBe(7_000_000n);
  });

  it("reports no balance for a mint held only outside the associated token account", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [
        parsedTokenAccount(USDC_MINT, "3000000", { pubkey: new PublicKey(OTHER_TOKEN_ACCOUNT) }),
      ],
    });

    expect(await getBalance(api, TEST_ADDRESS)).toHaveLength(1);
  });

  it("does not lock a healthy token account", async () => {
    mockGetBalance.mockResolvedValue(1_000_000_000);
    mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    mockGetParsedTokenAccountsByOwner.mockResolvedValue({
      value: [parsedTokenAccount(USDC_MINT, "5000000")],
    });

    const result = await getBalance(api, TEST_ADDRESS);

    expect(result[1].locked).toBeUndefined();
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

    it("reports the delegated principal as amount, excluding the rent-exempt reserve", async () => {
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
      // The framework sums `amount` into delegatedBalance, so it must be the delegated
      // principal — not the account's lamports, which also cover the rent-exempt reserve.
      expect(stake.amount).toBe(BigInt(delegated));
      expect(stake.amountDeposited).toBe(BigInt(delegated));
      // Solana compounds rewards into the delegation; nothing is separately claimable.
      expect(stake.amountRewarded).toBe(0n);
      expect(stake.amount).toBe((stake.amountDeposited ?? 0n) + (stake.amountRewarded ?? 0n));
      // `value` still carries what the stake account actually holds.
      expect(result[1].value).toBe(BigInt(lamports));
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

    it("populates stake.actions and the position details the generic bridge reads", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      const lamports = 2_000_000_000;
      const active = lamports - DEFAULT_RENT_EXEMPT_RESERVE - 5_000_000;
      const stakeAccount = makeStakeAccountStub(lamports, { stake: String(active) });
      stakeAccount.activation.active = active;
      mockGetStakeAccounts.mockResolvedValue([stakeAccount] as StakeAccount[]);

      const result = await getBalance(api, TEST_ADDRESS);

      const stake = result[1].stake!;
      // active stake with withdrawable lamports on top (e.g. Jito MEV rewards)
      expect(stake.actions).toEqual(["claim_reward", "undelegate"]);
      expect(stake.details).toMatchObject({
        activeAmount: active,
        inactiveAmount: 0,
        withdrawableAmount: 5_000_000,
        lockedReserve: DEFAULT_RENT_EXEMPT_RESERVE,
        canStake: true,
        canWithdraw: true,
      });
    });

    it("reports a fully deactivated stake as inactive, with nothing delegated", async () => {
      mockGetBalance.mockResolvedValue(1_000_000_000);
      mockGetMinimumBalanceForRentExemption.mockResolvedValue(890880);
      mockGetParsedTokenAccountsByOwner.mockResolvedValue({ value: [] });
      const stakeAccount = makeStakeAccountStub(2_000_000_000, { state: "inactive" });
      stakeAccount.activation.active = 0;
      stakeAccount.activation.inactive = 2_000_000_000;
      mockGetStakeAccounts.mockResolvedValue([stakeAccount] as StakeAccount[]);

      const result = await getBalance(api, TEST_ADDRESS);

      const stake = result[1].stake!;
      expect(stake.state).toBe("inactive");
      expect(stake.amount).toBe(0n);
      expect(stake.actions).toEqual(["claim_reward", "delegate"]);
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
