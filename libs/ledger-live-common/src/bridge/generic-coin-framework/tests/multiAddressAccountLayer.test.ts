import BigNumber from "bignumber.js";
import type {
  AccountTransaction,
  MultiAddressAccountFamily,
  MultiAddressAccountState,
} from "@ledgerhq/ledger-wallet-framework/api/types";
import type { Account, Operation } from "@ledgerhq/types-live";
import {
  accountPathFrom,
  accountPathOf,
  addressBookOf,
  addressPath,
  createMultiAddressAccountLayer,
} from "../multiAddressAccountLayer";

// A toy family: addresses are "<key>/<chain>/<index>", a transaction lists the addresses it pays.
type ToyTx = AccountTransaction & { to: string[] };
type ToyState = MultiAddressAccountState & { seen: string[] };
type ToyAccount = Account & { toyState?: ToyState };

const KEY = "xpub-toy";
const ACCOUNT_ID = `js:2:bitcoin:${KEY}:native_segwit`;
const at = (chain: number, index: number) => `${KEY}/${chain}/${index}`;

const emptyState = (): ToyState => ({
  version: 1,
  syncedHeight: 0,
  anchor: null,
  addresses: [],
  seen: [],
});

const operation = (tx: ToyTx): Operation =>
  ({
    id: `${ACCOUNT_ID}-${tx.id}-IN`,
    hash: tx.id,
    type: "IN",
    value: new BigNumber(1),
    fee: new BigNumber(0),
    senders: [],
    recipients: tx.to,
    blockHeight: tx.block?.height ?? null,
    blockHash: tx.block?.hash ?? null,
    accountId: ACCOUNT_ID,
    date: new Date((tx.block?.height ?? 1000) * 1000),
    extra: {},
  }) as Operation;

function toyFamily(
  overrides: Partial<MultiAddressAccountFamily<ToyTx, ToyState>> = {},
): MultiAddressAccountFamily<ToyTx, ToyState> {
  return {
    chains: [0, 1],
    receiveChain: 0,
    gapLimit: 2,
    rewindBlocks: 3,
    getAccountKey: jest.fn(async () => KEY),
    addressDeriver: jest.fn(
      (_currencyId: string, _mode: unknown, key: string) => async (chain: number, index: number) =>
        `${key}/${chain}/${index}`,
    ),
    transactionOf: op => op.details as ToyTx,
    readState: account => (account as ToyAccount | undefined)?.toyState,
    emptyState,
    resyncError: () => new Error("ToyNeedResync"),
    interpret: jest.fn((transactions: ToyTx[]) => transactions.map(operation)),
    settle: jest.fn(({ state, confirmed, pending, operations }) => {
      const next = { ...state, seen: [...state.seen, ...confirmed.map(tx => tx.id)] };
      return {
        state: next,
        operations,
        balance: new BigNumber(confirmed.length),
        spendableBalance: new BigNumber(confirmed.length - pending.length),
        accountFields: { toyState: next } as Partial<Account>,
      };
    }),
    completeIntent: jest.fn(async intent => intent),
    ...overrides,
  };
}

const tx = (id: string, to: string[], height: number | null = 10): ToyTx => ({
  id,
  to,
  block: height === null ? null : { height, hash: `h${height}` },
});

type Pages = Record<string, Array<{ txs: ToyTx[]; next?: string }>>;

function fakeApi(pages: Pages, { tip = 200, blocks = {} as Record<number, string> } = {}) {
  return {
    lastBlock: jest.fn(async () => ({ height: tip, hash: `h${tip}` })),
    getBlockInfo: jest.fn(async (_ctx: unknown, height: number) => {
      if (blocks[height] === "throw") throw new Error("unknown block");
      return { height, hash: blocks[height] ?? `h${height}` };
    }),
    listOperations: jest.fn(
      async (
        _ctx: unknown,
        address: string,
        { cursor }: { minHeight: number; cursor?: string },
      ) => {
        const page = (pages[address] ?? [])[cursor ? Number(cursor) : 0] ?? { txs: [] };
        return { items: page.txs.map(details => ({ details })), next: page.next ?? "" };
      },
    ),
  };
}

const info = (initialAccount?: Partial<ToyAccount>) =>
  ({
    currency: { id: "bitcoin" },
    index: 2,
    derivationPath: "84'/0'",
    derivationMode: "native_segwit",
    deviceId: "device",
    initialAccount,
  }) as never;

const deps = (api: ReturnType<typeof fakeApi>) =>
  ({ api, context: { ctx: true }, signerContext: "signer-context" }) as never;

const sync = (family: MultiAddressAccountFamily<ToyTx, ToyState>, i: unknown, api: unknown) =>
  createMultiAddressAccountLayer(family).getAccountShape(
    i as never,
    { paginationConfig: {} },
    api as never,
  );

beforeEach(() => jest.clearAllMocks());

describe("paths", () => {
  it("builds account and address paths", () => {
    expect(accountPathFrom("84'/0'", 3)).toBe("84'/0'/3'");
    expect(accountPathFrom("84'/0'/0'/0/0", 1)).toBe("84'/0'/1'");
    expect(accountPathOf("84'/0'/3'/0/12")).toBe("84'/0'/3'");
    expect(addressPath("84'/0'/3'", 1, 7)).toBe("84'/0'/3'/1/7");
  });
});

describe("getAccountShape", () => {
  it("scans a new account: key from the device, gap walk on every chain, history of each address", async () => {
    const family = toyFamily();
    const api = fakeApi({
      [at(0, 0)]: [{ txs: [tx("a", [at(0, 0)])], next: "1" }, { txs: [tx("b", [at(0, 0)], null)] }],
      [at(0, 3)]: [{ txs: [tx("c", [at(0, 3)], 50)] }],
      [at(1, 1)]: [{ txs: [tx("b", [at(1, 1)], 60)], next: "0" }],
    });

    const shape = await sync(family, info(), deps(api));

    expect(family.getAccountKey).toHaveBeenCalledWith(
      { currencyId: "bitcoin", accountPath: "84'/0'/2'", deviceId: "device" },
      "signer-context",
    );
    // a gap of 2 on each chain past the last used address
    const walked = api.listOperations.mock.calls.map(([, address]) => address);
    expect(new Set(walked)).toEqual(
      new Set([
        at(0, 0),
        at(0, 1),
        at(0, 2),
        at(0, 3),
        at(0, 4),
        at(0, 5),
        at(1, 0),
        at(1, 1),
        at(1, 2),
        at(1, 3),
      ]),
    );
    expect(api.listOperations).toHaveBeenCalledWith({ ctx: true }, at(0, 0), {
      minHeight: 0,
      order: "asc",
    });
    expect(api.listOperations).toHaveBeenCalledWith({ ctx: true }, at(0, 0), {
      minHeight: 0,
      order: "asc",
      cursor: "1",
    });

    // "b", pending on one address and confirmed on another, is read once, confirmed
    const [[transactions, interpretContext]] = (family.interpret as jest.Mock).mock.calls;
    expect(transactions.map((t: ToyTx) => [t.id, t.block?.height ?? null])).toEqual(
      expect.arrayContaining([
        ["a", 10],
        ["b", 60],
        ["c", 50],
      ]),
    );
    expect(transactions).toHaveLength(3);
    expect(interpretContext).toEqual({
      currencyId: "bitcoin",
      accountId: ACCOUNT_ID,
      addresses: expect.arrayContaining([
        { address: at(0, 0), chain: 0, index: 0 },
        { address: at(0, 3), chain: 0, index: 3 },
        { address: at(1, 1), chain: 1, index: 1 },
      ]),
    });

    const [[settleInput]] = (family.settle as jest.Mock).mock.calls;
    expect(settleInput.state).toMatchObject({
      syncedHeight: 200,
      anchor: { height: 60, hash: "h60" },
      seen: [],
    });
    expect(settleInput.confirmed).toHaveLength(3);
    expect(settleInput.pending).toHaveLength(0);

    expect(shape).toMatchObject({
      id: ACCOUNT_ID,
      xpub: KEY,
      balance: new BigNumber(3),
      spendableBalance: new BigNumber(3),
      operationsCount: 3,
      freshAddress: at(0, 4),
      freshAddressPath: "84'/0'/2'/0/4",
      blockHeight: 200,
      toyState: { syncedHeight: 200, seen: expect.arrayContaining(["a", "b", "c"]) },
    });
  });

  it("resyncs an account from its key and state, re-reading a few blocks for known addresses", async () => {
    const family = toyFamily({ displayAddress: (_currency, address) => address.toUpperCase() });
    const previous = operation(tx("old", [at(0, 0)], 90));
    const api = fakeApi({ [at(0, 0)]: [{ txs: [tx("new", [at(0, 0)], null)] }] });
    const account = {
      id: ACCOUNT_ID,
      operations: [previous],
      toyState: {
        ...emptyState(),
        syncedHeight: 100,
        anchor: { height: 90, hash: "h90" },
        addresses: [{ address: at(0, 0), chain: 0, index: 0 }],
      },
    };

    const shape = await sync(family, info(account), deps(api));

    expect(family.getAccountKey).not.toHaveBeenCalled();
    expect(api.listOperations).toHaveBeenCalledWith({ ctx: true }, at(0, 0), {
      minHeight: 97,
      order: "asc",
    });
    expect(api.listOperations).toHaveBeenCalledWith({ ctx: true }, at(0, 1), {
      minHeight: 0,
      order: "asc",
    });
    expect(shape.operations?.map(op => op.hash)).toEqual(["new", "old"]);
    expect((family.settle as jest.Mock).mock.calls[0][0]).toMatchObject({
      state: { anchor: { height: 90, hash: "h90" } },
      pending: [expect.objectContaining({ id: "new" })],
    });
    expect(shape.freshAddress).toBe(at(0, 1).toUpperCase());
  });

  it("starts over after a reorg below the anchor", async () => {
    const family = toyFamily();
    const api = fakeApi({}, { blocks: { 90: "other" } });
    const account = {
      id: ACCOUNT_ID,
      operations: [operation(tx("old", [at(0, 0)], 90))],
      toyState: {
        ...emptyState(),
        syncedHeight: 100,
        anchor: { height: 90, hash: "h90" },
        addresses: [{ address: at(0, 0), chain: 0, index: 0 }],
      },
    };

    const shape = await sync(family, info(account), deps(api));

    expect(shape.operations).toEqual([]);
    expect((family.settle as jest.Mock).mock.calls[0][0].state).toMatchObject({
      addresses: [],
      anchor: null,
    });
    expect(api.listOperations).toHaveBeenCalledWith({ ctx: true }, at(0, 0), {
      minHeight: 0,
      order: "asc",
    });
  });

  it("does not take a failing block lookup for a reorg", async () => {
    const family = toyFamily();
    const api = fakeApi({}, { blocks: { 90: "throw" } });
    const previous = operation(tx("old", [at(0, 0)], 90));
    const account = {
      id: ACCOUNT_ID,
      operations: [previous],
      toyState: { ...emptyState(), syncedHeight: 2, anchor: { height: 90, hash: "h90" } },
    };

    const shape = await sync(family, info(account), deps(api));

    expect(shape.operations).toEqual([previous]);
    expect((family.settle as jest.Mock).mock.calls[0][0].state.anchor).toEqual({
      height: 90,
      hash: "h90",
    });
  });
});

describe("addressBookOf", () => {
  const account = (toyState?: ToyState) =>
    ({
      id: ACCOUNT_ID,
      currency: { id: "bitcoin" },
      derivationMode: "native_segwit",
      freshAddressPath: "84'/0'/2'/0/4",
      ...(toyState ? { toyState } : {}),
    }) as unknown as Account;

  it("gives the paths and the next address of each chain", async () => {
    const book = addressBookOf(
      toyFamily(),
      account({
        ...emptyState(),
        addresses: [
          { address: at(1, 0), chain: 1, index: 0 },
          { address: at(1, 3), chain: 1, index: 3 },
        ],
      }),
    );
    expect(book.accountPath).toBe("84'/0'/2'");
    expect(book.pathOf({ chain: 1, index: 3 })).toBe("84'/0'/2'/1/3");
    expect(await book.next(1)).toEqual({ address: at(1, 4), path: "84'/0'/2'/1/4" });
    expect(await book.next(0)).toEqual({ address: at(0, 0), path: "84'/0'/2'/0/0" });
  });

  it("needs a resync without a state", () => {
    expect(() => addressBookOf(toyFamily(), account())).toThrow("ToyNeedResync");
  });
});

describe("account layer", () => {
  it("completes an intent with the account's address book", async () => {
    const family = toyFamily();
    const layer = createMultiAddressAccountLayer(family);
    const state = { ...emptyState(), addresses: [{ address: at(0, 0), chain: 0, index: 0 }] };
    const account = {
      id: ACCOUNT_ID,
      currency: { id: "bitcoin" },
      derivationMode: "native_segwit",
      freshAddressPath: "84'/0'/2'/0/1",
      toyState: state,
    } as unknown as Account;
    const intent = { intentType: "transaction" } as never;

    await layer.completeIntent(intent, account, { t: 1 }, { api: "api", context: "ctx" } as never);

    expect(family.completeIntent).toHaveBeenCalledWith(
      intent,
      account,
      { t: 1 },
      {
        api: "api",
        context: "ctx",
        addressBook: expect.objectContaining({
          accountPath: "84'/0'/2'",
          addresses: state.addresses,
        }),
      },
    );
  });

  it("passes the family's optional hooks through, and only those", () => {
    const decorateOptimisticOperation = jest.fn();
    const getSerializedAddressParameters = jest.fn();
    expect(
      createMultiAddressAccountLayer(
        toyFamily({ decorateOptimisticOperation, getSerializedAddressParameters }),
      ),
    ).toMatchObject({ decorateOptimisticOperation, getSerializedAddressParameters });
    const bare = createMultiAddressAccountLayer(toyFamily());
    expect(bare).not.toHaveProperty("decorateOptimisticOperation");
    expect(bare).not.toHaveProperty("getSerializedAddressParameters");
  });
});

describe("postSync", () => {
  const op = (hash: string, overrides: Partial<Operation> = {}) =>
    ({ hash, type: "OUT", recipients: [], ...overrides }) as Operation;
  const account = (operations: Operation[], pendingOperations: Operation[]) =>
    ({ operations, pendingOperations }) as unknown as Account;

  it("leaves an account without pending operations alone", () => {
    const synced = account([op("a")], []);
    expect(createMultiAddressAccountLayer(toyFamily()).postSync(synced, synced)).toBe(synced);
  });

  it("settles a pending operation once its own transaction is synced", () => {
    const synced = account([op("sent")], [op("sent"), op("waiting")]);
    const result = createMultiAddressAccountLayer(toyFamily()).postSync(synced, synced);
    expect(result.pendingOperations).toEqual([op("waiting")]);
    expect(result.operations).toBe(synced.operations);
  });

  it("lets the family settle other pending operations and complete the sent ones", () => {
    const isPendingSettled = jest.fn((pending: Operation) => pending.hash === "replaced");
    const mergeSentOperation = jest.fn((synced: Operation, optimistic: Operation) => ({
      ...synced,
      recipients: optimistic.recipients,
    }));
    const synced = account(
      [op("sent"), op("other")],
      [op("sent", { recipients: ["typed"] }), op("replaced"), op("waiting")],
    );

    const result = createMultiAddressAccountLayer(
      toyFamily({ isPendingSettled, mergeSentOperation }),
    ).postSync(synced, synced);

    expect(result.pendingOperations).toEqual([op("waiting")]);
    expect(result.operations).toEqual([op("sent", { recipients: ["typed"] }), op("other")]);
    expect(isPendingSettled).toHaveBeenCalledWith(op("replaced"), synced);
  });
});
