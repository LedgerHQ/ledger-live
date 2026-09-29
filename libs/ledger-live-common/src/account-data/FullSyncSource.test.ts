import BigNumber from "bignumber.js";
import { Subject } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { createAccountDataRouter } from "@domain/api-account-data-source";
import { AccountRefSchema } from "@domain/entity-account";
import { FullSyncSource } from "./FullSyncSource";

const getAccountBridge = jest.fn();
jest.mock("../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const legacyAccount = {
  id: "js:2:bitcoin:xpub:native_segwit",
  currency: { id: "bitcoin" },
  balance: new BigNumber("7"),
  spendableBalance: new BigNumber("5"),
  subAccounts: [],
  operations: [],
} as unknown as Account;

const ref = AccountRefSchema.parse({
  accountId: legacyAccount.id,
  currencyId: "bitcoin",
  address: "xpub",
  derivationMode: "native_segwit",
});

function pendingBridge() {
  const subjects: Subject<(a: Account) => Account>[] = [];
  const sync = jest.fn(() => {
    const subject = new Subject<(a: Account) => Account>();
    subjects.push(subject);
    return subject.asObservable();
  });
  const release = () => {
    for (const subject of subjects) {
      subject.next(a => a);
      subject.complete();
    }
  };
  return { bridge: { sync }, sync, release };
}

const prepareCurrency = jest.fn(async () => undefined);

const source = (accounts: Account[] = [legacyAccount]) =>
  new FullSyncSource({
    getAccount: id => accounts.find(account => account.id === id),
    prepareCurrency,
  });

beforeEach(() => jest.clearAllMocks());

describe("FullSyncSource", () => {
  it("supports a known currency whose account is in the store", () => {
    expect(source().supports(ref)).toBe(true);
    expect(source([]).supports(ref)).toBe(false);
    expect(source().supports({ ...ref, currencyId: "not-a-currency" })).toBe(false);
  });

  it("serves balance and operations read together with a single bridge.sync", async () => {
    const { bridge, sync, release } = pendingBridge();
    getAccountBridge.mockResolvedValue(bridge);
    const router = createAccountDataRouter([source()]);

    const both = Promise.all([router.read("balance", ref), router.read("operations", ref)]);
    await new Promise(resolve => setImmediate(resolve));
    release();
    const [balance, operations] = await both;

    expect(sync).toHaveBeenCalledTimes(1);
    expect(balance.sourceId).toBe("full-sync");
    expect(balance.data[0]).toMatchObject({ balance: "7", spendableBalance: "5" });
    expect(operations.data).toEqual({ operations: [], complete: true, total: 0 });
  });

  it("prepares the currency before syncing", async () => {
    const { bridge, release } = pendingBridge();
    getAccountBridge.mockResolvedValue(bridge);
    const read = source().balance(ref, undefined);
    await new Promise(resolve => setImmediate(resolve));
    release();
    await read;
    expect(prepareCurrency).toHaveBeenCalledWith(legacyAccount.currency);
  });

  it("fails when the account left the store between supports and the read", async () => {
    await expect(source([]).balance(ref, undefined)).rejects.toThrow(/not in the store/);
  });

  it("rejects before syncing when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(source().operations(ref, undefined, controller.signal)).rejects.toThrow(
      /aborted before/,
    );
    expect(getAccountBridge).not.toHaveBeenCalled();
  });
});
