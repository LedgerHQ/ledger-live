import BigNumber from "bignumber.js";
import { of, Subject } from "rxjs";
import type { Account, Operation } from "@ledgerhq/types-live";
import { createAccountDataRouter } from "@domain/api-account-data-source";
import { AccountRefSchema } from "@domain/entity-account";
import { FullSyncSource } from "./FullSyncSource";

const getAccountBridge = jest.fn();
jest.mock("../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const ACCOUNT_ID = "js:2:ethereum:0xabc:";
const TOKEN_ACCOUNT_ID = `${ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`;
const USDC = "ethereum/erc20/usd__coin";

const operation = (over: Partial<Operation> = {}): Operation =>
  ({
    id: "op-1",
    hash: "0xdead",
    accountId: ACCOUNT_ID,
    type: "OUT",
    value: new BigNumber("1000"),
    fee: new BigNumber("21"),
    senders: ["0xabc"],
    recipients: ["0xdef"],
    blockHeight: 19_000_000,
    date: new Date("2026-01-31T12:00:00.000Z"),
    extra: {},
    ...over,
  }) as unknown as Operation;

const tokenAccount = (over: object = {}) => ({
  type: "TokenAccount",
  id: TOKEN_ACCOUNT_ID,
  parentId: ACCOUNT_ID,
  token: { id: USDC },
  balance: new BigNumber("2500000"),
  spendableBalance: new BigNumber("2500000"),
  operations: [],
  ...over,
});

const account = (over: object = {}): Account =>
  ({
    type: "Account",
    id: ACCOUNT_ID,
    currency: { id: "ethereum" },
    balance: new BigNumber("1500000000000000000"),
    spendableBalance: new BigNumber("1400000000000000000"),
    operations: [],
    subAccounts: [],
    ...over,
  }) as unknown as Account;

const ref = AccountRefSchema.parse({
  accountId: ACCOUNT_ID,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

/** A bridge whose sync resolves at once to `synced`. */
function syncingTo(synced: Account) {
  const sync = jest.fn(() => of(() => synced));
  getAccountBridge.mockResolvedValue({ sync });
  return sync;
}

/** A bridge whose syncs stay pending until released. */
function pendingBridge() {
  const subjects: Subject<(a: Account) => Account>[] = [];
  const sync = jest.fn(() => {
    const subject = new Subject<(a: Account) => Account>();
    subjects.push(subject);
    return subject.asObservable();
  });
  getAccountBridge.mockResolvedValue({ sync });
  const release = () => {
    for (const subject of subjects) {
      subject.next(a => a);
      subject.complete();
    }
  };
  return { sync, release };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

const prepareCurrency = jest.fn(async () => undefined);

const source = (accounts: Account[] = [account()], blacklistedTokenIds?: () => string[]) =>
  new FullSyncSource({
    getAccount: id => accounts.find(candidate => candidate.id === id),
    prepareCurrency,
    blacklistedTokenIds,
  });

beforeEach(() => jest.clearAllMocks());

describe("FullSyncSource", () => {
  describe("supports", () => {
    it("supports a known currency whose account is in the store", () => {
      expect(source().supports(ref)).toBe(true);
      expect(source([]).supports(ref)).toBe(false);
      expect(source().supports({ ...ref, currencyId: "not-a-currency" })).toBe(false);
    });
  });

  describe("the shared sync", () => {
    it("serves balance and operations read together with a single bridge.sync", async () => {
      const { sync, release } = pendingBridge();
      const router = createAccountDataRouter([source()]);
      const both = Promise.all([router.read("balance", ref), router.read("operations", ref)]);
      await settle();
      release();
      const [balance, operations] = await both;
      expect(sync).toHaveBeenCalledTimes(1);
      expect(balance.sourceId).toBe("full-sync");
      expect(operations.data).toEqual({ operations: [], complete: true, total: 0 });
    });

    it("does not share between two accounts", async () => {
      const other = account({ id: "js:2:ethereum:0xdef:" });
      const { sync, release } = pendingBridge();
      const fullSync = source([account(), other]);
      const both = Promise.all([
        fullSync.balance(ref, undefined),
        fullSync.balance(AccountRefSchema.parse({ ...ref, accountId: other.id }), undefined),
      ]);
      await settle();
      release();
      await both;
      expect(sync).toHaveBeenCalledTimes(2);
    });

    it("starts a fresh sync once the shared one has settled", async () => {
      const sync = syncingTo(account());
      const fullSync = source();
      await fullSync.balance(ref, undefined);
      await fullSync.balance(ref, undefined);
      expect(sync).toHaveBeenCalledTimes(2);
    });

    it("passes the blacklisted tokens and prepares the currency first", async () => {
      const sync = syncingTo(account());
      await source([account()], () => ["ethereum/erc20/scam"]).balance(ref, undefined);
      expect(prepareCurrency).toHaveBeenCalledWith({ id: "ethereum" });
      expect(sync).toHaveBeenCalledWith(expect.anything(), {
        paginationConfig: {},
        blacklistedTokenIds: ["ethereum/erc20/scam"],
      });
    });

    it("rejects before syncing when the signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(source().operations(ref, undefined, controller.signal)).rejects.toThrow(
        /aborted before/,
      );
      expect(getAccountBridge).not.toHaveBeenCalled();
    });

    it("lets one caller give up without taking the shared sync down", async () => {
      const { release } = pendingBridge();
      const fullSync = source();
      const controller = new AbortController();
      const aborted = fullSync.balance(ref, undefined, controller.signal);
      const other = fullSync.balance(ref, undefined);
      await settle();
      controller.abort();
      await expect(aborted).rejects.toThrow(/aborted/);
      release();
      await expect(other).resolves.toHaveLength(1);
    });

    it("fails when the account left the store between supports and the read", async () => {
      await expect(source([]).balance(ref, undefined)).rejects.toThrow(/not in the store/);
    });
  });

  describe("balance", () => {
    it("emits the main row first, then one per token account", async () => {
      syncingTo(account({ subAccounts: [tokenAccount()] }));
      const [main, token] = await source().balance(ref, undefined);
      expect(main).toMatchObject({
        accountId: ACCOUNT_ID,
        assetId: "ethereum",
        balance: "1500000000000000000",
        spendableBalance: "1400000000000000000",
      });
      expect(main.parentId).toBeUndefined();
      expect(token).toMatchObject({
        accountId: TOKEN_ACCOUNT_ID,
        assetId: USDC,
        balance: "2500000",
        parentId: ACCOUNT_ID,
      });
    });

    it("rejects an amount that is not decimal-encoded", async () => {
      syncingTo(account({ balance: { toFixed: () => "1.5e18" } }));
      await expect(source().balance(ref, undefined)).rejects.toThrow(/smallest unit/);
    });
  });

  describe("operations", () => {
    const operationsOf = async (synced: Account) => {
      syncingTo(synced);
      return (await source().operations(ref, undefined)).operations;
    };

    it("projects the fields the entity models, and nothing else", async () => {
      expect(await operationsOf(account({ operations: [operation()] }))).toEqual([
        {
          id: "op-1",
          accountId: ACCOUNT_ID,
          assetId: "ethereum",
          hash: "0xdead",
          type: "OUT",
          value: "1000",
          fee: "21",
          senders: ["0xabc"],
          recipients: ["0xdef"],
          blockHeight: 19_000_000,
          date: "2026-01-31T12:00:00.000Z",
        },
      ]);
    });

    it("keeps a pending operation, and carries hasFailed only when it was set", async () => {
      const rows = await operationsOf(
        account({
          operations: [
            operation({ id: "pending", blockHeight: undefined }),
            operation({ id: "failed", hasFailed: true, date: new Date("2026-01-30T00:00:00Z") }),
          ],
        }),
      );
      expect(rows[0]).toMatchObject({ id: "pending", blockHeight: null });
      expect(rows[0].hasFailed).toBeUndefined();
      expect(rows[1].hasFailed).toBe(true);
    });

    it("lifts sub and internal operations to sibling rows naming their parent, and drops NFTs", async () => {
      const rows = await operationsOf(
        account({
          operations: [
            operation({
              subOperations: [operation({ id: "sub-1", accountId: TOKEN_ACCOUNT_ID })],
              internalOperations: [operation({ id: "int-1" })],
              nftOperations: [operation({ id: "nft-1" })],
            }),
          ],
          subAccounts: [tokenAccount()],
        }),
      );
      expect(rows.map(row => [row.id, row.accountId, row.parentOperationId])).toEqual([
        ["int-1", ACCOUNT_ID, "op-1"],
        ["op-1", ACCOUNT_ID, undefined],
        ["sub-1", TOKEN_ACCOUNT_ID, "op-1"],
      ]);
    });

    it("walks the token accounts too, into one newest-first list", async () => {
      const rows = await operationsOf(
        account({
          operations: [operation({ id: "own-old", date: new Date("2026-01-01T00:00:00.000Z") })],
          subAccounts: [
            tokenAccount({
              operations: [
                operation({
                  id: "tok-new",
                  accountId: TOKEN_ACCOUNT_ID,
                  date: new Date("2026-02-01T00:00:00.000Z"),
                }),
              ],
            }),
          ],
        }),
      );
      expect(rows.map(row => row.id)).toEqual(["tok-new", "own-old"]);
    });

    it("keeps the nested copy of a token transfer listed in both places", async () => {
      const transfer = operation({ id: "sub-1", accountId: TOKEN_ACCOUNT_ID });
      const rows = await operationsOf(
        account({
          operations: [operation({ subOperations: [transfer] })],
          subAccounts: [tokenAccount({ operations: [transfer] })],
        }),
      );
      expect(rows.filter(row => row.id === "sub-1")).toHaveLength(1);
      expect(rows.find(row => row.id === "sub-1")?.parentOperationId).toBe("op-1");
    });

    it("rejects an amount that is not a whole smallest-unit value", async () => {
      syncingTo(account({ operations: [operation({ value: new BigNumber("1.5") })] }));
      await expect(source().operations(ref, undefined)).rejects.toThrow();
    });
  });
});
