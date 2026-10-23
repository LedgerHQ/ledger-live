import { Subject, concat, of, throwError } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { syncLegacyAccount } from "./syncLegacyAccount";

const getAccountBridge = jest.fn(async (..._args: unknown[]): Promise<unknown> => ({}));
jest.mock("../../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const account = genAccount("full-sync", { currency: getCryptoCurrencyById("ethereum") });

const updateAccountWithUpdater = jest.fn();
const first = (a: Account) => ({ ...a, blockHeight: a.blockHeight + 1 });
const second = (a: Account) => ({ ...a, blockHeight: a.blockHeight + 2 });

const options = (overrides: Partial<Parameters<typeof syncLegacyAccount>[1]> = {}) => ({
  prepareCurrency: async () => undefined,
  blacklistedTokenIds: [],
  updateAccountWithUpdater,
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe("syncLegacyAccount", () => {
  it("applies every update of the bridge sync to the store", async () => {
    const sync = jest.fn(() => of(first, second));
    getAccountBridge.mockResolvedValue({ sync });
    await syncLegacyAccount(account, options({ blacklistedTokenIds: ["blacklisted"] }));
    expect(updateAccountWithUpdater.mock.calls).toEqual([
      [account.id, first],
      [account.id, second],
    ]);
    expect(sync).toHaveBeenCalledWith(account, {
      paginationConfig: {},
      blacklistedTokenIds: ["blacklisted"],
    });
  });

  it("prepares the currency before getting the bridge", async () => {
    const calls: string[] = [];
    getAccountBridge.mockImplementation(async () => {
      calls.push("bridge");
      return { sync: () => of() };
    });
    await syncLegacyAccount(
      account,
      options({
        prepareCurrency: async () => {
          calls.push("prepare");
        },
      }),
    );
    expect(calls).toEqual(["prepare", "bridge"]);
  });

  it("shares one sync between concurrent callers of the account", async () => {
    const updates = new Subject<(a: Account) => Account>();
    const sync = jest.fn(() => updates);
    getAccountBridge.mockResolvedValue({ sync });
    const one = syncLegacyAccount(account, options());
    const other = syncLegacyAccount(account, options());
    await new Promise(resolve => setTimeout(resolve, 0));
    updates.complete();
    await Promise.all([one, other]);
    expect(sync).toHaveBeenCalledTimes(1);

    await syncLegacyAccount(account, options());
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it("skips an account whose last sync completed within max age", async () => {
    const fresh = { ...account, id: "fresh" };
    const sync = jest.fn(() => of(first));
    getAccountBridge.mockResolvedValue({ sync });
    await syncLegacyAccount(fresh, options());
    await syncLegacyAccount(fresh, options(), 60_000);
    expect(sync).toHaveBeenCalledTimes(1);
    await syncLegacyAccount(fresh, options());
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it("joins the sync in flight rather than answering from its first updates", async () => {
    const streaming = { ...account, id: "streaming" };
    getAccountBridge.mockResolvedValue({ sync: () => of(first) });
    await syncLegacyAccount(streaming, options());
    const updates = new Subject<(a: Account) => Account>();
    getAccountBridge.mockResolvedValue({ sync: () => updates });
    const background = syncLegacyAccount(streaming, options());
    let read = false;
    const reading = syncLegacyAccount(streaming, options(), 60_000).then(() => {
      read = true;
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    updates.next(first);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(read).toBe(false);
    updates.complete();
    await Promise.all([background, reading]);
    expect(read).toBe(true);
  });

  it("does not count a failed sync as fresh", async () => {
    const failing = { ...account, id: "failing" };
    getAccountBridge.mockResolvedValue({ sync: () => throwError(() => new Error("network")) });
    await expect(syncLegacyAccount(failing, options())).rejects.toThrow("network");
    const sync = jest.fn(() => of(first));
    getAccountBridge.mockResolvedValue({ sync });
    await syncLegacyAccount(failing, options(), 60_000);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("does not count an earlier sync as fresh once a resync failed after a partial update", async () => {
    const resynced = { ...account, id: "resynced" };
    getAccountBridge.mockResolvedValue({ sync: () => of(first) });
    await syncLegacyAccount(resynced, options());
    getAccountBridge.mockResolvedValue({
      sync: () =>
        concat(
          of(second),
          throwError(() => new Error("network")),
        ),
    });
    await expect(syncLegacyAccount(resynced, options())).rejects.toThrow("network");
    const sync = jest.fn(() => of(first));
    getAccountBridge.mockResolvedValue({ sync });
    await syncLegacyAccount(resynced, options(), 60_000);
    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("syncs again when the clock moved back since the last sync", async () => {
    const moved = { ...account, id: "moved" };
    const sync = jest.fn(() => of(first));
    getAccountBridge.mockResolvedValue({ sync });
    await syncLegacyAccount(moved, options());
    jest.spyOn(Date, "now").mockReturnValueOnce(Date.now() - 1000);
    await syncLegacyAccount(moved, options(), 60_000);
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it("fails, and lets the next sync run, when the store rejects an update", async () => {
    const sync = jest.fn(() => of(first));
    getAccountBridge.mockResolvedValue({ sync });
    const throwing = options({
      updateAccountWithUpdater: () => {
        throw new Error("reducer");
      },
    });
    await expect(syncLegacyAccount(account, throwing)).rejects.toThrow("reducer");
    await syncLegacyAccount(account, options());
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it("fails as the bridge sync fails", async () => {
    getAccountBridge.mockResolvedValue({ sync: () => throwError(() => new Error("network")) });
    await expect(syncLegacyAccount(account, options())).rejects.toThrow("network");
  });
});
