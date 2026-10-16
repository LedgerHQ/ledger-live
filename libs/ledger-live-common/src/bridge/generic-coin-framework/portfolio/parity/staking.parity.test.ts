import type { Balance, Stake } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { callsOf } from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  emptyAccount,
  freezeTime,
  runSyncScenario,
  token,
  useTokens,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));

const OTHER = "someone-else";
const native = { type: "native" } as const;

const CELO_USD = token({
  id: "celo/erc20/cusd",
  parentCurrencyId: "celo",
  contractAddress: "0x765de816845861e75a25fca122bb6898b8b1282a",
  tokenType: "erc20",
});

beforeAll(() => {
  freezeTime();
  useTokens([CELO_USD]);
});

afterAll(() => jest.useRealTimers());

afterEach(() => jest.restoreAllMocks());

/** A stake balance of `address`: the stake's amount, on a native balance of its own. */
const stakeBalance = (stake: Omit<Stake, "asset">): Balance => ({
  value: stake.amount,
  asset: native,
  stake: { asset: native, ...stake },
});

describe("Solana staking", () => {
  const solana = getCryptoCurrencyById("solana");
  const ME = "SoLStaker";
  const stake = (
    uid: string,
    state: Stake["state"],
    actions: Stake["actions"],
    amount: bigint,
  ): Balance =>
    stakeBalance({
      uid,
      address: uid,
      delegate: "Vote111",
      state,
      actions,
      amount,
      amountDeposited: amount - 1n,
      amountRewarded: 1n,
      stateUpdatedAt: new Date("2026-09-01T00:00:00Z"),
      details: {
        activeAmount: amount,
        inactiveAmount: 0n,
        withdrawableAmount: state === "inactive" ? amount : 0n,
        lockedReserve: 2_282_880n,
        canWithdraw: actions.includes("withdraw"),
        validatorName: "Vote 111",
      },
    });
  const balances: Balance[] = [
    { value: 5_000_000n, asset: native },
    stake("stake-activating", "activating", ["undelegate"], 10n),
    stake("stake-active", "active", ["undelegate"], 20n),
    stake("stake-deactivating", "deactivating", [], 30n),
    stake("stake-withdrawable", "withdrawable", ["withdraw"], 40n),
    stake("stake-inactive", "inactive", ["delegate", "withdraw"], 50n),
  ];
  const operations = [
    coinOperation({
      height: 500,
      type: "DELEGATE",
      value: 20n,
      fees: 5_000n,
      senders: [ME],
      recipients: ["stake-active"],
      details: { stake: { address: "stake-active", amount: 20n } },
    }),
  ];
  const validators = [
    {
      id: "Vote111",
      address: "Vote111",
      name: "Vote 111",
      balance: 1_000_000_000n,
      commissionRate: "5",
      apy: 0.07,
    },
    { id: "Vote222", address: "Vote222", name: "Vote 222" },
  ];

  it("builds the same staking resources from the five stake states", async () => {
    const [first] = await runSyncScenario({
      currency: solana,
      family: "solana",
      account: emptyAccount(solana, ME),
      chain: { tip: blockAt(501), balances, operations, validators },
      next: {
        tip: blockAt(520),
        balances: balances.slice(0, 4),
        operations: [
          coinOperation({
            height: 510,
            hash: "solana-unstake",
            type: "UNDELEGATE",
            fees: 5_000n,
            senders: [ME],
          }),
          ...operations,
        ],
        validators,
      },
      pendingHash: "solana-unstake",
    });
    const resources = (first.legacy as { stakingResources?: Record<string, unknown[]> })
      .stakingResources;
    expect(resources?.delegations).toHaveLength(2);
    expect(resources?.unbondings).toHaveLength(3);
    expect(resources?.validators).toHaveLength(2);
    expect(callsOf(first.portfolioModule.getValidators)).toEqual([[]]);
  });
});

describe("Tezos", () => {
  const tezos = getCryptoCurrencyById("tezos");
  const ME = "tz1Mine";
  const balances: Balance[] = [
    { value: 900n, asset: native },
    stakeBalance({
      uid: `${ME}-staked`,
      address: ME,
      delegate: "tz1Baker",
      state: "active",
      actions: ["undelegate"],
      amount: 300n,
    }),
    stakeBalance({
      uid: `${ME}-unstaked`,
      address: ME,
      delegate: "tz1Baker",
      state: "deactivating",
      actions: [],
      amount: 100n,
      details: { cycle: 812n },
    }),
  ];
  const operations = [
    coinOperation({
      height: 70,
      type: "DELEGATE",
      fees: 400n,
      senders: [ME],
      recipients: ["tz1Baker"],
      details: { sequence: 12 },
    }),
  ];

  it("sums the partitions, reports positions and the readiness on both paths", async () => {
    const [first, second] = await runSyncScenario({
      currency: tezos,
      family: "tezos",
      account: emptyAccount(tezos, ME),
      chain: {
        tip: blockAt(71),
        balances,
        operations,
        accountInfo: { type: "tezos", revealed: false },
      },
      next: {
        tip: blockAt(80),
        balances,
        operations: [
          coinOperation({
            height: 75,
            hash: "tezos-reveal",
            type: "REVEAL",
            fees: 300n,
            senders: [ME],
          }),
          ...operations,
        ],
        accountInfo: { type: "tezos", revealed: true },
      },
      pendingHash: "tezos-reveal",
    });
    expect(first.legacy.balance.toFixed()).toBe("1300");
    expect(first.legacy.readiness).toEqual({ ready: false, reason: "unrevealed" });
    expect(second.legacy.readiness).toEqual({ ready: true });
    expect((first.legacy as { stakingPositions?: unknown[] }).stakingPositions).toHaveLength(2);
  });
});

describe("Cosmos", () => {
  const cosmos = getCryptoCurrencyById("cosmos");
  const ME = "cosmos1mine";
  const balances: Balance[] = [
    { value: 1_000_000n, asset: native },
    stakeBalance({
      uid: `${ME}-cosmosvaloper1a`,
      address: ME,
      delegate: "cosmosvaloper1a",
      state: "active",
      actions: ["undelegate", "redelegate", "claim_reward"],
      amount: 500n,
      amountRewarded: 7n,
    }),
    stakeBalance({
      uid: `${ME}-cosmosvaloper1b-unbonding`,
      address: ME,
      delegate: "cosmosvaloper1b",
      state: "deactivating",
      actions: [],
      amount: 200n,
      stateUpdatedAt: new Date("2026-10-20T00:00:00Z"),
    }),
  ];
  const operations = [
    coinOperation({
      height: 900,
      type: "REDELEGATE",
      fees: 2_000n,
      senders: [ME],
      recipients: ["cosmosvaloper1c"],
      details: { memo: "" },
    }),
  ];
  const redelegations = [
    {
      validatorSrcAddress: "cosmosvaloper1a",
      validatorDstAddress: "cosmosvaloper1c",
      amount: "100",
      completionDate: "2026-10-30T00:00:00.000Z",
    },
  ];

  it("reads the redelegations through getAccountInfo on both paths", async () => {
    const [first] = await runSyncScenario({
      currency: cosmos,
      family: "cosmos",
      account: emptyAccount(cosmos, ME),
      chain: {
        tip: blockAt(901),
        balances,
        operations,
        validators: [{ id: "cosmosvaloper1a", address: "cosmosvaloper1a", name: "A" }],
        accountInfo: { type: "cosmos", redelegations },
      },
      next: {
        tip: blockAt(950),
        balances,
        operations: [
          coinOperation({
            height: 940,
            hash: "cosmos-claim",
            type: "REWARD",
            value: 7n,
            fees: 2_000n,
            senders: [ME],
          }),
          ...operations,
        ],
        accountInfo: { type: "cosmos", redelegations: [] },
      },
      pendingHash: "cosmos-claim",
    });
    expect(
      (first.legacy as { stakingResources?: { redelegations: unknown[] } }).stakingResources
        ?.redelegations,
    ).toHaveLength(1);
  });
});

describe("Celo", () => {
  const celo = getCryptoCurrencyById("celo");
  const ME = "0x00000000000000000000000000000000000ce10a";
  const cusd = { type: "erc20", assetReference: CELO_USD.contractAddress, assetOwner: ME };
  const unknownToken = { type: "erc20", assetReference: "0xdeadbeef", assetOwner: ME };
  const balances: Balance[] = [
    { value: 10_000n, locked: 2_000n, asset: native },
    { value: 33n, asset: cusd },
    { value: 1n, asset: unknownToken },
    stakeBalance({
      uid: `${ME}-vote-group1`,
      address: ME,
      delegate: "0xgroup1",
      state: "active",
      actions: ["undelegate"],
      amount: 0n,
      details: { type: "vote", pending: 0n },
    }),
    stakeBalance({
      uid: `${ME}-withdrawal-0`,
      address: ME,
      state: "withdrawable",
      actions: ["withdraw"],
      amount: 0n,
      details: { index: 0 },
    }),
  ];
  const operations = [
    coinOperation({
      height: 40,
      type: "OUT",
      value: 10n,
      fees: 1n,
      senders: [ME],
      recipients: [OTHER],
      details: { sequence: 3 },
    }),
    coinOperation({
      height: 39,
      value: 33n,
      fees: 1n,
      asset: cusd,
      senders: [OTHER],
      recipients: [ME],
      feesPayer: OTHER,
      details: { ledgerOpType: "IN", assetAmount: "33" },
    }),
  ];

  it("keeps the zero-value stakes and filters the balances by the catalog on both paths", async () => {
    const [first] = await runSyncScenario({
      currency: celo,
      family: "celo",
      account: emptyAccount(celo, ME),
      chain: { tip: blockAt(41), balances, operations },
      next: {
        tip: blockAt(50),
        balances,
        operations: [
          coinOperation({
            height: 45,
            hash: "celo-vote",
            type: "VOTE",
            fees: 1n,
            senders: [ME],
            details: { sequence: 9 },
          }),
          ...operations,
        ],
      },
      pendingHash: "celo-vote",
    });
    expect((first.legacy as { stakingPositions?: unknown[] }).stakingPositions).toHaveLength(2);
    expect(first.legacy.subAccounts?.map(({ token: { id } }) => id)).toEqual([CELO_USD.id]);
    // The family's catalog filter reaches the coin module on both paths.
    expect(first.portfolioModule.getBalance.mock.calls[0][2]).toEqual({
      includeAssets: expect.any(Function),
    });
    expect(first.legacyModule.getBalance.mock.calls[0][2]).toEqual({
      includeAssets: expect.any(Function),
    });
  });
});
