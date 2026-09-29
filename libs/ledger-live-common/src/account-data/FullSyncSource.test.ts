import { Observable } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { FullSyncSource } from "./FullSyncSource";
import { getAccountBridge } from "../bridge";

jest.mock("../bridge", () => ({ getAccountBridge: jest.fn() }));

const account = {
  id: "js:2:bitcoin:xpub1:native_segwit",
  currency: { id: "bitcoin" },
  balance: { toFixed: () => "10" },
  spendableBalance: { toFixed: () => "9" },
  operations: [],
  subAccounts: [],
} as unknown as Account;

const makeSource = () => {
  const sync = jest.fn(
    () =>
      new Observable<(a: Account) => Account>(o => {
        o.next(a => a);
        o.complete();
      }),
  );
  jest.mocked(getAccountBridge).mockReturnValue({ sync } as never);
  const source = new FullSyncSource({ getAccount: () => account, prepareCurrency: async () => {} });
  return { source, sync };
};

const ref = { accountId: account.id } as never;

describe("FullSyncSource", () => {
  it("shares one sync between balances and operations requested together", async () => {
    const { source, sync } = makeSource();
    const [balances, ops] = await Promise.all([
      source.balance(ref, {}),
      source.operations(ref, {}),
    ]);
    expect(sync).toHaveBeenCalledTimes(1);
    expect(balances[0]?.balance).toBe("10");
    expect(ops.complete).toBe(true);
  });

  it("syncs again once the previous run settled", async () => {
    const { source, sync } = makeSource();
    await source.balance(ref, {});
    await source.balance(ref, {});
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it("rejects an already aborted caller without starting a sync", async () => {
    const { source, sync } = makeSource();
    const controller = new AbortController();
    controller.abort();
    await expect(source.balance(ref, {}, controller.signal)).rejects.toThrow("aborted");
    expect(sync).not.toHaveBeenCalled();
  });

  it("fails when the account is not in the store", async () => {
    const source = new FullSyncSource({
      getAccount: () => undefined,
      prepareCurrency: async () => {},
    });
    await expect(source.balance(ref, {})).rejects.toThrow("not in the store");
  });
});
