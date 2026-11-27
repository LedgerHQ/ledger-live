import type { Account, AccountLike, Operation, TokenAccount } from "@ledgerhq/types-live";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import type { AccountNamesState } from "@domain/entity-account-name";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";
import { serializeAccount } from "@ledgerhq/wallet-api-core";
import { defaultBridgeExtensions } from "../bridge/defaultBridgeExtensions";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";
import type { Transaction } from "../coin-modules/transaction-types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "../bridge";
import {
  accountToWalletAPIAccount,
  currencyToWalletAPICurrency,
  getWalletAPITransactionSignFlowInfos,
  resolveWalletApiSpendableBalance,
  resolveWalletApiMaxSpendable,
} from "./converters";
import type { WalletAPITransaction } from "./types";

const walletState: AccountNamesState = new Map();

const makeMainAccount = (id: string, readiness?: Account["readiness"]): Account => ({
  ...(genAccount(id, { currency: getCryptoCurrencyById("ethereum") }) as Account),
  readiness,
});

const makeTokenAccount = (parentAccount: Account): TokenAccount =>
  genTokenAccount(0, parentAccount, mockTokenCurrency()) as TokenAccount;

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
const zcashBridge = jest.fn();
jest.mock("../coin-modules/registry", () => ({
  isCoinModuleRegistered: () => true,
  loadWalletApiAdapterForFamily: (family: string) => {
    switch (family) {
      case "evm":
        return { getWalletAPITransactionSignFlowInfos: () => evmBridge() };
      case "bitcoin":
        return { getWalletAPITransactionSignFlowInfos: () => bitcoinBridge() };
      case "zcash":
        return { getWalletAPITransactionSignFlowInfos: () => zcashBridge() };
      default:
        return undefined;
    }
  },
}));

jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));

const mockLog = jest.mocked(log);
const mockGetAccountBridge = jest.mocked(getAccountBridge);

describe("getWalletAPITransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
    zcashBridge.mockClear();
  });

  // A live app names Zcash's currency family, "bitcoin"; coin-zcash serves the account.
  it.each(["zcash", "zcash_testnet"])(
    "uses the zcash adapter for a bitcoin-family transaction on a %s account",
    async currencyId => {
      await getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: { family: "bitcoin", amount: new BigNumber(1), recipient: "t1" },
        account: { type: "Account", currency: getCryptoCurrencyById(currencyId) } as Account,
      });

      expect(zcashBridge).toHaveBeenCalledTimes(1);
      expect(bitcoinBridge).not.toHaveBeenCalled();
    },
  );

  it("keeps the adapter of another family's transaction on a zcash account", async () => {
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: { family: "ethereum", amount: new BigNumber(1), recipient: "0x01" },
      account: { type: "Account", currency: getCryptoCurrencyById("zcash") } as Account,
    });

    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(zcashBridge).not.toHaveBeenCalled();
  });

  it("keeps the bitcoin adapter for a bitcoin account", async () => {
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: { family: "bitcoin", amount: new BigNumber(1), recipient: "bc1" },
      account: { type: "Account", currency: getCryptoCurrencyById("bitcoin") } as Account,
    });

    expect(bitcoinBridge).toHaveBeenCalledTimes(1);
    expect(zcashBridge).not.toHaveBeenCalled();
  });

  it("should call the bridge if the implementation exists", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "bitcoin",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(bitcoinBridge).toHaveBeenCalledTimes(1);
    expect(evmBridge).toHaveBeenCalledTimes(0);
  });

  it("should call the evm bridge for WalletAPITransaction tx of ethereum family", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "ethereum",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
  });

  it("should use its fallback if the bridge doesn't exist", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "algorand",
      mode: "send",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    const expectedLiveTx: Partial<Transaction> = {
      family: tx.family,
      mode: "send",
      amount: tx.amount,
      recipient: tx.recipient,
    };

    // When
    const { canEditFees, hasFeesProvided, liveTx } = await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(0);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});

describe("resolveWalletApiSpendableBalance", () => {
  const account = { spendableBalance: new BigNumber(100) } as AccountLike;

  beforeEach(() => {
    mockGetAccountBridge.mockReset();
    mockLog.mockClear();
  });

  it("returns the bridge's getWalletApiSpendableBalance result", async () => {
    // Given
    const bridgeSpendableBalance = new BigNumber(42);

    mockGetAccountBridge.mockResolvedValue({
      getWalletApiSpendableBalance: jest.fn().mockReturnValue(bridgeSpendableBalance),
    } as never);

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(bridgeSpendableBalance);
  });

  it("falls back to account.spendableBalance when the bridge returns undefined", async () => {
    // Given
    mockGetAccountBridge.mockResolvedValue({
      getWalletApiSpendableBalance: jest.fn().mockReturnValue(undefined),
    } as never);

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(account.spendableBalance);
  });

  it("falls back to account.spendableBalance and logs when the bridge lookup fails", async () => {
    // Given
    mockGetAccountBridge.mockRejectedValue(new Error("unsupported family"));

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(account.spendableBalance);
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("falling back to account.spendableBalance"),
      { error: "unsupported family" },
    );
  });
});

const pendingOut = (value: number, fee: number) =>
  ({ type: "OUT", value: new BigNumber(value), fee: new BigNumber(fee) }) as Operation;

const makeAccountWithPending = (
  type: AccountLike["type"],
  pendingOperations: Operation[],
): AccountLike =>
  ({ type, spendableBalance: new BigNumber(100), pendingOperations }) as AccountLike;

describe("resolveWalletApiMaxSpendable", () => {
  const account = { spendableBalance: new BigNumber(100) } as AccountLike;

  const mockEstimateBridge = (
    maxSpendable: BigNumber,
    getWalletApiSpendableBalance: (account: AccountLike) => BigNumber | undefined = ({
      spendableBalance,
    }) => spendableBalance,
  ) => {
    mockGetAccountBridge.mockResolvedValue({
      estimateMaxSpendable: jest.fn().mockResolvedValue(maxSpendable),
      getWalletApiSpendableBalance,
    } as never);
  };

  beforeEach(() => {
    mockGetAccountBridge.mockReset();
    mockLog.mockClear();
  });

  it("returns the bridge's estimateMaxSpendable result", async () => {
    const maxSpendable = new BigNumber(42);

    mockEstimateBridge(maxSpendable);

    const result = await resolveWalletApiMaxSpendable(account);

    expect(result).toEqual(maxSpendable);
  });

  it("returns undefined and logs when the bridge lookup fails", async () => {
    mockGetAccountBridge.mockRejectedValue(new Error("unsupported family"));

    const result = await resolveWalletApiMaxSpendable(account);

    expect(result).toBeUndefined();
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("omitting maxSpendable"),
      { error: "unsupported family" },
    );
  });

  it("returns undefined and logs when estimateMaxSpendable rejects", async () => {
    mockGetAccountBridge.mockResolvedValue({
      estimateMaxSpendable: jest.fn().mockRejectedValue(new Error("estimation failed")),
    } as never);

    const result = await resolveWalletApiMaxSpendable(account);

    expect(result).toBeUndefined();
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("omitting maxSpendable"),
      { error: "estimation failed" },
    );
  });

  it("keeps a zero estimate when the account spendable balance is already zero", async () => {
    const emptyAccount = { spendableBalance: new BigNumber(0) } as AccountLike;

    mockEstimateBridge(new BigNumber(0));

    const result = await resolveWalletApiMaxSpendable(emptyAccount);

    expect(result).toEqual(new BigNumber(0));
    expect(mockLog).not.toHaveBeenCalled();
  });

  it("omits a zero estimate when the account still has a spendable balance", async () => {
    mockEstimateBridge(new BigNumber(0));

    const result = await resolveWalletApiMaxSpendable(account);

    expect(result).toBeUndefined();
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("omitting ambiguous zero maxSpendable"),
      { walletApiSpendableBalance: "100", pendingSpent: "0" },
    );
  });

  it("falls back to the account spendable balance when the bridge reports none", async () => {
    mockEstimateBridge(new BigNumber(0), () => undefined);

    const result = await resolveWalletApiMaxSpendable(account);

    expect(result).toBeUndefined();
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("omitting ambiguous zero maxSpendable"),
      { walletApiSpendableBalance: "100", pendingSpent: "0" },
    );
  });

  describe("filters", () => {
    const rows = [
      { value: new BigNumber(100), locked: new BigNumber(40), pool: "transparent" },
      { value: new BigNumber(500), pool: "ironwood", private: true },
    ];
    const filteredAccount = { spendableBalance: new BigNumber(600), balances: rows } as AccountLike;

    const bridgeWith = (maxSpendable: BigNumber) => {
      const estimateMaxSpendable = jest.fn().mockResolvedValue(maxSpendable);
      mockGetAccountBridge.mockResolvedValue({
        estimateMaxSpendable,
        getWalletApiSpendableBalance: () => new BigNumber(600),
      } as never);
      return estimateMaxSpendable;
    };

    it("forwards the filters to the bridge", async () => {
      const estimateMaxSpendable = bridgeWith(new BigNumber(42));
      const filters = { pools: ["transparent"] };

      const result = await resolveWalletApiMaxSpendable(filteredAccount, undefined, filters);

      expect(result).toEqual(new BigNumber(42));
      expect(estimateMaxSpendable).toHaveBeenCalledWith({
        account: filteredAccount,
        parentAccount: undefined,
        filters,
      });
    });

    it("calls the bridge without a filters key when there is none", async () => {
      const estimateMaxSpendable = bridgeWith(new BigNumber(42));

      await resolveWalletApiMaxSpendable(filteredAccount);

      expect(estimateMaxSpendable.mock.calls[0][0]).not.toHaveProperty("filters");
    });

    it("keeps a zero estimate on rows split into pools, where the bridge honours the filters", async () => {
      bridgeWith(new BigNumber(0));

      const result = await resolveWalletApiMaxSpendable(filteredAccount, undefined, {
        pools: ["transparent"],
      });

      // The 60 left in the row cannot pay for a send: zero is the answer, not a failure.
      expect(result).toEqual(new BigNumber(0));
    });

    it("omits an ambiguous zero on the single row of a family without pools", async () => {
      bridgeWith(new BigNumber(0));
      const account = {
        spendableBalance: new BigNumber(60),
        balances: [{ value: new BigNumber(60) }],
      } as AccountLike;

      const result = await resolveWalletApiMaxSpendable(account, undefined, { private: false });

      expect(result).toBeUndefined();
      expect(mockLog).toHaveBeenCalledWith(
        "wallet-api/converters",
        expect.stringContaining("omitting ambiguous zero maxSpendable"),
        { walletApiSpendableBalance: "60", pendingSpent: "0" },
      );
    });

    it("keeps a zero estimate when the selected rows are fully locked", async () => {
      bridgeWith(new BigNumber(0));
      const account = {
        spendableBalance: new BigNumber(600),
        balances: [{ value: new BigNumber(100), locked: new BigNumber(100), pool: "transparent" }],
      } as AccountLike;

      const result = await resolveWalletApiMaxSpendable(account, undefined, {
        pools: ["transparent"],
      });

      expect(result).toEqual(new BigNumber(0));
    });

    it("rejects when no row matches the filters", async () => {
      bridgeWith(new BigNumber(10));

      await expect(
        resolveWalletApiMaxSpendable(filteredAccount, undefined, { pools: ["sapling"] }),
      ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
    });

    it("rejects with the bridge's error when the bridge cannot honour a filter", async () => {
      mockGetAccountBridge.mockResolvedValue({
        estimateMaxSpendable: jest
          .fn()
          .mockRejectedValue(new UnsupportedMaxSpendableFilter("not split into pools")),
        getWalletApiSpendableBalance: () => new BigNumber(600),
      } as never);

      await expect(
        resolveWalletApiMaxSpendable(filteredAccount, undefined, { private: true }),
      ).rejects.toThrow("not split into pools");
    });
  });

  describe("pending operations", () => {
    beforeEach(() => {
      mockEstimateBridge(new BigNumber(0));
    });

    it("keeps a zero estimate when pending sends commit the whole token balance", async () => {
      const tokenAccount = makeAccountWithPending("TokenAccount", [pendingOut(100, 5)]);

      const result = await resolveWalletApiMaxSpendable(tokenAccount);

      expect(result).toEqual(new BigNumber(0));
      expect(mockLog).not.toHaveBeenCalled();
    });

    it("omits a zero estimate for a native pending debit that includes its fee", async () => {
      const mainAccount = makeAccountWithPending("Account", [pendingOut(95, 10)]);

      const result = await resolveWalletApiMaxSpendable(mainAccount);

      expect(result).toBeUndefined();
      expect(mockLog).toHaveBeenCalledWith(
        "wallet-api/converters",
        expect.stringContaining("omitting ambiguous zero maxSpendable"),
        { walletApiSpendableBalance: "100", pendingSpent: "0" },
      );
    });

    it("omits a zero estimate when pending sends leave part of the token balance", async () => {
      const tokenAccount = makeAccountWithPending("TokenAccount", [pendingOut(60, 5)]);

      const result = await resolveWalletApiMaxSpendable(tokenAccount);

      expect(result).toBeUndefined();
      expect(mockLog).toHaveBeenCalledWith(
        "wallet-api/converters",
        expect.stringContaining("omitting ambiguous zero maxSpendable"),
        { walletApiSpendableBalance: "100", pendingSpent: "60" },
      );
    });
  });
});

// The crash this guards against only shows up once the three real pieces are chained: the bridge
// extension, the converter funnel, and the wallet-api serializer that calls .toString() on what
// they produce. Each one alone is green. Only the bridge lookup is stubbed, with the real
// extension behind it.
describe("wallet-api serialization of a drawer-built token account", () => {
  it("serializes an Aleo ARC-22 token account that has no sub-account", async () => {
    // Given: what the asset drawer builds for a token the user holds no sub-account for
    const parentAccount = makeMainAccount("aleo-parent");
    const tokenAccount = makeEmptyTokenAccount(
      parentAccount,
      mockTokenCurrency({ parentCurrencyId: getCryptoCurrencyById("aleo").id }),
    );
    mockGetAccountBridge.mockResolvedValue(defaultBridgeExtensions as never);

    // When: the account.request / account.list handler shape (see react.ts)
    const spendableBalance = await resolveWalletApiSpendableBalance(tokenAccount, parentAccount);
    const walletApiAccount = {
      ...accountToWalletAPIAccount(walletState, tokenAccount, parentAccount),
      spendableBalance,
    };

    // Then: the real serializer must not blow up on an undefined balance
    expect(() => serializeAccount(walletApiAccount)).not.toThrow();
    expect(serializeAccount(walletApiAccount).spendableBalance).toBe("0");
  });
});

describe("accountToWalletAPIAccount", () => {
  it("passes the account readiness through", () => {
    const account = makeMainAccount("readiness-not-ready", {
      ready: false,
      reason: "unrevealed",
    });

    const walletApiAccount = accountToWalletAPIAccount(walletState, account);

    expect(walletApiAccount.readiness).toEqual({
      ready: false,
      reason: "unrevealed",
    });
  });

  it("leaves readiness undefined when the account has none", () => {
    const account = makeMainAccount("readiness-absent");

    const walletApiAccount = accountToWalletAPIAccount(walletState, account);

    expect(walletApiAccount.readiness).toBeUndefined();
  });

  describe("balances", () => {
    const balances = [
      { value: new BigNumber(30), locked: new BigNumber(5), pool: "transparent" },
      { value: new BigNumber(70), pool: "ironwood", private: true },
    ];

    it("carries the per-pool balances of an account", () => {
      const account = { ...makeMainAccount("balances-main"), balances };

      expect(accountToWalletAPIAccount(walletState, account).balances).toEqual(balances);
    });

    it("carries the per-pool balances of a token account", () => {
      const parentAccount = makeMainAccount("balances-parent");
      const tokenAccount = { ...makeTokenAccount(parentAccount), balances };

      expect(accountToWalletAPIAccount(walletState, tokenAccount, parentAccount).balances).toEqual(
        balances,
      );
    });

    it("leaves balances out when the account has none", () => {
      const parentAccount = makeMainAccount("balances-none");
      const tokenAccount = makeTokenAccount(parentAccount);

      expect(accountToWalletAPIAccount(walletState, parentAccount)).not.toHaveProperty("balances");
      expect(
        accountToWalletAPIAccount(walletState, tokenAccount, parentAccount),
      ).not.toHaveProperty("balances");
    });

    it("keeps the spendable balance of the account", () => {
      const account = { ...makeMainAccount("balances-spendable"), balances };

      expect(accountToWalletAPIAccount(walletState, account).spendableBalance).toEqual(
        account.spendableBalance,
      );
    });
  });

  it("derives a token account's readiness from its parent", () => {
    const parentAccount = makeMainAccount("readiness-parent", {
      ready: false,
      reason: "unrevealed",
    });
    const tokenAccount = makeTokenAccount(parentAccount);

    const walletApiAccount = accountToWalletAPIAccount(walletState, tokenAccount, parentAccount);

    expect(walletApiAccount.readiness).toEqual({
      ready: false,
      reason: "unrevealed",
    });
  });
});

describe("currencyToWalletAPICurrency", () => {
  it.each([[["stocks"]], [[]]])("returns token categories %j", categories => {
    expect(currencyToWalletAPICurrency(mockTokenCurrency({ categories }))).toHaveProperty(
      "categories",
      categories,
    );
  });

  it("omits categories on a token without categories", () => {
    expect(currencyToWalletAPICurrency(mockTokenCurrency())).not.toHaveProperty("categories");
  });

  it("omits categories on a crypto currency", () => {
    expect(currencyToWalletAPICurrency(getCryptoCurrencyById("ethereum"))).not.toHaveProperty(
      "categories",
    );
  });
});
