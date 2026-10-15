import { of, Subject } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../mock/account";
import { fromLegacyAccount } from "../account/accountDescriptor";
import { createFullSyncSource, findAccountByDescriptor } from "./fullSyncSource";

const getAccountBridge = jest.fn(async (..._args: unknown[]): Promise<unknown> => ({}));
jest.mock("../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const ethereum = getCryptoCurrencyById("ethereum");

const account = genAccount("full-sync", {
  currency: ethereum,
  operationsSize: 3,
  subAccountsCount: 2,
});

const descriptor = fromLegacyAccount(account);

const target = { accountUUID: computeAccountUUID(descriptor), descriptor };

/** A bridge whose syncs stay pending until released, answering `synced`. */
function pendingBridge(synced: Account = account) {
  const subjects: Subject<(a: Account) => Account>[] = [];
  const sync = jest.fn(() => {
    const subject = new Subject<(a: Account) => Account>();
    subjects.push(subject);
    return subject.asObservable();
  });
  getAccountBridge.mockResolvedValue({ sync });
  const release = () => {
    for (const subject of subjects) {
      subject.next(() => synced);
      subject.complete();
    }
  };
  return { sync, release };
}

const source = (accounts: Account[] = [account]) =>
  createFullSyncSource({
    findAccount: each => findAccountByDescriptor(accounts, each),
    prepareCurrency: async () => undefined,
  });

beforeEach(() => jest.clearAllMocks());

describe("findAccountByDescriptor", () => {
  it("finds the legacy account a descriptor describes", () => {
    const other = genAccount("other", { currency: ethereum });
    expect(findAccountByDescriptor([other, account], descriptor)).toBe(account);
  });
});

describe("createFullSyncSource", () => {
  it("answers the native balance first, then one row per token account", async () => {
    getAccountBridge.mockResolvedValue({ sync: jest.fn(() => of(() => account)) });
    const rows = await source().read.balance(target);
    expect(rows).toEqual([
      {
        assetId: "ethereum",
        balance: account.balance.toFixed(),
        spendableBalance: account.spendableBalance.toFixed(),
      },
      ...(account.subAccounts ?? []).map(token => ({
        assetId: token.token.id,
        balance: token.balance.toFixed(),
        spendableBalance: token.spendableBalance.toFixed(),
      })),
    ]);
  });

  it("answers what the sync holds, newest first, without a next page nor a total", async () => {
    getAccountBridge.mockResolvedValue({ sync: jest.fn(() => of(() => account)) });
    const page = await source().read.operations(target);
    const dates = page.operations.map(operation => Date.parse(operation.date));
    expect(page.nextCursor).toBeUndefined();
    expect(page.total).toBeUndefined();
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(page.operations.length).toBeGreaterThanOrEqual(account.operations.length);
  });

  it("keeps two internal transfers of one transaction apart, even under one bridge id", async () => {
    const [parent] = account.operations;
    const internal = { ...parent, id: "same-id", type: "IN" as const };
    const synced = {
      ...account,
      operations: [{ ...parent, internalOperations: [internal, internal] }],
    };
    getAccountBridge.mockResolvedValue({ sync: jest.fn(() => of(() => synced)) });
    const page = await source([synced]).read.operations(target);
    const internals = page.operations.filter(each => each.parentOperationId === parent.id);
    expect(internals.map(each => each.id)).toEqual([
      `${parent.hash}-internal-0`,
      `${parent.hash}-internal-1`,
    ]);
  });

  it("keeps one copy of the internal transfers two parents of a transaction reference", async () => {
    const [parent] = account.operations;
    const internal = { ...parent, id: "same-id", type: "IN" as const };
    const out = { ...parent, id: "out", type: "OUT" as const, internalOperations: [internal] };
    const into = { ...parent, id: "in", type: "IN" as const, internalOperations: [internal] };
    const synced = { ...account, operations: [out, into] };
    getAccountBridge.mockResolvedValue({ sync: jest.fn(() => of(() => synced)) });
    const page = await source([synced]).read.operations(target);
    expect(page.operations.filter(each => each.id === `${parent.hash}-internal-0`)).toHaveLength(1);
  });

  it("shares one sync between a balance and an operations read of the account", async () => {
    const { sync, release } = pendingBridge();
    const reads = source();
    const both = Promise.all([reads.read.balance(target), reads.read.operations(target)]);
    await new Promise(resolve => setImmediate(resolve));
    release();
    await both;
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("fails when no stored account is described by the descriptor", async () => {
    await expect(source([]).read.balance(target)).rejects.toThrow(/No account in the store/);
  });
});
