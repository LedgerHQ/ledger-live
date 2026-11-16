import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type { StakingDelegation, StakingUnbonding } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  exitTransactionPatch,
  toBigNumber,
  toStakePositionCandidates,
  toStakePositionSnapshot,
} from "./solanaStakePosition";

const SOL = (amount: number) => new BigNumber(amount).times(1e9);

const delegation = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: "stake-active",
  validatorAddress: "vote-a",
  amount: SOL(2),
  withdrawableAmount: new BigNumber(0),
  canStake: true,
  canWithdraw: true,
  pendingRewards: new BigNumber(0),
  status: "bonded",
  ...overrides,
});

const unbonding = (overrides: Partial<StakingUnbonding> = {}): StakingUnbonding => ({
  positionId: "stake-inactive",
  validatorAddress: "vote-b",
  amount: SOL(1),
  withdrawableAmount: SOL(1.5),
  canStake: true,
  canWithdraw: true,
  completionDate: new Date(0),
  status: "withdrawable",
  ...overrides,
});

const accountWith = (delegations: StakingDelegation[], unbondings: StakingUnbonding[] = []) =>
  ({
    ...genAccount("solana-stake-position-mapping", {
      currency: getCryptoCurrencyById("solana"),
      operationsSize: 0,
    }),
    stakingResources: {
      delegations,
      redelegations: [],
      unbondings,
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
    },
  }) as SolanaAccount;

describe("toStakePositionSnapshot", () => {
  it("should map an active position to base units and its authorities", () => {
    expect(toStakePositionSnapshot(delegation({ withdrawableAmount: SOL(0.25) }))).toEqual({
      state: "active",
      amount: 2_000_000_000n,
      withdrawableAmount: 250_000_000n,
      canStake: true,
      canWithdraw: true,
    });
  });

  it("should map a withdrawable unbonding to an inactive position", () => {
    expect(toStakePositionSnapshot(unbonding()).state).toBe("inactive");
  });

  it("should treat a missing withdrawable amount as zero and missing authorities as absent", () => {
    const snapshot = toStakePositionSnapshot(
      delegation({ withdrawableAmount: undefined, canStake: undefined, canWithdraw: undefined }),
    );

    expect(snapshot).toMatchObject({ withdrawableAmount: 0n, canStake: false, canWithdraw: false });
  });

  it("should keep amounts larger than a JavaScript number holds", () => {
    expect(
      toStakePositionSnapshot(delegation({ amount: new BigNumber("20393024000000000") })),
    ).toMatchObject({ amount: 20_393_024_000_000_000n });
  });
});

describe("toBigNumber", () => {
  it("should convert base units back without losing precision", () => {
    expect(toBigNumber(20_393_024_000_000_001n).toFixed()).toBe("20393024000000001");
  });
});

describe("toStakePositionCandidates", () => {
  it("should list every position of the account with its validator", () => {
    const account = accountWith([delegation()], [unbonding({ positionId: undefined })]);

    expect(toStakePositionCandidates(account)).toEqual([
      { positionId: "stake-active", validatorAddress: "vote-a" },
      { positionId: "", validatorAddress: "vote-b" },
    ]);
  });
});

describe("exitTransactionPatch", () => {
  it("should deactivate the stake account of the position with its whole amount", () => {
    expect(exitTransactionPatch(delegation(), "deactivate")).toEqual({
      mode: "undelegate",
      recipient: "stake-active",
      amount: SOL(2),
    });
  });

  it("should withdraw the whole withdrawable amount of the stake account", () => {
    expect(exitTransactionPatch(unbonding(), "withdraw")).toEqual({
      mode: "unstake",
      recipient: "stake-inactive",
      amount: SOL(1.5),
    });
  });

  it("should refuse a position without its stake account address", () => {
    expect(() => exitTransactionPatch(delegation({ positionId: undefined }), "deactivate")).toThrow(
      "solana: staking position is missing its stake account address",
    );
  });
});
