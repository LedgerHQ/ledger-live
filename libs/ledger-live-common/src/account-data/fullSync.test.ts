import BigNumber from "bignumber.js";
import { of, Subject } from "rxjs";
import type { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { syncAccountOnce } from "./fullSync";
import { syncAccountOperations } from "./operations";
import { syncAccountBalanceRows } from "../bridge/generic-coin-framework/accountBalances";

const account = (id = "js:2:ethereum:0xabc:") => ({ id, currency: { id: "ethereum" } }) as Account;

const countingBridge = () => {
  let calls = 0;
  const bridge = {
    sync: () => {
      calls++;
      return of((a: Account) => a);
    },
  } as unknown as Pick<AccountBridge<TransactionCommon>, "sync">;
  return { bridge, calls: () => calls };
};

const pendingBridge = () => {
  let calls = 0;
  const subjects: Subject<(a: Account) => Account>[] = [];
  const bridge = {
    sync: () => {
      calls++;
      const subject = new Subject<(a: Account) => Account>();
      subjects.push(subject);
      return subject.asObservable();
    },
  } as unknown as Pick<AccountBridge<TransactionCommon>, "sync">;
  const release = () => {
    for (const subject of subjects) {
      subject.next(a => a);
      subject.complete();
    }
  };
  return { bridge, calls: () => calls, release };
};

describe("syncAccountOnce", () => {
  it("syncs the account and returns the reduced result", async () => {
    const { bridge, calls } = countingBridge();
    const synced = await syncAccountOnce({ account: account(), bridge });
    expect(calls()).toBe(1);
    expect(synced).toMatchObject({ id: "js:2:ethereum:0xabc:" });
  });

  it("runs one sync for two concurrent callers on the same account", async () => {
    const { bridge, calls, release } = pendingBridge();
    const both = Promise.all([
      syncAccountOnce({ account: account(), bridge }),
      syncAccountOnce({ account: account(), bridge }),
    ]);
    release();
    const [a, b] = await both;

    expect(calls()).toBe(1);
    expect(a).toBe(b);
  });

  it("does not share between different accounts", async () => {
    const { bridge, calls, release } = pendingBridge();
    const both = Promise.all([
      syncAccountOnce({ account: account("js:2:ethereum:0xaaa:"), bridge }),
      syncAccountOnce({ account: account("js:2:ethereum:0xbbb:"), bridge }),
    ]);
    release();
    await both.catch(() => undefined);
    expect(calls()).toBe(2);
  });

  it("does not share between callers filtering different tokens", async () => {
    const { bridge, calls, release } = pendingBridge();
    const both = Promise.all([
      syncAccountOnce({ account: account(), bridge, blacklistedTokenIds: [] }),
      syncAccountOnce({ account: account(), bridge, blacklistedTokenIds: ["ethereum/erc20/scam"] }),
    ]);
    release();
    await both.catch(() => undefined);
    expect(calls()).toBe(2);
  });

  it("starts a fresh sync once the shared one has settled", async () => {
    const { bridge, calls } = countingBridge();
    await syncAccountOnce({ account: account(), bridge });
    await syncAccountOnce({ account: account(), bridge });
    expect(calls()).toBe(2);
  });

  it("rejects before starting when the signal is already aborted", async () => {
    const { bridge, calls } = countingBridge();
    const controller = new AbortController();
    controller.abort();
    await expect(
      syncAccountOnce({ account: account(), bridge, signal: controller.signal }),
    ).rejects.toThrow(/aborted before/);
    expect(calls()).toBe(0);
  });

  it("one caller's abort does not take the shared sync down with it", async () => {
    const { bridge, release } = pendingBridge();
    const controller = new AbortController();
    const aborted = syncAccountOnce({ account: account(), bridge, signal: controller.signal });
    const other = syncAccountOnce({ account: account(), bridge });

    controller.abort();
    await expect(aborted).rejects.toThrow(/aborted/);

    release();
    await expect(other).resolves.toMatchObject({ id: "js:2:ethereum:0xabc:" });
  });
});

describe("the two slices, one legacy family", () => {
  const legacyAccount = {
    id: "js:2:bitcoin:xpub:native_segwit",
    currency: { id: "bitcoin" },
    balance: new BigNumber("7"),
    spendableBalance: new BigNumber("7"),
    subAccounts: [],
    operations: [],
  } as unknown as Account;

  it("pulls balance and operations with a single bridge.sync", async () => {
    const { bridge, calls, release } = pendingBridge();

    const both = Promise.all([
      syncAccountBalanceRows({ account: legacyAccount, bridge }),
      syncAccountOperations({ account: legacyAccount, bridge }),
    ]);
    release();
    const [balances, operations] = await both;

    expect(calls()).toBe(1);
    expect(balances).toHaveLength(1);
    expect(operations.complete).toBe(true);
  });
});
