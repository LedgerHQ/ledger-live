import { getCryptoCurrencyById, setSupportedCurrencies } from "../currencies";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { accountPersistedStateChanged, accountsPersistedStateChanged } from "./persistence";

setSupportedCurrencies(["ethereum"]);

const Ethereum = getCryptoCurrencyById("ethereum");

describe("account persistence predicates", () => {
  describe("accountPersistedStateChanged", () => {
    it("returns false when only lastSyncDate changed", () => {
      const account = genAccount("seed", { currency: Ethereum });
      const sameWithNewLastSync = {
        ...account,
        lastSyncDate: new Date(account.lastSyncDate.getTime() + 60000),
      };
      expect(accountPersistedStateChanged(account, sameWithNewLastSync)).toBe(false);
    });

    it("returns true when balance changed", () => {
      const account = genAccount("seed", { currency: Ethereum });
      const withDifferentBalance = {
        ...account,
        balance: account.balance.plus(1),
        spendableBalance: account.spendableBalance.plus(1),
      };
      expect(accountPersistedStateChanged(account, withDifferentBalance)).toBe(true);
    });

    it("returns true when operationsCount changed", () => {
      const account = genAccount("seed", { currency: Ethereum, operationsSize: 2 });
      const withDifferentOpsCount = { ...account, operationsCount: account.operationsCount + 1 };
      expect(accountPersistedStateChanged(account, withDifferentOpsCount)).toBe(true);
    });

    it("returns false when only blockHeight changed (not a persistence trigger)", () => {
      const account = genAccount("seed", { currency: Ethereum });
      const withDifferentBlockHeight = { ...account, blockHeight: account.blockHeight + 1 };
      expect(accountPersistedStateChanged(account, withDifferentBlockHeight)).toBe(false);
    });

    it("returns true when subAccounts length changed", () => {
      const account = genAccount("seed", { currency: Ethereum, subAccountsCount: 0 });
      const withOneSub = { ...account, subAccounts: account.subAccounts ?? [] };
      const withExtraSub = {
        ...account,
        subAccounts: [...(account.subAccounts ?? []), { ...account, id: account.id + "+token" }],
      };
      expect(accountPersistedStateChanged(withOneSub, withExtraSub)).toBe(true);
    });

    it("returns false when same account (reference equality)", () => {
      const account = genAccount("seed", { currency: Ethereum });
      expect(accountPersistedStateChanged(account, account)).toBe(false);
    });

    it("returns true when ids differ (different accounts)", () => {
      const a = genAccount("seed1", { currency: Ethereum });
      const b = genAccount("seed2", { currency: Ethereum });
      expect(accountPersistedStateChanged(a, b)).toBe(true);
    });
  });

  describe("accountsPersistedStateChanged", () => {
    it("returns false when lists are same and no persisted state changed", () => {
      const account = genAccount("seed", { currency: Ethereum });
      const list = [account];
      const sameList = [{ ...account, lastSyncDate: new Date() }];
      expect(accountsPersistedStateChanged(list, sameList)).toBe(false);
    });

    it("returns true when list length differs (new account)", () => {
      const a = genAccount("seed1", { currency: Ethereum });
      const b = genAccount("seed2", { currency: Ethereum });
      expect(accountsPersistedStateChanged([a], [a, b])).toBe(true);
    });

    it("returns true when list length differs (removed account)", () => {
      const a = genAccount("seed1", { currency: Ethereum });
      const b = genAccount("seed2", { currency: Ethereum });
      expect(accountsPersistedStateChanged([a, b], [a])).toBe(true);
    });

    it("returns true when an account has persisted state changed", () => {
      const a = genAccount("seed1", { currency: Ethereum });
      const b = genAccount("seed2", { currency: Ethereum });
      const bWithNewBalance = { ...b, balance: b.balance.plus(1) };
      expect(accountsPersistedStateChanged([a, b], [a, bWithNewBalance])).toBe(true);
    });

    it("returns true when account id is new (not in old list)", () => {
      const a = genAccount("seed1", { currency: Ethereum });
      const b = genAccount("seed2", { currency: Ethereum });
      const c = genAccount("seed3", { currency: Ethereum });
      expect(accountsPersistedStateChanged([a, b], [a, c])).toBe(true);
    });
  });
});
