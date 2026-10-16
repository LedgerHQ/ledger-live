import { of, throwError } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { genAccount } from "../../mock/account";
import { syncLegacyAccount } from "./syncLegacyAccount";

const getAccountBridge = jest.fn(async (..._args: unknown[]): Promise<unknown> => ({}));
jest.mock("../../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const account = genAccount("full-sync", { currency: getCryptoCurrencyById("ethereum") });

beforeEach(() => jest.clearAllMocks());

describe("syncLegacyAccount", () => {
  it("folds every update of the bridge sync onto the account", async () => {
    const first = { ...account, blockHeight: account.blockHeight + 1 };
    const sync = jest.fn(() =>
      of(
        () => first,
        (a: Account) => ({ ...a, blockHeight: a.blockHeight + 1 }),
      ),
    );
    getAccountBridge.mockResolvedValue({ sync });
    const synced = await syncLegacyAccount(account, {
      prepareCurrency: async () => undefined,
      blacklistedTokenIds: ["blacklisted"],
    });
    expect(synced.blockHeight).toBe(account.blockHeight + 2);
    expect(sync).toHaveBeenCalledWith(account, {
      paginationConfig: {},
      blacklistedTokenIds: ["blacklisted"],
    });
  });

  it("prepares the currency before getting the bridge", async () => {
    const calls: string[] = [];
    getAccountBridge.mockImplementation(async () => {
      calls.push("bridge");
      return { sync: () => of(() => account) };
    });
    await syncLegacyAccount(account, {
      prepareCurrency: async () => {
        calls.push("prepare");
      },
      blacklistedTokenIds: [],
    });
    expect(calls).toEqual(["prepare", "bridge"]);
  });

  it("fails as the bridge sync fails", async () => {
    getAccountBridge.mockResolvedValue({ sync: () => throwError(() => new Error("network")) });
    await expect(
      syncLegacyAccount(account, {
        prepareCurrency: async () => undefined,
        blacklistedTokenIds: [],
      }),
    ).rejects.toThrow("network");
  });
});
