import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import { CHAIN_ID } from "@ledgerhq/coin-evm/config";
import { getNodeApi } from "@ledgerhq/coin-evm/network";
import { fetchRedelegations, STAKING_CONTRACTS } from "@ledgerhq/coin-evm/staking";
import type { Balance, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { callsOf } from "./fakeCoinModule";
import {
  blockAt,
  coinOperation,
  emptyAccount,
  freezeTime,
  FROZEN_NOW,
  fromScratch,
  normaliseAccount,
  runSyncScenario,
  syncBoth,
} from "./harness";

jest.mock("../../api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("@ledgerhq/coin-evm/staking", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/staking"),
  fetchRedelegations: jest.fn(),
}));
jest.mock("@ledgerhq/coin-evm/network", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/network"),
  getNodeApi: jest.fn(),
}));

const sei = getCryptoCurrencyById("sei_evm");
const zeroGravity = getCryptoCurrencyById("zero_gravity");
const ME = "0x1111111111111111111111111111111111111111";
const native = { type: "native" } as const;
// coin-evm keys its staking registries on the chain id the coin config carries.
const externalNode = {
  chainId: CHAIN_ID.SEI_EVM,
  node: { type: "external", uri: "https://sei.node.test" },
  explorer: { type: "etherscan", uri: "https://sei.explorer.test" },
};

const precompile = STAKING_CONTRACTS[CHAIN_ID.SEI_EVM]?.apiConfig?.precompileAddress;
const seiAddress = new ethers.Interface([precompile?.abi ?? ""]);
/** The address precompile's answer: the Cosmos address linked to the EVM one, or a revert. */
const linkedTo = (cosmosAddress: string | undefined) => (params: unknown) => {
  const { to } = params as { to: string };
  if (to !== precompile?.address) throw new Error(`unexpected call to ${to}`);
  if (cosmosAddress === undefined) throw new Error("execution reverted");
  return seiAddress.encodeFunctionResult("getSeiAddr", [cosmosAddress]);
};

const redelegatePayload = new ethers.Interface([
  "function redelegate(string srcAddress, string dstAddress, uint256 amount)",
]).encodeFunctionData("redelegate", ["seivaloper1src", "seivaloper1dst", 5_000n]);

const stake = (fields: Partial<Stake> & Pick<Stake, "uid" | "state" | "amount">): Balance => ({
  value: fields.amount,
  asset: native,
  stake: { address: ME, actions: [], asset: native, ...fields },
});

const balances: Balance[] = [
  { value: 10n ** 18n, asset: native },
  stake({
    uid: `${ME}-seivaloper1src`,
    delegate: "seivaloper1src",
    state: "active",
    amount: 4n * 10n ** 17n,
    amountRewarded: 10n ** 15n,
    details: { validatorName: "Source", shares: 400_000_000_000_000_000_000n },
  }),
  stake({
    uid: `${ME}-seivaloper1dst-unbonding`,
    delegate: "seivaloper1dst",
    state: "deactivating",
    amount: 10n ** 17n,
    stateUpdatedAt: new Date("2026-10-25T00:00:00Z"),
  }),
];

const operations = [
  coinOperation({
    height: 1_000,
    type: "DELEGATE",
    value: 4n * 10n ** 17n,
    fees: 21_000n,
    senders: [ME],
    recipients: ["0x0000000000000000000000000000000000001005"],
    details: { sequence: 3 },
  }),
];

const validators = [
  { id: "seivaloper1src", address: "seivaloper1src", name: "Source", balance: 10n ** 24n },
  { id: "seivaloper1dst", address: "seivaloper1dst", name: "Destination", commissionRate: "0.05" },
];

/** A REDELEGATE the former EVM bridge stored, its calldata cached in `extra.contractPayload`. */
const storedRedelegation = (account: Account): Operation => ({
  id: `${account.id}-cached-redelegate-REDELEGATE`,
  hash: "cached-redelegate",
  type: "REDELEGATE",
  value: new BigNumber(0),
  fee: new BigNumber(21_000),
  senders: [ME],
  recipients: ["0x0000000000000000000000000000000000001005"],
  blockHeight: 1_001,
  blockHash: "block-1001",
  accountId: account.id,
  date: blockAt(1_001).time,
  extra: { contractPayload: redelegatePayload },
});

const withStoredRedelegation = (account: Account): Account => ({
  ...account,
  operations: [storedRedelegation(account), ...account.operations],
});

const chain = (cosmosAddress: string | undefined) => ({
  tip: blockAt(1_002),
  balances,
  operations,
  validators,
  call: linkedTo(cosmosAddress),
});

beforeAll(freezeTime);

afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.mocked(fetchRedelegations).mockResolvedValue([]);
});

afterEach(() => jest.restoreAllMocks());

describe("EVM staking parity", () => {
  it("syncs a Sei account on both paths: delegations, shares, readiness, cached redelegations", async () => {
    const [first, second] = await runSyncScenario({
      currency: sei,
      family: "evm",
      coinConfig: externalNode,
      account: emptyAccount(sei, ME),
      chain: chain("sei1mine"),
      next: {
        ...chain(undefined),
        tip: blockAt(1_010),
        operations: [
          coinOperation({
            height: 1_005,
            hash: "evm-pending",
            type: "OUT",
            value: 1n,
            fees: 21_000n,
            senders: [ME],
            recipients: ["0x2222222222222222222222222222222222222222"],
            details: { sequence: 9 },
          }),
          ...operations,
        ],
      },
      pendingHash: "evm-pending",
      between: withStoredRedelegation,
    });
    expect(first.legacy.readiness).toEqual({ ready: true });
    expect(second.legacy.readiness).toEqual({ ready: false, reason: "activationRequired" });
    // The precompile is asked the same on both paths.
    expect(callsOf(first.portfolioModule.call)).toEqual(callsOf(first.legacyModule.call));
    const resources = (second.legacy as { stakingResources?: Record<string, any> })
      .stakingResources;
    expect(resources?.delegations[0].shares).toEqual(new BigNumber("4e20"));
    // Decoded offline from the cached calldata, on both paths.
    expect(resources?.redelegations).toEqual([
      expect.objectContaining({
        validatorSrcAddress: "seivaloper1src",
        validatorDstAddress: "seivaloper1dst",
      }),
    ]);
  });

  it("checks no association without an external node, on both paths", async () => {
    const step = await syncBoth(
      {
        currency: sei,
        family: "evm",
        coinConfig: { node: { type: "ledger", explorerId: "sei" } },
        chain: chain(undefined),
      },
      fromScratch(emptyAccount(sei, ME)),
    );
    expect(normaliseAccount(step.portfolio)).toEqual(normaliseAccount(step.legacy));
    expect(step.legacy.readiness).toEqual({ ready: true });
    expect(step.legacyModule.call).not.toHaveBeenCalled();
    expect(step.portfolioModule.call).not.toHaveBeenCalled();
  });

  it("reads the REST redelegations on the legacy path only (G2)", async () => {
    const rest = {
      validatorSrcAddress: "seivaloper1a",
      validatorDstAddress: "seivaloper1b",
      amount: new BigNumber(7),
      completionDate: new Date("2026-10-30T00:00:00Z"),
    };
    jest.mocked(fetchRedelegations).mockResolvedValue([rest] as never);
    const step = await syncBoth(
      { currency: sei, family: "evm", coinConfig: externalNode, chain: chain("sei1mine") },
      fromScratch(emptyAccount(sei, ME)),
    );
    const legacy = step.legacy as Account & { stakingResources: { redelegations: unknown[] } };
    expect(legacy.stakingResources.redelegations).toEqual([rest]);
    // Everything else is equal: the portfolio path has no REST redelegation until coin-evm reports
    // it in its account metadata.
    expect(normaliseAccount(step.portfolio)).toEqual(
      normaliseAccount({
        ...legacy,
        stakingResources: { ...legacy.stakingResources, redelegations: [] },
      } as Account),
    );
  });

  it("syncs a 0G account on both paths, its delegation shares a bigint", async () => {
    const validator = "0x3333333333333333333333333333333333333333";
    const zgBalances: Balance[] = [
      { value: 5n * 10n ** 18n, asset: native },
      stake({
        uid: `${ME}-${validator}`,
        delegate: validator,
        state: "active",
        amount: 10n ** 18n,
        details: { shares: 987_654_321_000_000_000_000n },
      }),
    ];
    await runSyncScenario({
      currency: zeroGravity,
      family: "evm",
      coinConfig: {
        chainId: CHAIN_ID.ZERO_GRAVITY,
        explorer: { type: "etherscan", uri: "https://0g.test" },
      },
      account: emptyAccount(zeroGravity, ME),
      chain: { tip: blockAt(200), balances: zgBalances, operations: [], validators },
      next: {
        tip: blockAt(210),
        balances: zgBalances,
        operations: [
          coinOperation({
            height: 205,
            hash: "zg-pending",
            type: "DELEGATE",
            value: 10n ** 18n,
            fees: 21_000n,
            senders: [ME],
            recipients: [validator],
            details: { sequence: 9 },
          }),
        ],
        validators,
      },
      pendingHash: "zg-pending",
    });
  });
});

describe("EVM pending refresh", () => {
  const ethereum = getCryptoCurrencyById("ethereum");
  const noExplorer = {
    node: { type: "external", uri: "https://node.test" },
    explorer: { type: "none" },
  };

  it("refreshes a mined pending operation on the legacy path only (G1)", async () => {
    jest.mocked(getNodeApi).mockReturnValue({
      getTransaction: jest.fn(async () => ({
        hash: "mined-pending",
        blockHeight: 60,
        blockHash: "block-60",
        gasPrice: "10",
        gasUsed: "21000",
        value: "5",
        nonce: 9,
      })),
      getBlockByHeight: jest.fn(async () => ({
        height: 60,
        hash: "block-60",
        timestamp: blockAt(60).time.getTime(),
      })),
    } as never);
    const account = emptyAccount(ethereum, ME);
    const ethBalances: Balance[] = [{ value: 10n ** 18n, asset: native }];
    const first = await syncBoth(
      {
        currency: ethereum,
        family: "evm",
        coinConfig: noExplorer,
        chain: { tip: blockAt(50), balances: ethBalances, operations: [] },
      },
      fromScratch(account),
    );
    const pending = (held: Account): Account => ({
      ...held,
      pendingOperations: [
        {
          id: `${held.id}-mined-pending-OUT`,
          hash: "mined-pending",
          type: "OUT",
          value: new BigNumber(210_005),
          fee: new BigNumber(210_000),
          senders: [ME],
          recipients: [ME],
          blockHeight: null,
          blockHash: null,
          accountId: held.id,
          // Within the retention window of a pending operation.
          date: new Date(FROZEN_NOW.getTime() - 60_000),
          transactionSequenceNumber: new BigNumber(9),
          extra: {},
        },
      ],
    });
    const step = await syncBoth(
      {
        currency: ethereum,
        family: "evm",
        coinConfig: noExplorer,
        chain: { tip: blockAt(70), balances: ethBalances, operations: [] },
      },
      { legacy: pending(first.legacy), portfolio: pending(first.portfolio) },
    );
    expect(step.legacy.operations.map(({ hash }) => hash)).toEqual(["mined-pending"]);
    // Not refreshed through the portfolio until coin-evm looks transactions up: it stays pending.
    expect(step.portfolio.operations).toEqual([]);
    expect(step.portfolio.pendingOperations.map(({ hash }) => hash)).toEqual(["mined-pending"]);
  });
});
