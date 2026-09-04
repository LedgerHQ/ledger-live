import type { Account } from "@ledgerhq/types-live";
import { AccountIdSchema } from "@shared/schema-primitives";
import { createAccountBalanceSources, createAccountOperationsSources } from "./sources";
import type { AccountRefLike } from "../bridge/generic-coin-framework/accountBalances";

const getAccountBalanceRows = jest.fn();
const syncAccountBalanceRows = jest.fn();
const getAccountBridge = jest.fn();
const getAccountOperationPage = jest.fn();
const syncAccountOperations = jest.fn();

jest.mock("../bridge/generic-coin-framework/accountBalances", () => ({
  getAccountBalanceRows: (...args: unknown[]) => getAccountBalanceRows(...args),
  syncAccountBalanceRows: (...args: unknown[]) => syncAccountBalanceRows(...args),
}));
jest.mock("../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));
jest.mock("./operations", () => ({
  getAccountOperationPage: (...args: unknown[]) => getAccountOperationPage(...args),
  syncAccountOperations: (...args: unknown[]) => syncAccountOperations(...args),
}));

const ETH_ID = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const BTC_ID = AccountIdSchema.parse("js:2:bitcoin:xpub:native_segwit");
const TOKEN_ID = AccountIdSchema.parse("js:2:ethereum:0xabc:+ethereum%2Ferc20%2Fusd__coin");

const ref = (over: Partial<AccountRefLike> = {}): AccountRefLike => ({
  accountId: ETH_ID,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
  ...over,
});

const account = { id: ETH_ID, currency: { id: "ethereum" } } as unknown as Account;

const prepareCurrency = jest.fn(async () => undefined);

const build = (over: Partial<Parameters<typeof createAccountBalanceSources>[0]> = {}) =>
  createAccountBalanceSources({
    getAccount: id => (id === ETH_ID ? account : undefined),
    prepareCurrency,
    granularFamilies: () => ["evm"],
    ...over,
  });

beforeEach(() => {
  jest.clearAllMocks();
  getAccountBalanceRows.mockResolvedValue([]);
  syncAccountBalanceRows.mockResolvedValue([]);
  getAccountBridge.mockResolvedValue({ sync: jest.fn() });
});

describe("createAccountBalanceSources", () => {
  it("returns the granular source first, at a higher priority than the full sync", () => {
    const [granular, fullSync] = build();
    expect(granular.id).toBe("granular");
    expect(fullSync.id).toBe("full-sync");
    expect(granular.priority).toBeGreaterThan(fullSync.priority);
  });

  describe("granular", () => {
    it("supports a family whose coin module can serve a balance alone", () => {
      expect(build()[0].supports(ref())).toBe(true);
    });

    it("declines a family outside the gate, leaving it to the full sync", () => {
      const [granular, fullSync] = build();
      const btc = ref({ accountId: BTC_ID, currencyId: "bitcoin" });
      expect(granular.supports(btc)).toBe(false);
      expect(fullSync.supports(btc)).toBe(true);
    });

    it("declines an unknown currency rather than throwing inside supports", () => {
      const unknown = ref({ currencyId: "not-a-currency" });
      const [granular, fullSync] = build();
      expect(granular.supports(unknown)).toBe(false);
      expect(fullSync.supports(unknown)).toBe(false);
    });

    it("declines a token-account ref — its rows arrive with the parent's read", () => {
      expect(build()[0].supports(ref({ parentId: ETH_ID, accountId: TOKEN_ID }))).toBe(false);
    });

    it("reads through the coin module, passing the hidden tokens along", async () => {
      const [granular] = build({ blacklistedTokenIds: () => ["ethereum/erc20/scam"] });
      await granular.getBalances(ref());
      expect(getAccountBalanceRows).toHaveBeenCalledWith({
        accountId: ETH_ID,
        currencyId: "ethereum",
        address: "0xabc",
        blacklistedTokenIds: ["ethereum/erc20/scam"],
      });
      expect(syncAccountBalanceRows).not.toHaveBeenCalled();
    });

    it("reads the hidden tokens at call time, so a settings change needs no re-registration", async () => {
      let hidden: string[] = [];
      const [granular] = build({ blacklistedTokenIds: () => hidden });
      await granular.getBalances(ref());
      hidden = ["ethereum/erc20/scam"];
      await granular.getBalances(ref());
      expect(getAccountBalanceRows.mock.calls[0][0].blacklistedTokenIds).toEqual([]);
      expect(getAccountBalanceRows.mock.calls[1][0].blacklistedTokenIds).toEqual([
        "ethereum/erc20/scam",
      ]);
    });

    it("uses the wallet's own gate when the host does not narrow it", () => {
      // No `granularFamilies` override: whatever the wallet enables is what this supports, so no app
      // can drift into its own family list.
      const [granular] = createAccountBalanceSources({
        getAccount: () => account,
        prepareCurrency,
      });
      expect(typeof granular.supports(ref())).toBe("boolean");
    });
  });

  describe("full-sync", () => {
    it("prepares the currency before syncing, and forwards the abort signal", async () => {
      const controller = new AbortController();
      const [, fullSync] = build();
      await fullSync.getBalances(ref(), controller.signal);
      expect(prepareCurrency).toHaveBeenCalledWith(account.currency);
      expect(syncAccountBalanceRows).toHaveBeenCalledWith(
        expect.objectContaining({ account, signal: controller.signal }),
      );
    });

    it("fails clearly when the account is not in the host's store", async () => {
      const [, fullSync] = build();
      await expect(fullSync.getBalances(ref({ accountId: BTC_ID }))).rejects.toThrow(
        `account ${BTC_ID} is not in the store`,
      );
      expect(syncAccountBalanceRows).not.toHaveBeenCalled();
    });

    it("declines a token-account ref", () => {
      expect(build()[1].supports(ref({ parentId: ETH_ID, accountId: TOKEN_ID }))).toBe(false);
    });
  });
});

describe("createAccountOperationsSources", () => {
  const buildOps = (over: Partial<Parameters<typeof createAccountOperationsSources>[0]> = {}) =>
    createAccountOperationsSources({
      getAccount: id => (id === ETH_ID ? account : undefined),
      prepareCurrency,
      ...over,
    });

  it("keeps every family on the full sync by default — listOperations parity is unproven", () => {
    const [granular, fullSync] = buildOps();
    expect(granular.supports(ref())).toBe(false);
    expect(fullSync.supports(ref())).toBe(true);
  });

  it("uses a gate of its own, not the balance one", () => {
    // A family being granular for `balance` says nothing about `operations`, which is the whole
    // reason the two are separate lists rather than one source declaring capabilities.
    const [balanceGranular] = build();
    const [operationsGranular] = buildOps();
    expect(balanceGranular.supports(ref())).toBe(true);
    expect(operationsGranular.supports(ref())).toBe(false);
  });

  it("serves a family the host has opted in granularly", async () => {
    getAccountOperationPage.mockResolvedValue({ operations: [], complete: false });
    const [granular] = buildOps({ granularOperationFamilies: () => ["evm"] });

    expect(granular.supports(ref())).toBe(true);
    await granular.getOperations(ref(), { cursor: "c1", limit: 25 });
    expect(getAccountOperationPage).toHaveBeenCalledWith({
      accountId: ETH_ID,
      currencyId: "ethereum",
      address: "0xabc",
      cursor: "c1",
      limit: 25,
    });
  });

  it("declares the granular source as resumable and the full sync as not", () => {
    const [granular, fullSync] = buildOps();
    expect(granular.paginated).toBe(true);
    // A bridge sync returns the whole history or nothing: there is no page to resume.
    expect(fullSync.paginated).toBe(false);
  });

  it("declines a token-account ref on both sources", () => {
    const token = ref({ parentId: ETH_ID, accountId: TOKEN_ID });
    for (const source of buildOps({ granularOperationFamilies: () => ["evm"] })) {
      expect(source.supports(token)).toBe(false);
    }
  });

  it("full-syncs the whole history, and fails clearly without an account", async () => {
    syncAccountOperations.mockResolvedValue({ operations: [], complete: true, total: 0 });
    const [, fullSync] = buildOps();

    await fullSync.getOperations(ref(), {});
    expect(prepareCurrency).toHaveBeenCalledWith(account.currency);

    await expect(fullSync.getOperations(ref({ accountId: BTC_ID }), {})).rejects.toThrow(
      `account ${BTC_ID} is not in the store`,
    );
  });
});
