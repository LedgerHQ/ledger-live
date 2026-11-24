import type { CosmosCoinConfig } from "@ledgerhq/coin-cosmos/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { CosmosTx } from "@ledgerhq/coin-cosmos/types/index";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import { fromAccountRaw, toAccountRaw } from "../../account";
import { getAccountBridge } from "../../bridge";
import { getCurrencyConfiguration } from "../../config";
import { liveConfig } from "../../config/sharedConfig";
import { fromTransactionRaw, toTransactionRaw } from "../../transaction";
import { DEVICE_CHAINS, type DeviceChainFixture } from "./fixtures/deviceApdus";
import { COSMOS_V1_ACCOUNT_RAW } from "./fixtures/persistedV1Account";
import { PERSISTED_V2_ACCOUNTS } from "./fixtures/persistedV2Accounts";
import { scanRecordedDevice } from "./fixtures/recordedDeviceScan";
import { VALIDATORS } from "./fixtures/validators";

const mockUsedAddresses = new Set([
  ...DEVICE_CHAINS.map(chain => chain.accounts[0].address),
  PERSISTED_V2_ACCOUNTS.osmo.freshAddress,
]);
const mockTransactions: CosmosTx[] = [];
const mockLiquidBalance = new BigNumber("100000000000000000000");
const mockDelegatedBalance = new BigNumber(1_000_000);
const mockUnbondingBalance = new BigNumber(300_000);
const mockSimulatedGas = new BigNumber(87_654);
const mockDelegatedValidators: Record<string, string> = Object.fromEntries(
  Object.entries(VALIDATORS).map(([currencyId, { validator }]) => [currencyId, validator]),
);

jest.mock("@ledgerhq/coin-cosmos/network/Cosmos", () => ({
  CosmosAPI: class {
    private readonly currencyId: string;
    constructor(currencyId: string) {
      this.currencyId = currencyId;
    }
    getAllBalances = async (address: string) =>
      mockUsedAddresses.has(address) ? mockLiquidBalance : new BigNumber(0);
    getAccount = async () => ({ accountNumber: 7, sequence: 3, pubKeyType: "", pubKey: "" });
    simulate = async () => mockSimulatedGas;
    getLatestBlockInfo = async () => ({ height: 21000000, hash: "hash", time: new Date(0) });
    getTransactionsPage = async () => ({ streams: [{ txs: mockTransactions, hasMore: false }] });
    getStakingPositions = async (address: string) => ({
      delegations: Object.entries(mockDelegatedValidators)
        .filter(([currencyId]) => currencyId === this.currencyId && mockUsedAddresses.has(address))
        .map(([, validatorAddress]) => ({
          validatorAddress,
          amount: mockDelegatedBalance,
          pendingRewards: new BigNumber(1000),
          status: "bonded",
        })),
      unbondings: [
        {
          validatorAddress: "unbondingvalidator",
          amount: mockUnbondingBalance,
          completionDate: new Date("2099-01-01T00:00:00Z"),
        },
      ].filter(() => mockUsedAddresses.has(address)),
    });
    getRedelegationsWithQueued = async () => [];
    getValidators = async () => [];
    getDelegations = async () => [];
    getUnbondings = async () => [];
  },
}));

const [cosmosChain] = DEVICE_CHAINS;

const COMPOUND_OUTCOMES: Record<string, string> = {
  babylon: "claimRewardCompound is not supported on babylon",
};

const EXPECTED_GAS_AMPLIFIER = 1.3;

const expectedGasLimit = (): BigNumber =>
  mockSimulatedGas.times(EXPECTED_GAS_AMPLIFIER).integerValue(BigNumber.ROUND_CEIL);

const expectedFees = (currencyId: string): BigNumber =>
  expectedGasLimit()
    .times(Number(getCurrencyConfiguration<CosmosCoinConfig>(currencyId).minGasPrice))
    .integerValue(BigNumber.ROUND_CEIL);

const FIRST_BLOCK_TIME_MS = Date.parse("2026-05-01T00:00:00Z");
const BLOCK_INTERVAL_MS = 6_000;

const timestampOf = (height: number): string =>
  new Date(FIRST_BLOCK_TIME_MS + height * BLOCK_INTERVAL_MS).toISOString();

const sendTx = (
  txhash: string,
  height: number,
  amount: string,
  timestamp = timestampOf(height),
): CosmosTx => ({
  code: 0,
  codespace: "",
  data: "",
  events: [],
  gas_used: "100000",
  gas_wanted: "120000",
  height: String(height),
  info: "",
  logs: [],
  raw_log: "",
  timestamp,
  tx: {
    "@type": "/cosmos.tx.v1beta1.Tx",
    body: {
      messages: [
        {
          "@type": "/cosmos.bank.v1beta1.MsgSend",
          from_address: cosmosChain.accounts[0].address,
          to_address: cosmosChain.accounts[1].address,
          amount: [{ denom: "uatom", amount }],
        },
      ],
      memo: "",
    },
    auth_info: {
      signer_infos: [{ sequence: "1" }],
      fee: { amount: [{ denom: "uatom", amount: "2500" }] },
    },
    signatures: [],
  },
  txhash,
});

const pendingFrom = (
  template: Account["operations"][number],
  hash: string,
  sequence = 99,
  date = new Date(),
) => ({
  ...template,
  id: `${template.accountId}-${hash}-OUT`,
  hash,
  transactionSequenceNumber: new BigNumber(sequence),
  date,
});

const bridgeSyncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

const syncAccount = (
  bridge: Awaited<ReturnType<typeof getAccountBridge>>,
  account: Account,
): Promise<Account> =>
  firstValueFrom(
    bridge.sync(account, bridgeSyncConfig).pipe(reduce((acc, update) => update(acc), account)),
  );

const accountOf = async (chain: DeviceChainFixture): Promise<Account> => {
  const [account] = await scanRecordedDevice(chain);
  return account;
};

beforeAll(() => {
  LiveConfig.setConfig(liveConfig);
});

describe.each(DEVICE_CHAINS)("cosmos generic account bridge of $currencyId", chain => {
  let account: Account;
  let bridge: Awaited<ReturnType<typeof getAccountBridge>>;

  beforeAll(async () => {
    account = await accountOf(chain);
    bridge = await getAccountBridge(account);
  });

  const selfSend = () => ({
    ...bridge.createTransaction(account),
    amount: new BigNumber(1000),
    recipient: account.freshAddress,
  });

  describe("createTransaction", () => {
    it("creates an empty transaction with an empty recipient and a zero amount", () => {
      expect(bridge.createTransaction(account)).toMatchObject({
        family: "cosmos",
        amount: new BigNumber(0),
        recipient: "",
      });
    });

    it("creates the same empty transaction on every call", () => {
      expect(bridge.createTransaction(account)).toEqual(bridge.createTransaction(account));
    });

    it("serializes an empty transaction to its raw form and back", async () => {
      const transaction = bridge.createTransaction(account);

      expect(await fromTransactionRaw(await toTransactionRaw(transaction))).toEqual(transaction);
    });

    it("serializes a transaction with an amount and a recipient to its raw form and back", async () => {
      const transaction = selfSend();

      expect(await fromTransactionRaw(await toTransactionRaw(transaction))).toEqual(transaction);
    });
  });

  describe("updateTransaction", () => {
    it("returns the same reference when the same patch is applied twice to an empty transaction", () => {
      const once = bridge.updateTransaction(bridge.createTransaction(account), {});

      expect(bridge.updateTransaction(once, {})).toBe(once);
    });

    it("returns the same reference when the same patch is applied twice to a self transaction", () => {
      const patch = { amount: new BigNumber(1000), recipient: account.freshAddress };
      const once = bridge.updateTransaction(bridge.createTransaction(account), patch);

      expect(bridge.updateTransaction(once, patch)).toBe(once);
    });
  });

  describe("prepareTransaction", () => {
    it("converges on an empty transaction", async () => {
      const once = await bridge.prepareTransaction(account, bridge.createTransaction(account));
      const twice = await bridge.prepareTransaction(account, once);

      expect(twice).toStrictEqual(once);
    });

    it("converges on a self transaction", async () => {
      const once = await bridge.prepareTransaction(account, selfSend());
      const twice = await bridge.prepareTransaction(account, once);

      expect(twice).toStrictEqual(once);
    });

    it("yields the same result when run in parallel", async () => {
      const stable = await bridge.prepareTransaction(account, selfSend());
      const first = await bridge.prepareTransaction(account, stable);

      const concurrent = await Promise.all(
        [1, 2, 3].map(() => bridge.prepareTransaction(account, stable)),
      );

      expect(concurrent).toEqual([first, first, first]);
    });
  });

  describe("getTransactionStatus", () => {
    it("reports the recipient, the amounts and the fees of an empty transaction", async () => {
      const status = await bridge.getTransactionStatus(account, bridge.createTransaction(account));

      expect({
        errorFields: Object.keys(status.errors).includes("recipient"),
        totalSpent: BigNumber.isBigNumber(status.totalSpent),
        estimatedFees: BigNumber.isBigNumber(status.estimatedFees),
        amount: status.amount,
      }).toEqual({
        errorFields: true,
        totalSpent: true,
        estimatedFees: true,
        amount: new BigNumber(0),
      });
    });

    it("resolves a status for an empty prepared transaction", async () => {
      const prepared = await bridge.prepareTransaction(account, bridge.createTransaction(account));

      await expect(bridge.getTransactionStatus(account, prepared)).resolves.toMatchObject({
        amount: new BigNumber(0),
      });
    });

    it("requires a recipient by default", async () => {
      const status = await bridge.getTransactionStatus(account, bridge.createTransaction(account));

      expect(status.errors.recipient).toMatchObject({ name: "RecipientRequired" });
    });

    it("rejects an invalid recipient", async () => {
      const status = await bridge.getTransactionStatus(account, {
        ...bridge.createTransaction(account),
        recipient: "invalidADDRESS",
      });

      expect(status.errors.recipient).toMatchObject({ name: "InvalidAddress" });
    });

    it("requires an amount by default", async () => {
      const prepared = await bridge.prepareTransaction(account, bridge.createTransaction(account));

      const status = await bridge.getTransactionStatus(account, prepared);

      expect(status.errors.amount).toMatchObject({ name: "AmountRequired" });
    });
  });

  describe("send to another account", () => {
    const sendAmount = new BigNumber("10000000000000000000");

    it("prepares and validates a send to another valid address of the chain", async () => {
      const prepared = await bridge.prepareTransaction(account, {
        ...bridge.createTransaction(account),
        amount: sendAmount,
        recipient: chain.accounts[1].address,
      });

      const status = await bridge.getTransactionStatus(account, prepared);

      expect({
        errors: Object.keys(status.errors),
        warnings: Object.keys(status.warnings),
        amount: status.amount,
        estimatedFees: status.estimatedFees,
        totalSpent: status.totalSpent,
        feesAreCharged: status.estimatedFees.isGreaterThan(0),
        gasLimit: prepared.gasLimit,
      }).toEqual({
        errors: [],
        warnings: [],
        amount: sendAmount,
        estimatedFees: expectedFees(chain.currencyId),
        totalSpent: sendAmount.plus(expectedFees(chain.currencyId)),
        feesAreCharged: true,
        gasLimit: expectedGasLimit(),
      });
    });
  });

  describe("estimateMaxSpendable", () => {
    it("estimates the amount of a send max, below the spendable balance by the fees", async () => {
      const prepared = await bridge.prepareTransaction(account, {
        ...bridge.createTransaction(account),
        useAllAmount: true,
        recipient: chain.accounts[1].address,
      });
      const status = await bridge.getTransactionStatus(account, prepared);

      const estimation = await bridge.estimateMaxSpendable({ account });

      expect({
        estimation,
        belowSpendable: estimation.isLessThan(account.spendableBalance),
        positive: estimation.isGreaterThan(0),
      }).toEqual({ estimation: status.amount, belowSpendable: true, positive: true });
    });
  });
});

describe.each(DEVICE_CHAINS)(
  "cosmos generic account bridge staking and send scenarios of $currencyId",
  chain => {
    const { validator, otherValidator } = VALIDATORS[chain.currencyId];
    const otherAddress = chain.accounts[1].address;

    let account: Account;
    let bridge: Awaited<ReturnType<typeof getAccountBridge>>;

    beforeAll(async () => {
      account = await accountOf(chain);
      bridge = await getAccountBridge(account);
    });

    const statusOf = async (patch: Record<string, unknown>) => {
      const prepared = await bridge.prepareTransaction(account, {
        ...bridge.createTransaction(account),
        ...patch,
      });
      const status = await bridge.getTransactionStatus(account, prepared);
      return {
        prepared,
        status,
        errors: Object.fromEntries(Object.entries(status.errors).map(([k, e]) => [k, e.name])),
        warnings: Object.fromEntries(Object.entries(status.warnings).map(([k, e]) => [k, e.name])),
      };
    };

    it("refuses to send to the account itself", async () => {
      const { errors } = await statusOf({
        amount: new BigNumber(100),
        recipient: account.freshAddress,
      });

      expect(errors).toEqual({ recipient: "InvalidAddressBecauseDestinationIsAlsoSource" });
    });

    it("refuses to send to an invalid address", async () => {
      const { errors } = await statusOf({
        amount: new BigNumber(100),
        recipient: "dsadasdasdasdas",
      });

      expect(errors).toEqual({ recipient: "InvalidAddress" });
    });

    it("spends the whole liquid balance on a send max and recommends undelegating", async () => {
      const { errors, warnings, status } = await statusOf({
        amount: new BigNumber(0),
        recipient: otherAddress,
        useAllAmount: true,
      });

      expect({ errors, warnings, totalSpent: status.totalSpent }).toEqual({
        errors: {},
        warnings: { amount: "RecommendUndelegation" },
        totalSpent: mockLiquidBalance,
      });
    });

    it("keeps the memo of a send max", async () => {
      const { prepared, errors, status } = await statusOf({
        amount: new BigNumber(0),
        recipient: otherAddress,
        useAllAmount: true,
        memoType: "text",
        memoValue: "test",
      });

      expect({ memo: prepared.memoValue, errors, totalSpent: status.totalSpent }).toEqual({
        memo: "test",
        errors: {},
        totalSpent: mockLiquidBalance,
      });
    });

    it("refuses an amount beyond the balance", async () => {
      const { errors } = await statusOf({
        amount: mockLiquidBalance.plus(1),
        recipient: otherAddress,
      });

      expect(errors).toEqual({ amount: "NotEnoughBalance" });
    });

    it("accepts a redelegation from the delegated validator and gives it the Ledger Live memo", async () => {
      const { prepared, errors } = await statusOf({
        mode: "redelegate",
        amount: new BigNumber(100),
        valAddress: validator,
        dstValAddress: otherValidator,
      });

      expect({ memo: prepared.memoValue, errors }).toEqual({ memo: "Ledger Live", errors: {} });
    });

    it("refuses to redelegate more than the delegated amount", async () => {
      const { errors } = await statusOf({
        mode: "redelegate",
        amount: mockDelegatedBalance.plus(1),
        valAddress: validator,
        dstValAddress: otherValidator,
      });

      expect(errors).toEqual({ redelegation: "NotEnoughDelegationBalance" });
    });

    it("requires an amount to redelegate", async () => {
      const { errors } = await statusOf({
        mode: "redelegate",
        valAddress: validator,
        dstValAddress: otherValidator,
      });

      expect(errors).toEqual({ amount: "AmountRequired" });
    });

    it("refuses to redelegate to the source validator", async () => {
      const { errors } = await statusOf({
        mode: "redelegate",
        amount: new BigNumber(100),
        valAddress: validator,
        dstValAddress: validator,
      });

      expect(errors).toEqual({ dstValAddress: "InvalidAddressBecauseDestinationIsAlsoSource" });
    });

    it("accepts an undelegation within the delegated amount", async () => {
      const { errors } = await statusOf({
        mode: "undelegate",
        amount: new BigNumber(100),
        valAddress: validator,
      });

      expect(errors).toEqual({});
    });

    it("refuses an undelegation beyond the delegated amount", async () => {
      const { errors } = await statusOf({
        mode: "undelegate",
        amount: mockDelegatedBalance.plus(1),
        valAddress: validator,
      });

      expect(errors).toEqual({ unbonding: "NotEnoughDelegationBalance" });
    });

    it("requires an amount to undelegate", async () => {
      const { errors } = await statusOf({ mode: "undelegate", valAddress: validator });

      expect(errors).toEqual({ amount: "AmountRequired" });
    });

    it("requires an amount to delegate", async () => {
      const { errors } = await statusOf({ mode: "delegate", valAddress: validator });

      expect(errors).toEqual({ amount: "AmountRequired" });
    });

    it("accepts a delegation of an amount", async () => {
      const { errors } = await statusOf({
        mode: "delegate",
        amount: new BigNumber(1000),
        valAddress: validator,
      });

      expect(errors).toEqual({});
    });

    it("refuses to delegate to an address that is not a validator", async () => {
      const { errors } = await statusOf({
        mode: "delegate",
        amount: new BigNumber(1000),
        valAddress: otherAddress,
      });

      expect(errors).toEqual({ valAddress: "InvalidAddress" });
    });

    it("accepts a reward claim on a validator", async () => {
      const { errors } = await statusOf({ mode: "claimReward", valAddress: validator });

      expect(errors).toEqual({});
    });

    it("refuses a reward claim on an address that is not a validator", async () => {
      const { errors } = await statusOf({ mode: "claimReward", valAddress: otherAddress });

      expect(errors).toEqual({ valAddress: "InvalidAddress" });
    });

    it("settles a reward compound the way the chain supports it", async () => {
      const outcome = await statusOf({
        mode: "compoundReward",
        amount: new BigNumber(100),
        valAddress: validator,
      }).then(
        ({ errors }) => errors,
        (error: Error) => error.message,
      );

      expect(outcome).toEqual(COMPOUND_OUTCOMES[chain.currencyId] ?? {});
    });

    it("syncs the liquid, delegated and unbonding balances of the account", async () => {
      const synced = await syncAccount(bridge, account);

      expect(synced).toMatchObject({
        balance: mockLiquidBalance.plus(mockDelegatedBalance).plus(mockUnbondingBalance),
        spendableBalance: mockLiquidBalance,
        stakingResources: {
          delegatedBalance: mockDelegatedBalance,
          unbondingBalance: mockUnbondingBalance,
        },
      });
    });
  },
);

describe("cosmos generic account bridge incremental sync", () => {
  const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

  let scanned: Account;
  let bridge: Awaited<ReturnType<typeof getAccountBridge>>;

  const sync = (account: Account): Promise<Account> =>
    firstValueFrom(
      bridge.sync(account, syncConfig).pipe(reduce((acc, update) => update(acc), account)),
    );

  const syncWith = async (txs: CosmosTx[], initial: Account): Promise<Account> => {
    mockTransactions.splice(0, mockTransactions.length, ...txs);
    return sync(initial);
  };

  const stored = [
    sendTx("HASH400", 400, "400"),
    sendTx("HASH300", 300, "300"),
    sendTx("HASH200", 200, "200"),
    sendTx("HASH100", 100, "100"),
  ];

  beforeAll(async () => {
    scanned = await accountOf(cosmosChain);
    bridge = await getAccountBridge(scanned);
  });

  it("stores the history of the first sync, newest first, from a known block height", async () => {
    const first = await syncWith(stored, scanned);

    expect({
      hashes: first.operations.map(op => op.hash),
      knownHeight: first.blockHeight > 0,
    }).toEqual({
      hashes: ["HASH400", "HASH300", "HASH200", "HASH100"],
      knownHeight: true,
    });
  });

  it("adds the new operations in front of the stored ones and keeps those as they were", async () => {
    const first = await syncWith(stored, scanned);

    const second = await syncWith([sendTx("HASH500", 500, "500"), ...stored], first);

    expect({
      hashes: second.operations.map(op => op.hash),
      kept: second.operations.slice(1).map((op, index) => op === first.operations[index]),
    }).toEqual({
      hashes: ["HASH500", "HASH400", "HASH300", "HASH200", "HASH100"],
      kept: first.operations.map(() => true),
    });
  });

  it("lists once an operation the indexer reports again at a new height", async () => {
    const first = await syncWith(stored, scanned);

    const second = await syncWith([sendTx("HASH100", 600, "100"), ...stored.slice(0, 3)], first);

    expect(second.operations.map(op => [op.hash, op.blockHeight])).toEqual([
      ["HASH100", 600],
      ["HASH400", 400],
      ["HASH300", 300],
      ["HASH200", 200],
    ]);
  });

  it("orders the operations by date when the date and the height disagree", async () => {
    const first = await syncWith(stored, scanned);

    const second = await syncWith(
      [sendTx("HASH450", 450, "450", timestampOf(150)), ...stored],
      first,
    );

    expect(second.operations.map(op => op.hash)).toEqual([
      "HASH400",
      "HASH300",
      "HASH200",
      "HASH450",
      "HASH100",
    ]);
  });

  it("lists once a transaction the indexer returns several times", async () => {
    const first = await syncWith([...stored, ...stored], scanned);

    expect(first.operations.map(op => op.hash)).toEqual([
      "HASH400",
      "HASH300",
      "HASH200",
      "HASH100",
    ]);
  });

  describe("pending operations", () => {
    const olderHistory = stored.slice(1);

    const syncDiscoveringNewestTransaction = async (
      pending: (template: Account["operations"][number]) => Account["operations"],
    ) => {
      const first = await syncWith(olderHistory, scanned);
      const second = await syncWith(stored, {
        ...first,
        pendingOperations: pending(first.operations[0]),
      });
      return {
        knewNewest: first.operations.some(op => op.hash === "HASH400"),
        second,
      };
    };

    it("keeps a fresh pending operation that no confirmed operation matches", async () => {
      const { second } = await syncDiscoveringNewestTransaction(template => [
        pendingFrom(template, "PENDING"),
      ]);

      expect(second.pendingOperations.map(op => op.hash)).toEqual(["PENDING"]);
    });

    it("drops a pending operation once the sync discovers its hash as confirmed", async () => {
      const { knewNewest, second } = await syncDiscoveringNewestTransaction(template => [
        pendingFrom(template, "HASH400"),
      ]);

      expect({
        knewNewest,
        confirmed: second.operations.some(op => op.hash === "HASH400"),
        pending: second.pendingOperations,
      }).toEqual({ knewNewest: false, confirmed: true, pending: [] });
    });

    it("drops the pending operation the sync confirms and keeps the unmatched one beside it", async () => {
      const { second } = await syncDiscoveringNewestTransaction(template => [
        pendingFrom(template, "HASH400"),
        pendingFrom(template, "PENDING"),
      ]);

      expect(second.pendingOperations.map(op => op.hash)).toEqual(["PENDING"]);
    });

    it("drops a pending operation older than the optimistic retention that nothing confirms", async () => {
      const { second } = await syncDiscoveringNewestTransaction(template => [
        pendingFrom(template, "STALE", 99, new Date(0)),
      ]);

      expect(second.pendingOperations).toEqual([]);
    });
  });

  it("lists no operation twice after an incremental sync", async () => {
    const first = await syncWith(stored, scanned);

    const second = await syncWith([sendTx("HASH100", 600, "100"), ...stored.slice(0, 3)], first);

    const ids = second.operations.map(op => op.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("cosmos generic account bridge with a persisted v1 account", () => {
  const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };

  it("restores the persisted account as it was stored", async () => {
    const restored = await fromAccountRaw(COSMOS_V1_ACCOUNT_RAW);

    expect(restored).toMatchObject({
      id: COSMOS_V1_ACCOUNT_RAW.id,
      xpub: COSMOS_V1_ACCOUNT_RAW.xpub,
      seedIdentifier: COSMOS_V1_ACCOUNT_RAW.seedIdentifier,
      freshAddress: COSMOS_V1_ACCOUNT_RAW.freshAddress,
      freshAddressPath: COSMOS_V1_ACCOUNT_RAW.freshAddressPath,
      blockHeight: COSMOS_V1_ACCOUNT_RAW.blockHeight,
      balance: new BigNumber(COSMOS_V1_ACCOUNT_RAW.balance),
    });
  });

  it("syncs it to a v2 id and keeps its keys, address, balances and delegations", async () => {
    const restored = await fromAccountRaw(COSMOS_V1_ACCOUNT_RAW);
    const bridge = await getAccountBridge(restored);

    const synced = await firstValueFrom(
      bridge.sync(restored, syncConfig).pipe(reduce((acc, update) => update(acc), restored)),
    );

    expect(synced).toMatchObject({
      id: `js:2:cosmos:${COSMOS_V1_ACCOUNT_RAW.freshAddress}:`,
      xpub: COSMOS_V1_ACCOUNT_RAW.xpub,
      seedIdentifier: COSMOS_V1_ACCOUNT_RAW.seedIdentifier,
      freshAddress: COSMOS_V1_ACCOUNT_RAW.freshAddress,
      balance: mockLiquidBalance.plus(mockDelegatedBalance).plus(mockUnbondingBalance),
      spendableBalance: mockLiquidBalance,
      stakingResources: {
        delegatedBalance: mockDelegatedBalance,
        unbondingBalance: mockUnbondingBalance,
        delegations: [{ validatorAddress: mockDelegatedValidators.cosmos }],
      },
    });
  });
});

describe.each(Object.values(PERSISTED_V2_ACCOUNTS))(
  "cosmos generic account bridge with a persisted v2 account of $currencyId",
  raw => {
    it("restores the persisted account with its address as xpub", async () => {
      const restored = await fromAccountRaw(raw);

      expect(restored).toMatchObject({
        id: raw.id,
        xpub: raw.freshAddress,
        seedIdentifier: raw.seedIdentifier,
        freshAddress: raw.freshAddress,
        freshAddressPath: raw.freshAddressPath,
        index: raw.index,
        balance: new BigNumber(raw.balance),
      });
    });

    it("syncs it keeping its v2 id, its address as xpub and its identity, with the chain balances", async () => {
      const restored = await fromAccountRaw(raw);
      const bridge = await getAccountBridge(restored);

      const synced = await syncAccount(bridge, restored);

      expect(synced).toMatchObject({
        id: raw.id,
        xpub: raw.freshAddress,
        seedIdentifier: raw.seedIdentifier,
        freshAddress: raw.freshAddress,
        freshAddressPath: raw.freshAddressPath,
        balance: mockLiquidBalance.plus(mockDelegatedBalance).plus(mockUnbondingBalance),
        spendableBalance: mockLiquidBalance,
      });
    });
  },
);

describe.each(DEVICE_CHAINS)(
  "cosmos generic account bridge with a persisted scanned account of $currencyId",
  chain => {
    it("keeps the public key as xpub through a raw round trip and a sync", async () => {
      const scanned = await accountOf(chain);
      const restored = await fromAccountRaw(await toAccountRaw(scanned));
      const bridge = await getAccountBridge(restored);

      const synced = await syncAccount(bridge, restored);

      expect(synced).toMatchObject({
        id: scanned.id,
        xpub: chain.accounts[0].publicKey,
        seedIdentifier: chain.accounts[0].publicKey,
        freshAddress: chain.accounts[0].address,
        freshAddressPath: chain.accounts[0].path,
      });
    });
  },
);
