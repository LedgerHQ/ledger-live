import { getCryptoCurrencyById, setSupportedCurrencies } from "../currencies";
import { Account } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { accountPersistedStateChanged, accountsPersistedStateChanged } from "./persistence";

setSupportedCurrencies(["ethereum"]);

const Ethereum = getCryptoCurrencyById("ethereum");
type PrivateInfoTestShape = {
  ufvk: string;
  balance: Account["balance"];
  birthday: number;
  lastSyncTimestamp: number;
  lastSyncBlock: number;
  syncState: string;
  lastProcessedBlock: number;
  currentSync?: {
    state?: string;
    lastBlockDownloaded?: number;
    lastProcessedBlock?: number;
  };
  transactions?: unknown[];
};

type AccountWithPrivateInfo = Account & { privateInfo?: PrivateInfoTestShape };

const createPrivateInfo = (balance: Account["balance"]): PrivateInfoTestShape => ({
  ufvk: "ufvk-1",
  balance,
  birthday: 10,
  lastSyncTimestamp: 20,
  lastSyncBlock: 30,
  syncState: "synced",
  lastProcessedBlock: 40,
  currentSync: {
    state: "idle",
    lastBlockDownloaded: 41,
    lastProcessedBlock: 40,
  },
  transactions: [{ hash: "tx1" }],
});

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
      expect(accountPersistedStateChanged(withOneSub, withExtraSub as Account)).toBe(true);
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

    it("returns true when privateInfo exists only on one account", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const withPrivateInfo: AccountWithPrivateInfo = {
        ...base,
        privateInfo: createPrivateInfo(base.balance),
      };
      const withoutPrivateInfo: AccountWithPrivateInfo = { ...base, privateInfo: undefined };
      expect(accountPersistedStateChanged(withPrivateInfo, withoutPrivateInfo)).toBe(true);
      expect(accountPersistedStateChanged(withoutPrivateInfo, withPrivateInfo)).toBe(true);
    });

    it("returns false when privateInfo fields are identical", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const privateInfo = createPrivateInfo(base.balance);
      const prev: AccountWithPrivateInfo = { ...base, privateInfo };
      const next: AccountWithPrivateInfo = {
        ...base,
        privateInfo: {
          ...privateInfo,
          currentSync: { ...privateInfo.currentSync },
          transactions: [...(privateInfo.transactions ?? [])],
        },
      };
      expect(accountPersistedStateChanged(prev, next)).toBe(false);
    });

    it("returns true when privateInfo.ufvk differs", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const prev: AccountWithPrivateInfo = { ...base, privateInfo: createPrivateInfo(base.balance) };
      const next: AccountWithPrivateInfo = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), ufvk: "ufvk-2" },
      };
      expect(accountPersistedStateChanged(prev, next)).toBe(true);
    });

    it("returns true when privateInfo.balance differs", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const prev: AccountWithPrivateInfo = { ...base, privateInfo: createPrivateInfo(base.balance) };
      const next: AccountWithPrivateInfo = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance.plus(1)) },
      };
      expect(accountPersistedStateChanged(prev, next)).toBe(true);
    });

    it("returns true when privateInfo scalar fields differ", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const prev: AccountWithPrivateInfo = { ...base, privateInfo: createPrivateInfo(base.balance) };

      const nextBirthday = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), birthday: 999 },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextBirthday)).toBe(true);

      const nextLastSyncTimestamp = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), lastSyncTimestamp: 999 },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextLastSyncTimestamp)).toBe(true);

      const nextLastSyncBlock = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), lastSyncBlock: 999 },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextLastSyncBlock)).toBe(true);

      const nextSyncState = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), syncState: "syncing" },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextSyncState)).toBe(true);

      const nextLastProcessedBlock = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), lastProcessedBlock: 999 },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextLastProcessedBlock)).toBe(true);
    });

    it("returns true when privateInfo.currentSync fields differ", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const prev: AccountWithPrivateInfo = { ...base, privateInfo: createPrivateInfo(base.balance) };

      const nextState = {
        ...base,
        privateInfo: {
          ...createPrivateInfo(base.balance),
          currentSync: { ...createPrivateInfo(base.balance).currentSync, state: "syncing" },
        },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextState)).toBe(true);

      const nextLastBlockDownloaded = {
        ...base,
        privateInfo: {
          ...createPrivateInfo(base.balance),
          currentSync: { ...createPrivateInfo(base.balance).currentSync, lastBlockDownloaded: 999 },
        },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextLastBlockDownloaded)).toBe(true);

      const nextCurrentLastProcessedBlock = {
        ...base,
        privateInfo: {
          ...createPrivateInfo(base.balance),
          currentSync: { ...createPrivateInfo(base.balance).currentSync, lastProcessedBlock: 999 },
        },
      } as AccountWithPrivateInfo;
      expect(accountPersistedStateChanged(prev, nextCurrentLastProcessedBlock)).toBe(true);
    });

    it("returns true when privateInfo.transactions length differs", () => {
      const base = genAccount("seed", { currency: Ethereum }) as AccountWithPrivateInfo;
      const prev: AccountWithPrivateInfo = { ...base, privateInfo: createPrivateInfo(base.balance) };
      const next: AccountWithPrivateInfo = {
        ...base,
        privateInfo: { ...createPrivateInfo(base.balance), transactions: [] },
      };
      expect(accountPersistedStateChanged(prev, next)).toBe(true);
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
