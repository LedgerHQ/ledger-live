import BigNumber from "bignumber.js";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAccountOperationPage, syncAccountOperations } from "./operations";

const listOperations = jest.fn();
const syncAccountOnce = jest.fn();
const getTokenFromAsset = jest.fn();
const adaptCoreOperationToLiveOperation = jest.fn();

jest.mock("../bridge/generic-coin-framework/api/index", () => ({
  getCoinModuleApi: jest.fn(async () => ({
    listOperations: (...args: unknown[]) => listOperations(...args),
  })),
}));
jest.mock("../bridge/generic-coin-framework/accountRawAssign", () => ({
  getAccountRawAssignHooks: jest.fn(async () => ({ fromOperationExtraRaw: undefined })),
}));
jest.mock("../bridge/generic-coin-framework/bridge", () => ({
  getBridgeApi: jest.fn(async () => ({
    getTokenFromAsset: (...args: unknown[]) => getTokenFromAsset(...args),
  })),
}));
jest.mock("../bridge/generic-coin-framework/utils", () => ({
  adaptCoreOperationToLiveOperation: (...args: unknown[]) =>
    adaptCoreOperationToLiveOperation(...args),
}));
jest.mock("./fullSync", () => ({
  syncAccountOnce: (...args: unknown[]) => syncAccountOnce(...args),
}));

const ACCOUNT_ID = "js:2:ethereum:0xabc:";

const liveOperation = (id: string) => ({
  id,
  hash: `0x${id}`,
  accountId: ACCOUNT_ID,
  type: "IN",
  value: new BigNumber("1000"),
  fee: new BigNumber("21"),
  senders: ["0xdef"],
  recipients: ["0xabc"],
  blockHeight: 19_000_000,
  date: new Date("2026-01-31T12:00:00.000Z"),
  extra: {},
});

/** A core operation as a module reports it: native unless an asset is passed. */
const core = (id: string, asset: { type: string } = { type: "native" }) => ({ id, asset });

const read = (over: { cursor?: string; limit?: number } = {}) =>
  getAccountOperationPage({
    accountId: ACCOUNT_ID,
    currencyId: "ethereum",
    address: "0xabc",
    ...over,
  });

beforeEach(() => {
  jest.clearAllMocks();
  getTokenFromAsset.mockResolvedValue({ id: "ethereum/erc20/usd__coin" });
  adaptCoreOperationToLiveOperation.mockImplementation((accountId, coreOperation) => ({
    ...liveOperation(String(coreOperation.id)),
    accountId,
  }));
});

describe("getAccountOperationPage", () => {
  it("reads exactly one page — it does not walk the cursor chain", async () => {
    listOperations.mockResolvedValue({ items: [core("op-1"), core("op-2")], next: "c1" });
    const page = await read();

    expect(listOperations).toHaveBeenCalledTimes(1);
    expect(page.operations.map(o => o.id)).toEqual(["op-1", "op-2"]);
    expect(page.nextCursor).toBe("c1");
    expect(page.complete).toBe(false);
  });

  it("passes the cursor, the limit and a descending order to the module", async () => {
    listOperations.mockResolvedValue({ items: [], next: undefined });
    await read({ cursor: "c1", limit: 25 });

    expect(listOperations).toHaveBeenCalledWith(expect.anything(), "0xabc", {
      minHeight: 0,
      cursor: "c1",
      limit: 25,
      order: "desc",
    });
  });

  it("treats an empty-string cursor as the end of the stream", async () => {
    // Several modules send "" rather than omitting `next`; a truthiness check is what makes this
    // page the last one instead of an infinite resume.
    listOperations.mockResolvedValue({ items: [core("op-1")], next: "" });
    const page = await read();
    expect(page.nextCursor).toBeUndefined();
    expect(page.complete).toBe(true);
  });

  it("never reports a total — one page cannot know how many operations exist", async () => {
    listOperations.mockResolvedValue({ items: [core("op-1")], next: "c1" });
    expect((await read()).total).toBeUndefined();
  });

  it("flattens what a single core operation carried", async () => {
    listOperations.mockResolvedValue({ items: [core("op-1")], next: undefined });
    adaptCoreOperationToLiveOperation.mockImplementation(accountId => ({
      ...liveOperation("op-1"),
      accountId,
      internalOperations: [{ ...liveOperation("int-1"), accountId }],
    }));

    const page = await read();
    expect(page.operations.map(o => o.id)).toEqual(["op-1", "int-1"]);
    expect(page.operations[1].parentOperationId).toBe("op-1");
  });

  it("keys a token transfer onto the token account, as the full sync does", async () => {
    // Without this the granular source would leave every token account's history empty while the
    // legacy one filled it — the parity break this slice exists to surface.
    listOperations.mockResolvedValue({
      items: [core("op-1", { type: "erc20" })],
      next: undefined,
    });

    const [row] = (await read()).operations;
    expect(row.assetId).toBe("ethereum/erc20/usd__coin");
    expect(row.accountId).not.toBe(ACCOUNT_ID);
    expect(row.accountId.startsWith(ACCOUNT_ID)).toBe(true);
  });

  it("drops an operation whose asset the family cannot name", async () => {
    listOperations.mockResolvedValue({
      items: [core("op-1", { type: "erc20" })],
      next: undefined,
    });
    getTokenFromAsset.mockResolvedValue(undefined);
    expect((await read()).operations).toEqual([]);
  });

  it("propagates a module failure rather than reporting an empty history", async () => {
    listOperations.mockRejectedValue(new Error("indexer down"));
    await expect(read()).rejects.toThrow("indexer down");
  });
});

describe("syncAccountOperations", () => {
  const syncedAccount = {
    id: ACCOUNT_ID,
    currency: { id: "ethereum" },
    operations: [liveOperation("op-1"), liveOperation("op-2")],
    subAccounts: [],
  } as unknown as Account;

  const bridge = { sync: jest.fn() } as unknown as Pick<AccountBridge<TransactionCommon>, "sync">;

  it("reports the whole history as complete, with a total the paginated source cannot give", async () => {
    syncAccountOnce.mockResolvedValue(syncedAccount);

    const page = await syncAccountOperations({ account: syncedAccount, bridge });

    expect(page.operations.map(o => o.id)).toEqual(["op-1", "op-2"]);
    expect(page.complete).toBe(true);
    expect(page.total).toBe(2);
    expect(page.nextCursor).toBeUndefined();
  });

  it("forwards the abort signal and the hidden tokens to the sync", async () => {
    syncAccountOnce.mockResolvedValue({ ...syncedAccount, operations: [] });
    const controller = new AbortController();

    await syncAccountOperations({
      account: syncedAccount,
      bridge,
      blacklistedTokenIds: ["ethereum/erc20/scam"],
      signal: controller.signal,
    });

    expect(syncAccountOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        blacklistedTokenIds: ["ethereum/erc20/scam"],
        signal: controller.signal,
      }),
    );
  });
});
