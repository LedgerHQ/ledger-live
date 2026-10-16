import BigNumber from "bignumber.js";
import type {
  AccountModuleApi,
  AccountOperation,
  CraftedAccountTransaction,
} from "@ledgerhq/account-module-framework";
import type { AccountModuleBinding } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import {
  accountDataOf,
  accountModulePostSync,
  accountPathFrom,
  accountPathOf,
  decorateWithAccountModule,
  getAccountModuleShape,
  intentApiFor,
  toAccountOperation,
  toLiveOperation,
} from "../accountModule";

const ACCOUNT_ID = "js:2:bitcoin:xpub:native_segwit";
const context = { config: jest.fn(), logger: jest.fn() };
const currency = { id: "bitcoin", family: "bitcoin", name: "Bitcoin", units: [] };

const liveOperation = (fields: Partial<Operation> = {}): Operation => ({
  id: `${ACCOUNT_ID}-tx-OUT`,
  hash: "tx",
  type: "OUT",
  value: new BigNumber(1500),
  fee: new BigNumber(100),
  senders: ["a"],
  recipients: ["b"],
  blockHeight: 10,
  blockHash: "h10",
  accountId: ACCOUNT_ID,
  date: new Date("2026-01-01T00:00:00.000Z"),
  hasFailed: false,
  extra: { inputs: ["p-0"] },
  ...fields,
});

const accountOperation = (fields: Partial<AccountOperation> = {}): AccountOperation => ({
  id: "tx-OUT",
  hash: "tx",
  type: "OUT",
  value: 1500n,
  fee: 100n,
  asset: { type: "native" },
  senders: ["a"],
  recipients: ["b"],
  block: { height: 10, hash: "h10", time: new Date("2026-01-01T00:00:00.000Z") },
  date: new Date("2026-01-01T00:00:00.000Z"),
  failed: false,
  details: { inputs: ["p-0"] },
  ...fields,
});

const account = (fields: Partial<Account> = {}): Account =>
  ({
    type: "Account",
    id: ACCOUNT_ID,
    currency,
    index: 2,
    derivationMode: "native_segwit",
    freshAddress: "fresh",
    freshAddressPath: "84'/0'/2'/0/7",
    operations: [],
    pendingOperations: [],
    ...fields,
  }) as unknown as Account;

function fakeModule(fields: Partial<AccountModuleApi> = {}): AccountModuleApi {
  return {
    sync: async function* () {
      yield { state: { version: 1, data: "first" }, progress: {} };
      yield { state: { version: 1, data: "last" }, progress: { blockHeight: 120 } };
    },
    getBalances: jest.fn(async () => [{ value: 900n, asset: { type: "native" }, locked: 100n }]),
    getFreshAddress: jest.fn(async () => ({ address: "next", derivationPath: "84'/0'/2'/0/8" })),
    estimateFees: jest.fn(async () => ({ value: 1n })),
    validateIntent: jest.fn(async () => ({
      errors: {},
      warnings: {},
      estimatedFees: 1n,
      amount: 1n,
      totalSpent: 2n,
    })),
    craftTransaction: jest.fn(async () => ({
      transaction: "unsigned",
      operation: accountOperation(),
    })),
    combine: jest.fn(async () => "signed"),
    ...fields,
  } as Partial<AccountModuleApi> as AccountModuleApi;
}

function binding(
  module: AccountModuleApi,
  fields: Partial<AccountModuleBinding> = {},
): AccountModuleBinding {
  return {
    create: jest.fn(() => module),
    getAccountKey: jest.fn(async () => "device-xpub"),
    readState: jest.fn(() => ({ version: 1, data: "persisted" })),
    accountFields: jest.fn(async () => ({ xpub: "from-family" }) as Partial<Account>),
    syncedHeight: jest.fn(() => undefined),
    ...fields,
  };
}

describe("paths", () => {
  it("builds the account path from a scheme or a full path, and reads it from an address path", () => {
    expect(accountPathFrom("84'/0'", 3)).toBe("84'/0'/3'");
    expect(accountPathFrom("84'/0'/0'/0/0", 1)).toBe("84'/0'/1'");
    expect(accountPathOf("84'/0'/3'/1/12")).toBe("84'/0'/3'");
  });
});

describe("operation mapping", () => {
  it("maps a Ledger Wallet operation to an account operation, and back", () => {
    const live = liveOperation({ transactionSequenceNumber: new BigNumber(5) });
    const op = toAccountOperation(live, false);
    expect(op).toEqual(accountOperation({ details: { inputs: ["p-0"], sequence: 5 } }));
    expect(toLiveOperation({}, ACCOUNT_ID, op)).toEqual(live);
  });

  it("maps a pending optimistic operation without block, extra nor sequence", () => {
    const live = liveOperation({ blockHeight: undefined, blockHash: undefined, extra: undefined });
    const op = toAccountOperation({ ...live, hasFailed: undefined } as unknown as Operation, true);
    expect(op).toMatchObject({ block: null, optimistic: true, failed: false, details: {} });
    expect(
      toAccountOperation(liveOperation({ blockHeight: 3, blockHash: undefined }), false).block,
    ).toEqual({
      height: 3,
      hash: "",
      time: live.date,
    });
    expect(
      toLiveOperation({}, ACCOUNT_ID, accountOperation({ block: null, details: undefined })),
    ).toMatchObject({
      blockHeight: undefined,
      blockHash: undefined,
      extra: {},
    });
  });

  it("reads a sequence given as a string, ignores one of another type, and lets the family complete", () => {
    expect(
      toLiveOperation({}, ACCOUNT_ID, accountOperation({ details: { sequence: "7" } }))
        .transactionSequenceNumber,
    ).toEqual(new BigNumber(7));
    expect(
      toLiveOperation({}, ACCOUNT_ID, accountOperation({ details: { sequence: true } })),
    ).not.toHaveProperty("transactionSequenceNumber");
    const toLive = jest.fn((_op: AccountOperation, live: Operation) => ({
      ...live,
      completed: true,
    }));
    expect(
      toLiveOperation({ toLiveOperation: toLive }, ACCOUNT_ID, accountOperation()),
    ).toMatchObject({
      completed: true,
    });
  });
});

describe("accountDataOf", () => {
  it("describes the account, with its operations and its pending ones as optimistic", async () => {
    const data = accountDataOf(
      binding(fakeModule()),
      account({
        operations: [liveOperation()],
        pendingOperations: [liveOperation({ hash: "sent", blockHeight: undefined })],
      }),
    );
    expect(data.descriptor).toEqual({
      currencyId: "bitcoin",
      derivationMode: "native_segwit",
      index: 2,
      key: "xpub",
      derivationPath: "84'/0'/2'",
    });
    expect(data.state).toEqual({ version: 1, data: "persisted" });
    expect((await data.history.list()).items.map(op => [op.hash, op.optimistic ?? false])).toEqual([
      ["sent", true],
      ["tx", false],
    ]);
  });
});

describe("getAccountModuleShape", () => {
  const info = {
    currency,
    index: 2,
    derivationPath: "84'/0'",
    derivationMode: "native_segwit",
    deviceId: "device",
  } as never;
  const deps = { api: {} as never, context, signerContext: jest.fn() };

  it("scans a new account: the key from the device, the account synced and read by the module", async () => {
    const module = fakeModule({
      sync: async function* (_context, { history }) {
        await history.upsert([
          accountOperation(),
          accountOperation({ id: "o", hash: "o", optimistic: true }),
        ]);
        yield { state: { version: 1, data: "synced" }, progress: { blockHeight: 120 } };
        yield { state: { version: 1, data: "final" }, progress: {} };
      },
    });
    const bound = binding(module, { readState: jest.fn(() => undefined) });

    const shape = await getAccountModuleShape(bound, info, deps);

    expect(bound.getAccountKey).toHaveBeenCalledWith(
      {
        currencyId: "bitcoin",
        derivationPath: "84'/0'/2'",
        derivationMode: "native_segwit",
        deviceId: "device",
      },
      deps.signerContext,
    );
    expect(bound.create).toHaveBeenCalledWith(deps.api, "bitcoin");
    expect(shape).toEqual({
      id: "js:2:bitcoin:device-xpub:native_segwit",
      balance: new BigNumber(900),
      spendableBalance: new BigNumber(800),
      operations: [
        liveOperation({
          id: "js:2:bitcoin:device-xpub:native_segwit-tx-OUT",
          accountId: "js:2:bitcoin:device-xpub:native_segwit",
        }),
      ],
      operationsCount: 1,
      freshAddress: "next",
      freshAddressPath: "84'/0'/2'/0/8",
      blockHeight: 120,
      xpub: "from-family",
    });
    // The family fields are read on the state the sync just persisted.
    expect(bound.accountFields).toHaveBeenCalledWith({
      key: "device-xpub",
      state: { version: 1, data: "final" },
      getUTXOs: expect.any(Function),
    });
  });

  it("hands the family the module's unspent outputs, none when the module has no UTXO read", async () => {
    const utxo = {
      txid: "t",
      vout: 0,
      value: 1n,
      address: "a",
      height: null,
      replaceable: false,
      change: false,
    };
    const getUTXOs = jest.fn(async () => [utxo]);
    const withUtxos = binding(fakeModule({ getUTXOs }));
    await getAccountModuleShape(withUtxos, info, deps);
    const [{ getUTXOs: readUtxos }] = jest.mocked(withUtxos.accountFields).mock.calls[0];
    await expect(readUtxos()).resolves.toEqual([utxo]);
    expect(getUTXOs).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ state: expect.anything() }),
    );

    const withoutUtxos = binding(fakeModule());
    await getAccountModuleShape(withoutUtxos, info, deps);
    const [{ getUTXOs: noUtxos }] = jest.mocked(withoutUtxos.accountFields).mock.calls[0];
    await expect(noUtxos()).resolves.toEqual([]);
  });

  it("syncs a known account from its key, its state and its operations", async () => {
    const sync = jest.fn(async function* () {
      yield { state: { version: 1, data: "synced" }, progress: {} };
    });
    const module = fakeModule({ sync, getBalances: jest.fn(async () => []) });
    const bound = binding(module);

    const shape = await getAccountModuleShape(
      bound,
      { ...(info as object), initialAccount: account({ operations: [liveOperation()] }) } as never,
      deps,
    );

    expect(bound.getAccountKey).not.toHaveBeenCalled();
    const [, data] = sync.mock.calls[0] as unknown as [
      unknown,
      { state: unknown; descriptor: { key: string } },
    ];
    expect(data.descriptor.key).toBe("xpub");
    expect(shape).toMatchObject({ id: ACCOUNT_ID, balance: new BigNumber(0), operationsCount: 1 });
    expect(shape).not.toHaveProperty("blockHeight");
  });
});

describe("accountModulePostSync", () => {
  const sent = liveOperation({ hash: "sent", recipients: ["user typed"] });

  it("leaves an account without pending operations alone", () => {
    const synced = account();
    expect(accountModulePostSync(binding(fakeModule()), synced)).toBe(synced);
  });

  it("settles a pending operation once its own transaction is synced", () => {
    const synced = account({
      operations: [liveOperation({ hash: "sent" })],
      pendingOperations: [sent, liveOperation({ hash: "waiting" })],
    });
    const result = accountModulePostSync(binding(fakeModule()), synced);
    expect(result.pendingOperations.map(op => op.hash)).toEqual(["waiting"]);
    expect(result.operations).toBe(synced.operations);
  });

  it("lets the family settle other pending operations and complete the sent ones", () => {
    const mergeSentOperation = jest.fn((synced: Operation, optimistic: Operation) => ({
      ...synced,
      recipients: optimistic.recipients,
    }));
    const synced = account({
      operations: [liveOperation({ hash: "sent" }), liveOperation({ hash: "other" })],
      pendingOperations: [sent, liveOperation({ hash: "replaced" })],
    });
    const result = accountModulePostSync(
      binding(fakeModule(), { mergeSentOperation, isPendingSettled: op => op.hash === "replaced" }),
      synced,
    );
    expect(result.pendingOperations).toEqual([]);
    expect(result.operations.map(op => op.recipients)).toEqual([["user typed"], ["b"]]);
  });
});

describe("intentApiFor", () => {
  const coinModuleApi = {
    estimateFees: jest.fn(),
    validateIntent: jest.fn(),
    craftTransaction: jest.fn(),
    combine: jest.fn(),
    getNextSequence: jest.fn(async () => 4n),
    craftTransactionData: jest.fn(() => ({ type: "crafted" })),
  } as never;
  const intent = { recipient: "r", amount: 1n } as never;

  it("is the coin module itself for an address-based family", () => {
    expect(intentApiFor({}, coinModuleApi, account(), {})).toBe(coinModuleApi);
  });

  it("tells the network sequence of the coin module for an account module family too", async () => {
    const api = intentApiFor(
      { accountModule: binding(fakeModule()) },
      coinModuleApi,
      account(),
      {},
    );
    await expect(api.getNextSequence(context as never, "address")).resolves.toBe(4n);
    expect((coinModuleApi as { getNextSequence: jest.Mock }).getNextSequence).toHaveBeenCalledWith(
      context,
      "address",
    );
  });

  it("completes the data of an intent with the coin module for an account module family too", () => {
    const api = intentApiFor(
      { accountModule: binding(fakeModule()) },
      coinModuleApi,
      account(),
      {},
    );
    expect(api.craftTransactionData(context as never, intent)).toEqual({ type: "crafted" });
    expect(
      (coinModuleApi as { craftTransactionData: jest.Mock }).craftTransactionData,
    ).toHaveBeenCalledWith(context, intent);
  });

  it("goes through the account module, with the family's options of the transaction", async () => {
    const module = fakeModule();
    const accountOptions = jest.fn(() => ({ strategy: 1 }));
    const api = intentApiFor(
      { accountModule: binding(module, { accountOptions }) },
      coinModuleApi,
      account(),
      {
        utxo: "choice",
      },
    );

    await api.estimateFees(context as never, intent, { customFeesParameters: { a: 1 } });
    await api.validateIntent(context as never, intent, [], { customFees: { value: 1n } });
    const crafted = await api.craftTransaction(context as never, intent);
    await api.combine(context as never, crafted.transaction, ["sig"], { pubkey: "pk" });

    expect(accountOptions).toHaveBeenCalledWith({ utxo: "choice" });
    const withOptions = { recipient: "r", amount: 1n, accountOptions: { strategy: 1 } };
    expect(module.estimateFees).toHaveBeenCalledWith(context, expect.any(Object), withOptions, {
      customFeesParameters: { a: 1 },
    });
    expect(module.validateIntent).toHaveBeenCalledWith(context, expect.any(Object), withOptions, {
      customFees: { value: 1n },
    });
    expect(module.combine).toHaveBeenCalledWith(context, expect.any(Object), crafted, ["sig"], {
      pubkey: "pk",
    });
  });

  it("passes the intent as is without family options, and combines only what it crafted", async () => {
    const module = fakeModule();
    const api = intentApiFor({ accountModule: binding(module) }, coinModuleApi, account(), {});
    await api.estimateFees(context as never, intent);
    expect(module.estimateFees).toHaveBeenCalledWith(
      context,
      expect.any(Object),
      intent,
      undefined,
    );
    expect(() => api.combine(context as never, "elsewhere", ["sig"])).toThrow(
      "Combining a transaction this account did not craft",
    );
  });
});

describe("decorateWithAccountModule", () => {
  const optimistic = liveOperation({
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: ["fresh"],
    recipients: ["typed"],
    extra: { kept: true },
  });
  const crafted = (operation: Partial<AccountOperation>): CraftedAccountTransaction => ({
    transaction: "unsigned",
    operation: accountOperation({ ...operation }),
  });

  it("takes the fee, value, senders, recipients and details of what was crafted", () => {
    const result = decorateWithAccountModule(
      binding(fakeModule()),
      optimistic,
      crafted({ details: { inputs: ["x-1"], sequence: 4 } }),
      account(),
      {},
    );
    expect(result).toMatchObject({
      fee: new BigNumber(100),
      value: new BigNumber(1500),
      senders: ["a"],
      recipients: ["b"],
      extra: { kept: true, inputs: ["x-1"] },
    });
    expect(result.extra).not.toHaveProperty("sequence");
  });

  it("keeps the generic senders and recipients when the module knows none, then lets the family decorate", () => {
    const decorateOptimisticOperation = jest.fn(op => ({ ...op, decorated: true }));
    const craftedTransaction = crafted({ senders: [], recipients: [], details: undefined });
    const result = decorateWithAccountModule(
      binding(fakeModule(), { decorateOptimisticOperation }),
      { ...optimistic, extra: undefined } as unknown as Operation,
      craftedTransaction,
      account(),
      { tx: 1 },
    );
    expect(result).toMatchObject({
      senders: ["fresh"],
      recipients: ["typed"],
      decorated: true,
      extra: {},
    });
    expect(decorateOptimisticOperation).toHaveBeenCalledWith(
      expect.any(Object),
      craftedTransaction,
      account(),
      { tx: 1 },
    );
  });
});
