import type { DeepPartial, DeepPartialReturn } from "@ledgerhq/coin-module-framework/test/utils";
import { PublicKey, type StakeActivationData } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import type { ChainAPI } from "../../network";
import { getStakeAccounts } from "../../network/chain/stake-activation/rpc";
import type { StakeAccount } from "../../network/chain/stake-activation/rpc";
import { estimateTxFee } from "../estimateFees";
import { computeUnstakeReserve, getStakes, mapStakeAccountsToSolanaStakes } from "../getStakes";

jest.mock("../../network/chain/stake-activation/rpc", () => ({
  getStakeAccounts: jest.fn(),
}));

jest.mock("../estimateFees", () => ({
  estimateTxFee: jest.fn(),
}));

const mockGetStakeAccounts = getStakeAccounts as unknown as jest.MockedFunction<
  DeepPartialReturn<typeof getStakeAccounts>
>;
const mockEstimateTxFee = estimateTxFee as jest.MockedFunction<typeof estimateTxFee>;

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const STAKE_PUBKEY = new PublicKey("AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ");
const VOTER_PUBKEY = new PublicKey("EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4");

const api = {} as ChainAPI;

function makeStakeAccount(overrides?: {
  state?: StakeActivationData["state"];
  lamports?: number;
  active?: number;
  inactive?: number;
}): DeepPartial<StakeAccount> {
  const {
    state = "active",
    lamports = 5_000_000_000,
    active = 4_997_717_120,
    inactive = 0,
  } = overrides ?? {};

  return {
    account: {
      onChainAcc: {
        pubkey: STAKE_PUBKEY,
        account: { lamports },
      },
      info: {
        meta: {
          rentExemptReserve: new BigNumber(2282880),
          authorized: {
            staker: new PublicKey(TEST_ADDRESS),
            withdrawer: new PublicKey(TEST_ADDRESS),
          },
          lockup: { unixTimestamp: 0, epoch: 0, custodian: PublicKey.default },
        },
        stake: {
          delegation: {
            voter: VOTER_PUBKEY,
            stake: new BigNumber(4_997_717_120),
            activationEpoch: new BigNumber(300),
            deactivationEpoch: new BigNumber("18446744073709551615"),
            warmupCooldownRate: 0.09,
          },
          creditsObserved: 100000,
        },
      },
    },
    activation: { state, active, inactive },
    reward: null,
  };
}

describe("getStakes", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return empty page when no stake accounts", async () => {
    mockGetStakeAccounts.mockResolvedValue([]);

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result).toEqual({ items: [] });
    expect(mockGetStakeAccounts).toHaveBeenCalledWith(api, TEST_ADDRESS);
  });

  it("should map an active delegated stake account", async () => {
    mockGetStakeAccounts.mockResolvedValue([makeStakeAccount()]);

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result.items).toHaveLength(1);
    const stake = result.items[0];
    expect(stake.uid).toBe(STAKE_PUBKEY.toBase58());
    expect(stake.address).toBe(STAKE_PUBKEY.toBase58());
    expect(stake.delegate).toBe(VOTER_PUBKEY.toBase58());
    expect(stake.state).toBe("active");
    expect(stake.asset).toEqual({ type: "native" });
    expect(stake.amount).toBe(BigInt(5_000_000_000));
    expect(stake.amountDeposited).toBe(BigInt(4_997_717_120));
    expect(stake.details?.rentExemptReserve).toBe("2282880");
    expect(stake.details?.activeStake).toBe(4_997_717_120);
  });

  it("should map a deactivating stake account", async () => {
    mockGetStakeAccounts.mockResolvedValue([
      makeStakeAccount({ state: "deactivating", active: 2_000_000_000, inactive: 2_997_717_120 }),
    ]);

    const result = await getStakes(api, TEST_ADDRESS);

    expect(result.items[0].state).toBe("deactivating");
    expect(result.items[0].details?.inactiveStake).toBe(2_997_717_120);
  });

  it("should propagate errors from getStakeAccounts", async () => {
    mockGetStakeAccounts.mockRejectedValue(new Error("RPC error"));

    await expect(getStakes(api, TEST_ADDRESS)).rejects.toThrow("RPC error");
  });
});

describe("computeUnstakeReserve", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return 0 when there are no stake accounts", async () => {
    const result = await computeUnstakeReserve(api, TEST_ADDRESS, []);
    expect(result).toBe(0);
    expect(mockEstimateTxFee).not.toHaveBeenCalled();
  });

  it("should compute reserve for a single active stake", async () => {
    mockEstimateTxFee.mockImplementation(async (_api: ChainAPI, _addr: string, kind: string) =>
      kind === "stake.undelegate" ? 5000 : 6000,
    );

    const stakeAccounts = [makeStakeAccount({ state: "active" })];
    const result = await computeUnstakeReserve(api, TEST_ADDRESS, stakeAccounts as StakeAccount[]);

    // 1 * withdrawFee + 1 * undelegateFee = 6000 + 5000
    expect(result).toBe(11000);
  });

  it("should compute reserve for mixed activation states", async () => {
    mockEstimateTxFee.mockResolvedValue(5000);

    const stakeAccounts = [
      makeStakeAccount({ state: "active" }),
      makeStakeAccount({ state: "activating" }),
      makeStakeAccount({ state: "deactivating" }),
      makeStakeAccount({ state: "inactive" }),
    ];
    const result = await computeUnstakeReserve(api, TEST_ADDRESS, stakeAccounts as StakeAccount[]);

    // 4 * withdrawFee + 2 * undelegateFee (active + activating)
    // = 4 * 5000 + 2 * 5000 = 30000
    expect(result).toBe(30000);
  });

  it("should compute reserve for only inactive/deactivating stakes", async () => {
    mockEstimateTxFee.mockResolvedValue(5000);

    const stakeAccounts = [
      makeStakeAccount({ state: "inactive" }),
      makeStakeAccount({ state: "deactivating" }),
    ];
    const result = await computeUnstakeReserve(api, TEST_ADDRESS, stakeAccounts as StakeAccount[]);

    // 2 * withdrawFee + 0 * undelegateFee = 10000
    expect(result).toBe(10000);
  });
});

describe("mapStakeAccountsToSolanaStakes", () => {
  const EPOCH = 400;

  it("should map an active delegated stake account", () => {
    const stakeAccounts = [makeStakeAccount()];
    const result = mapStakeAccountsToSolanaStakes(
      stakeAccounts as StakeAccount[],
      TEST_ADDRESS,
      EPOCH,
    );

    expect(result).toHaveLength(1);
    const stake = result[0];
    expect(stake.stakeAccAddr).toBe(STAKE_PUBKEY.toBase58());
    expect(stake.stakeAccBalance).toBe(5_000_000_000);
    expect(stake.rentExemptReserve).toBe(2282880);
    expect(stake.hasStakeAuth).toBe(true);
    expect(stake.hasWithdrawAuth).toBe(true);
    expect(stake.delegation).toEqual({
      stake: 4_997_717_120,
      voteAccAddr: VOTER_PUBKEY.toBase58(),
    });
    expect(stake.activation).toEqual({ state: "active", active: 4_997_717_120, inactive: 0 });
    expect(stake.withdrawable).toBe(0);
    expect(stake.reward).toBeUndefined();
  });

  it("should compute withdrawable for an inactive stake", () => {
    const stakeAccounts = [
      makeStakeAccount({ state: "inactive", active: 0, inactive: 5_000_000_000 }),
    ];
    const result = mapStakeAccountsToSolanaStakes(
      stakeAccounts as StakeAccount[],
      TEST_ADDRESS,
      EPOCH,
    );

    expect(result[0].withdrawable).toBe(5_000_000_000);
  });

  it("should set hasStakeAuth and hasWithdrawAuth to false for different authorities", () => {
    const differentAuth = new PublicKey("EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4");
    const stakeAccount = makeStakeAccount();
    stakeAccount.account!.info!.meta!.authorized!.staker = differentAuth;
    stakeAccount.account!.info!.meta!.authorized!.withdrawer = differentAuth;

    const result = mapStakeAccountsToSolanaStakes(
      [stakeAccount] as StakeAccount[],
      TEST_ADDRESS,
      EPOCH,
    );

    expect(result[0].hasStakeAuth).toBe(false);
    expect(result[0].hasWithdrawAuth).toBe(false);
    expect(result[0].withdrawable).toBe(0);
  });

  it("should set hasWithdrawAuth to false when lockup is in force", () => {
    const stakeAccount = makeStakeAccount();
    stakeAccount.account!.info!.meta!.lockup = {
      unixTimestamp: Math.floor(Date.now() / 1000) + 100000,
      epoch: EPOCH + 100,
      custodian: PublicKey.default,
    };

    const result = mapStakeAccountsToSolanaStakes(
      [stakeAccount] as StakeAccount[],
      TEST_ADDRESS,
      EPOCH,
    );

    expect(result[0].hasWithdrawAuth).toBe(false);
    expect(result[0].withdrawable).toBe(0);
  });

  it("should set delegation to undefined when stake is null", () => {
    const stakeAccount = makeStakeAccount();
    stakeAccount.account!.info!.stake = null as never;

    const result = mapStakeAccountsToSolanaStakes(
      [stakeAccount] as StakeAccount[],
      TEST_ADDRESS,
      EPOCH,
    );

    expect(result[0].delegation).toBeUndefined();
  });

  it("should set delegation.stake to 0 for inactive state", () => {
    const stakeAccounts = [makeStakeAccount({ state: "inactive", active: 0, inactive: 0 })];
    const result = mapStakeAccountsToSolanaStakes(
      stakeAccounts as StakeAccount[],
      TEST_ADDRESS,
      EPOCH,
    );

    expect(result[0].delegation?.stake).toBe(0);
  });
});
