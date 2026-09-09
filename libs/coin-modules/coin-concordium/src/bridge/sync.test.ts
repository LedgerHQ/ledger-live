import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  createFixtureCurrency,
  createFixtureOperation,
  createFixtureTokenAccount,
  createFixtureTokenCurrency,
  PLT_TOKEN_ID,
  VALID_ADDRESS,
  VALID_ADDRESS_2,
  PUBLIC_KEY,
} from "../test/fixtures";
import type { Operation } from "@ledgerhq/types-live";
import { createTestConcordiumAccount } from "../test/testHelpers";
import type { ConcordiumAccount } from "../types";
import { getAccountShape as getAccountShapeOriginal, getBalance, syncOperations } from "./sync";
const getAccountShape = getAccountShapeOriginal as any;

jest.mock("../network/proxyClient", () => ({
  getAccountsByPublicKey: jest.fn(),
  getAccountBalance: jest.fn(),
  getConsensusInfo: jest.fn(),
}));

jest.mock("../logic/history/listOperations", () => ({
  listOperations: jest.fn(),
}));

// Recorded as well as throwing: a tokens-off test asserts the store was never
// reached, which resolving successfully cannot show. A tokens-on test installs a
// store for the span it needs one.
let mockCryptoAssetsStore: unknown = null;
const mockStoreAccess = jest.fn();

jest.mock("@ledgerhq/ledger-wallet-framework/cryptoAssetsStore", () => ({
  getCryptoAssetsStore: () => {
    mockStoreAccess();
    if (!mockCryptoAssetsStore) {
      throw new Error("the CAL must not be consulted while tokens are off");
    }
    return mockCryptoAssetsStore;
  },
}));

jest.mock("../config", () => ({
  __esModule: true,
  default: {
    getCoinConfig: jest.fn().mockReturnValue({ minReserve: "100000" }),
  },
}));

const { getAccountsByPublicKey, getAccountBalance, getConsensusInfo } =
  jest.requireMock("../network/proxyClient");

const { listOperations } = jest.requireMock("../logic/history/listOperations");

const coinConfig = jest.requireMock("../config").default;

const CURRENCY_ID = "concordium_testnet";
const ACCOUNT_ID = "js:2:concordium_testnet:test:";
const config = { minReserve: "100000" };

function createRawOpFixture(overrides?: Record<string, unknown>) {
  return {
    hash: "cc".repeat(32),
    type: "OUT",
    sender: VALID_ADDRESS,
    recipient: VALID_ADDRESS_2,
    amount: "1000000",
    fee: "100",
    value: "1000100",
    memo: undefined,
    date: new Date(),
    blockHash: "block-abc",
    blockHeight: 1000,
    failed: false,
    id: 101,
    ...overrides,
  };
}

const storedAccount = (over: Record<string, unknown> = {}) =>
  ({
    operations: [createFixtureOperation({ blockHeight: 500 })],
    concordiumResources: { publicKey: PUBLIC_KEY },
    ...over,
  }) as unknown as ConcordiumAccount;

describe("getBalance token list authority", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reports the token list alongside the balance, from one request", async () => {
    const accountTokens = [{ token: { tokenId: "t-USDT" } }];
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountAtDisposal: "1", accountTokens },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.accountTokens).toBe(accountTokens);
    expect(getAccountBalance).toHaveBeenCalledTimes(1);
  });

  it("reports no token list when the request fails, so the caller can tell that apart from empty", async () => {
    getAccountBalance.mockRejectedValue(new Error("network error"));

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    // A zeroed balance is synthetic here; treating an absent list as authoritative
    // would delete the account's token sub-accounts on one bad response.
    expect(result.balance).toEqual(new BigNumber(0));
    expect(result.accountTokens).toBeUndefined();
  });

  it("reports no token list when the field is present but not an array", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountAtDisposal: "1", accountTokens: null },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    // Normalised at this boundary so the declared type holds for every caller.
    expect(result.accountTokens).toBeUndefined();
  });

  it("reports no token list when the response omits the field", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountAtDisposal: "1" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.accountTokens).toBeUndefined();
  });
});

describe("getBalances", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return balance and spendableBalance from network", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "10000000", accountAtDisposal: "9900000" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.balance).toEqual(new BigNumber(10000000));
    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
  });

  it("should calculate spendableBalance from balance minus minReserve when accountAtDisposal is missing", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "10000000" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
  });

  it("should clamp negative spendableBalance to 0", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "50000" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should return zero balances on network error", async () => {
    getAccountBalance.mockRejectedValue(new Error("network error"));

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.balance).toEqual(new BigNumber(0));
    expect(result.spendableBalance).toEqual(new BigNumber(0));
  });

  it("should return zero for NaN balance values", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "invalid" },
    });

    const result = await getBalance(CURRENCY_ID, VALID_ADDRESS);

    expect(result.balance).toEqual(new BigNumber(0));
  });
});

describe("syncOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listOperations.mockResolvedValue({ items: [], next: undefined });
  });

  it("should fetch with minHeight 0 when no old operations", async () => {
    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
      enableTokens: false,
    });

    expect(listOperations).toHaveBeenCalledWith(
      config,
      VALID_ADDRESS,
      { minHeight: 0, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
    expect(result.operations).toEqual([]);
  });

  it("should use blockHeight + 1 from newest old operation as minHeight", async () => {
    const oldOp = createFixtureOperation({ blockHeight: 500 });

    await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp], { enableTokens: false });

    expect(listOperations).toHaveBeenCalledWith(
      config,
      VALID_ADDRESS,
      { minHeight: 501, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("should use minHeight 0 when newest operation has blockHeight 0", async () => {
    const oldOp = createFixtureOperation({ blockHeight: 0 });

    await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp], { enableTokens: false });

    expect(listOperations).toHaveBeenCalledWith(
      config,
      VALID_ADDRESS,
      { minHeight: 0, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("should map and merge new operations with old", async () => {
    const oldOp = createFixtureOperation({ id: "old-op", blockHeight: 100 });
    listOperations.mockResolvedValue({
      items: [createRawOpFixture()],
      next: undefined,
    });

    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp], {
      enableTokens: false,
    });

    expect(result.operations.length).toBeGreaterThanOrEqual(1);
  });

  it("fails the sync when a page cannot be fetched, leaving the stored history alone", async () => {
    // Reporting an empty page would read as the end of history, so the
    // watermark would advance past whatever the failed page held.
    listOperations.mockRejectedValue(new Error("network error"));

    await expect(
      syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], { enableTokens: false }),
    ).rejects.toThrow("network error");
  });

  it("walks every page the proxy offers, not just the first", async () => {
    const older = createRawOpFixture({ hash: "ab".repeat(32), id: 7, blockHeight: 10 });
    listOperations
      .mockResolvedValueOnce({ items: [createRawOpFixture()], next: "101" })
      .mockResolvedValueOnce({ items: [older], next: undefined });

    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
      enableTokens: false,
    });

    expect(listOperations).toHaveBeenCalledTimes(2);
    expect(listOperations.mock.calls[1][2]).toMatchObject({ cursor: "101" });
    expect(result.operations).toHaveLength(2);
  });

  it("fails rather than looping when the proxy replays a cursor it already gave", async () => {
    // A `from` the proxy cannot parse is ignored, so a bad cursor serves the
    // same page again instead of failing.
    listOperations.mockResolvedValue({ items: [createRawOpFixture()], next: "101" });

    await expect(
      syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], { enableTokens: false }),
    ).rejects.toThrow("was served twice");
  });

  it("carries the height floor onto every page of an incremental walk", async () => {
    const stored = createFixtureOperation({ blockHeight: 500 });
    listOperations
      .mockResolvedValueOnce({ items: [createRawOpFixture()], next: "9" })
      .mockResolvedValueOnce({ items: [], next: undefined });

    await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [stored], {
      enableTokens: false,
    });

    expect(listOperations).toHaveBeenNthCalledWith(
      2,
      config,
      VALID_ADDRESS,
      { minHeight: 501, limit: 1000, order: "desc", cursor: "9" },
      CURRENCY_ID,
    );
  });

  it("keeps walking past a page whose rows all parsed away", async () => {
    const older = createRawOpFixture({ hash: "ab".repeat(32), id: 7, blockHeight: 10 });
    listOperations
      .mockResolvedValueOnce({ items: [], next: "101" })
      .mockResolvedValueOnce({ items: [older], next: undefined });

    const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
      enableTokens: false,
    });

    expect(listOperations).toHaveBeenCalledTimes(2);
    expect(result.operations).toHaveLength(1);
  });

  describe("splitting PLT transfers from CCD ones", () => {
    const pltOp = createRawOpFixture({
      hash: "dd".repeat(32),
      id: 102,
      tokenId: "t-USDT",
      decimals: 6,
      amount: "3000000",
      value: "3000000",
      fee: "595400",
    });

    it("hands the token half back unmapped, for the sub-account to claim", async () => {
      listOperations.mockResolvedValue({ items: [pltOp], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
        enableTokens: true,
      });

      expect(result.pltOperations).toEqual([pltOp]);
    });

    it("leaves only the CCD fee on the parent account", async () => {
      listOperations.mockResolvedValue({ items: [pltOp], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
        enableTokens: true,
      });

      expect(result.operations).toHaveLength(1);
      expect(result.operations[0].type).toBe("FEES");
      expect(result.operations[0].value).toEqual(new BigNumber("595400"));
    });

    it("keeps CCD operations untouched alongside them", async () => {
      listOperations.mockResolvedValue({
        items: [createRawOpFixture(), pltOp],
        next: undefined,
      });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
        enableTokens: true,
      });

      expect(result.operations.map(op => op.type).sort()).toEqual(["FEES", "OUT"]);
    });

    it("re-reads from height zero when asked to, ignoring the stored watermark", async () => {
      listOperations.mockResolvedValue({ items: [], next: undefined });
      const oldOp = createFixtureOperation({ blockHeight: 500 });

      await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [oldOp], {
        enableTokens: true,
        refetchAll: true,
      });

      expect(listOperations).toHaveBeenCalledWith(
        config,
        VALID_ADDRESS,
        { minHeight: 0, limit: 1000, order: "desc" },
        CURRENCY_ID,
      );
    });

    it("replaces the stored history when re-reading, since the walk covers every block", async () => {
      const stale = createFixtureOperation({ id: "stale-op", blockHeight: 10 });
      listOperations.mockResolvedValue({ items: [], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [stale], {
        enableTokens: true,
        refetchAll: true,
      });

      expect(result.operations).toEqual([]);
    });

    it("recovers transfers older than everything stored, which is the point of re-reading", async () => {
      const stored = createFixtureOperation({ id: "newest-stored", date: new Date("2024-06-01") });
      const older = { ...pltOp, date: new Date("2020-01-01") };
      listOperations.mockResolvedValue({ items: [older], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [stored], {
        enableTokens: true,
        refetchAll: true,
      });

      expect(result.operations.filter(op => op.type === "FEES")).toHaveLength(1);
      expect(result.pltOperations).toEqual([older]);
    });

    it("keeps the stored history on an incremental sync", async () => {
      const stored = createFixtureOperation({ id: "kept-op", blockHeight: 10 });
      listOperations.mockResolvedValue({ items: [], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [stored], {
        enableTokens: true,
      });

      expect(result.operations.map(op => op.id)).toContain("kept-op");
    });

    it("stores one operation when the page repeats a transaction", async () => {
      const stored = createFixtureOperation({ id: "newest-stored", date: new Date("2024-06-01") });
      const older = { ...pltOp, date: new Date("2020-01-01") };
      listOperations.mockResolvedValue({ items: [older, older], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [stored], {
        enableTokens: true,
        refetchAll: true,
      });

      const ids = result.operations.map(op => op.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("discards PLT transfers entirely when tokens are off", async () => {
      listOperations.mockResolvedValue({ items: [pltOp], next: undefined });

      const result = await syncOperations(CURRENCY_ID, VALID_ADDRESS, ACCOUNT_ID, [], {
        enableTokens: false,
      });

      expect(result.operations).toEqual([]);
      expect(result.pltOperations).toEqual([]);
    });
  });
});

describe("getAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getAccountsByPublicKey.mockResolvedValue([{ address: VALID_ADDRESS }]);
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "10000000", accountAtDisposal: "9900000" },
    });
    listOperations.mockResolvedValue({ items: [], next: undefined });
    getConsensusInfo.mockResolvedValue({ lastFinalizedBlockHeight: 5000 });
  });

  it("should return complete account shape for an onboarded account", async () => {
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.balance).toEqual(new BigNumber(10000000));
    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
    expect(result.freshAddress).toBe(VALID_ADDRESS);
    expect(result.concordiumResources?.isOnboarded).toBe(true);
    expect(result.concordiumResources?.publicKey).toBe(PUBLIC_KEY);
    expect(result.seedIdentifier).toBe(PUBLIC_KEY);
    expect(result.xpub).toBe(PUBLIC_KEY);
    expect(result.used).toBe(true);
  });

  it("should set blockHeight from chain tip via getConsensusInfo", async () => {
    getConsensusInfo.mockResolvedValue({ lastFinalizedBlockHeight: 7500 });
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.blockHeight).toBe(7500);
  });

  it("should set blockHeight to 0 when getConsensusInfo fails", async () => {
    getConsensusInfo.mockRejectedValue(new Error("consensus error"));
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.blockHeight).toBe(0);
  });

  it("should return empty account shape when no accounts found on-chain", async () => {
    getAccountsByPublicKey.mockResolvedValue([]);
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.balance).toEqual(new BigNumber(0));
    expect(result.spendableBalance).toEqual(new BigNumber(0));
    expect(result.concordiumResources?.isOnboarded).toBe(false);
    expect(result.used).toBe(false);
    expect(result.operations).toEqual([]);
  });

  it("keeps the stored history when the chain reports no such account", async () => {
    // Nothing removes a transaction from a chain, so an empty account list is a
    // fault. `shouldMergeOps` is off, so returning [] here would erase history.
    getAccountsByPublicKey.mockResolvedValue([]);
    const initialAccount = {
      operations: [createFixtureOperation({ id: "kept-op" })],
      concordiumResources: { publicKey: PUBLIC_KEY },
    } as unknown as ConcordiumAccount;

    const result = await getAccountShape({
      currency: createFixtureCurrency(),
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.operations.map((op: { id: string }) => op.id)).toEqual(["kept-op"]);
    expect(result.operationsCount).toBe(1);
  });

  it("should throw on network error when fetching accounts", async () => {
    getAccountsByPublicKey.mockRejectedValue(new Error("Network error"));
    const currency = createFixtureCurrency();

    await expect(
      getAccountShape({
        currency,
        derivationMode: "",
        derivationPath: "44'/1'/0'/0'/0'/0'",
        index: 0,
        rest: { publicKey: PUBLIC_KEY },
      }),
    ).rejects.toThrow("Network error");
  });

  it("should use publicKey from initialAccount when not in rest", async () => {
    const currency = createFixtureCurrency();
    const initialAccount = createTestConcordiumAccount({
      concordiumResources: {
        isOnboarded: false,
        publicKey: PUBLIC_KEY,
        credId: "",
        identityIndex: 0,
        credNumber: 0,
        ipIdentity: 0,
      },
    });

    await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
    });

    expect(getAccountsByPublicKey).toHaveBeenCalledWith(config, currency.id, PUBLIC_KEY);
  });

  it("should preserve derivationMode, derivationPath, and index", async () => {
    const currency = createFixtureCurrency();

    const result = await getAccountShape({
      currency,
      derivationMode: "concordium",
      derivationPath: "44'/1'/0'/0'/0'/5'",
      index: 5,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.derivationMode).toBe("concordium");
    expect(result.derivationPath).toBe("44'/1'/0'/0'/0'/5'");
    expect(result.index).toBe(5);
  });

  it("should preserve existing concordiumResources fields", async () => {
    const currency = createFixtureCurrency();
    const initialAccount = createTestConcordiumAccount({
      concordiumResources: {
        isOnboarded: false,
        publicKey: PUBLIC_KEY,
        credId: "existing-cred-id",
        identityIndex: 5,
        credNumber: 3,
        ipIdentity: 1,
      },
    });

    const result = await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.concordiumResources?.credId).toBe("existing-cred-id");
    expect(result.concordiumResources?.identityIndex).toBe(5);
  });

  it("should fetch balances, operations, and chain height in parallel", async () => {
    const currency = createFixtureCurrency();
    const existingOp = createFixtureOperation({ blockHash: "existing-block" });
    const initialAccount = createTestConcordiumAccount({
      operations: [existingOp],
      concordiumResources: {
        isOnboarded: true,
        publicKey: PUBLIC_KEY,
        credId: "",
        identityIndex: 0,
        credNumber: 0,
        ipIdentity: 0,
      },
    });

    await getAccountShape({
      currency,
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
    });

    expect(getAccountBalance).toHaveBeenCalled();
    expect(listOperations).toHaveBeenCalled();
    expect(getConsensusInfo).toHaveBeenCalledWith(config, currency.id);
  });
});

/**
 * `enableTokens` is the shipping default of `false`, and this file's coin config
 * mock omits the flag, so no extra setup is needed to exercise it.
 *
 * The chain response carries a PLT throughout, so the flag rather than an empty
 * chain is what has to keep tokens out.
 */
describe("getAccountShape with tokens disabled", () => {
  const PLT_ENTRY = {
    token: { tokenId: "t-USDT", tokenState: { decimals: 6, moduleState: {} } },
    tokenAccountState: { balance: { value: "500000", decimals: 6 } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAccountsByPublicKey.mockResolvedValue([{ address: VALID_ADDRESS }]);
    getAccountBalance.mockResolvedValue({
      finalizedBalance: {
        accountAmount: "10000000",
        accountAtDisposal: "9900000",
        accountTokens: [PLT_ENTRY],
      },
    });
    listOperations.mockResolvedValue({ items: [], next: undefined });
    getConsensusInfo.mockResolvedValue({ lastFinalizedBlockHeight: 5000 });
  });

  const shape = () =>
    getAccountShape({
      currency: createFixtureCurrency(),
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      rest: { publicKey: PUBLIC_KEY },
    });

  it("reports the native balance unchanged", async () => {
    const result = await shape();

    expect(result.balance).toEqual(new BigNumber(10000000));
    expect(result.spendableBalance).toEqual(new BigNumber(9900000));
  });

  it("never consults the CAL, so a CAL outage cannot affect a tokens-off sync", async () => {
    await shape();

    expect(mockStoreAccess).not.toHaveBeenCalled();
  });

  it("stores no per-token state", async () => {
    const result = await shape();

    expect(result.concordiumResources).not.toHaveProperty("tokens");
  });

  it("empties subAccounts so a previous tokens-on sync leaves nothing behind", async () => {
    const result = await shape();

    // `postSync` then removes the key entirely; see bridge/index.test.ts.
    expect(result.subAccounts).toEqual([]);
  });

  it("records a syncHash that names the off state", async () => {
    const result = await shape();

    expect(result.syncHash).toBe("tokens=off");
  });

  it("drops PLT transfers entirely when the flag is switched back off", async () => {
    // The rollback path: the stored hash names the on state, so the sync
    // re-reads, and every PLT transfer must fall out of both accounts.
    listOperations.mockResolvedValue({
      items: [createRawOpFixture({ tokenId: PLT_TOKEN_ID, decimals: 6, fee: "595400" })],
      next: undefined,
    });

    const result = await getAccountShape({
      currency: createFixtureCurrency(),
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount: storedAccount({ syncHash: "0xabc:tokens=on" }),
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(result.operations).toEqual([]);
    expect(result.subAccounts).toEqual([]);
    expect(result.syncHash).toBe("tokens=off");
  });

  it("re-reads the history from zero once the stored assumptions no longer hold", async () => {
    const initialAccount = {
      operations: [createFixtureOperation({ blockHeight: 500 })],
      syncHash: "some-earlier-hash",
      concordiumResources: { publicKey: PUBLIC_KEY },
    } as unknown as ConcordiumAccount;

    await getAccountShape({
      currency: createFixtureCurrency(),
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(listOperations).toHaveBeenCalledWith(
      config,
      VALID_ADDRESS,
      { minHeight: 0, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("re-reads once for an account stored before this family had a syncHash", async () => {
    // What carries the corrected parsing onto history already on disk: nothing
    // else revisits a stored operation, since `sameOp` ignores `hasFailed`.
    await getAccountShape({
      currency: createFixtureCurrency(),
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount: storedAccount(),
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(listOperations).toHaveBeenCalledWith(
      config,
      VALID_ADDRESS,
      { minHeight: 0, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("keeps the watermark when the stored assumptions still hold", async () => {
    const initialAccount = {
      operations: [createFixtureOperation({ blockHeight: 500 })],
      syncHash: "tokens=off",
      concordiumResources: { publicKey: PUBLIC_KEY },
    } as unknown as ConcordiumAccount;

    await getAccountShape({
      currency: createFixtureCurrency(),
      derivationMode: "",
      derivationPath: "44'/1'/0'/0'/0'/0'",
      index: 0,
      initialAccount,
      rest: { publicKey: PUBLIC_KEY },
    });

    expect(listOperations).toHaveBeenCalledWith(
      config,
      VALID_ADDRESS,
      { minHeight: 501, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });
});

describe("getAccountShape with tokens enabled", () => {
  const TOKEN = createFixtureTokenCurrency();
  const SUB_ACCOUNT_ID = encodeTokenAccountId("js:2:concordium_testnet:" + PUBLIC_KEY + ":", TOKEN);
  const tokensOnConfig = { ...config, enableTokens: true };

  const PLT_ENTRY = {
    token: { tokenId: PLT_TOKEN_ID, tokenState: { decimals: 6, moduleState: {} } },
    tokenAccountState: { balance: { value: "500000", decimals: 6 } },
  };

  const pltRawOp = () =>
    createRawOpFixture({
      hash: "dd".repeat(32),
      id: 102,
      tokenId: PLT_TOKEN_ID,
      decimals: 6,
      amount: "3000000",
      value: "3000000",
      fee: "595400",
    });

  beforeEach(() => {
    jest.clearAllMocks();
    coinConfig.getCoinConfig.mockReturnValue(tokensOnConfig);
    mockCryptoAssetsStore = {
      findTokenById: async () => undefined,
      getTokensSyncHash: jest.fn(async () => "cal-hash"),
      findTokenByAddressInCurrency: async (address: string) =>
        address === PLT_TOKEN_ID ? TOKEN : undefined,
    };

    getAccountsByPublicKey.mockResolvedValue([{ address: VALID_ADDRESS }]);
    getAccountBalance.mockResolvedValue({
      finalizedBalance: {
        accountAmount: "10000000",
        accountAtDisposal: "9900000",
        accountTokens: [PLT_ENTRY],
      },
    });
    listOperations.mockResolvedValue({ items: [], next: undefined });
    getConsensusInfo.mockResolvedValue({ lastFinalizedBlockHeight: 5000 });
  });

  afterEach(() => {
    mockCryptoAssetsStore = null;
    coinConfig.getCoinConfig.mockReturnValue(config);
  });

  const shape = (initialAccount?: ConcordiumAccount, blacklistedTokenIds?: string[]) =>
    getAccountShape(
      {
        currency: createFixtureCurrency(),
        derivationMode: "",
        derivationPath: "44'/1'/0'/0'/0'/0'",
        index: 0,
        ...(initialAccount ? { initialAccount } : {}),
        rest: { publicKey: PUBLIC_KEY },
      },
      blacklistedTokenIds ? { blacklistedTokenIds } : undefined,
    );

  it("lands a fetched transfer on the sub-account of the token it moved", async () => {
    listOperations.mockResolvedValue({ items: [pltRawOp()], next: undefined });

    const result = await shape();

    const subAccount = result.subAccounts?.[0];
    expect(subAccount?.id).toBe(SUB_ACCOUNT_ID);
    expect(subAccount?.operations).toHaveLength(1);
    expect(subAccount?.operations[0].value).toEqual(new BigNumber("3000000"));
  });

  it("hangs the token transfer under the CCD operation that paid for it", async () => {
    listOperations.mockResolvedValue({ items: [pltRawOp()], next: undefined });

    const result = await shape();

    const parent = result.operations?.[0];
    expect(parent.type).toBe("FEES");
    expect(parent.subOperations).toHaveLength(1);
    expect(parent.subOperations[0].accountId).toBe(SUB_ACCOUNT_ID);
  });

  it("leaves a plain CCD transfer without sub-operations", async () => {
    listOperations.mockResolvedValue({ items: [createRawOpFixture()], next: undefined });

    const result = await shape();

    expect(result.operations?.[0]).not.toHaveProperty("subOperations");
  });

  it("leaves only the CCD fee for that transfer on the parent account", async () => {
    listOperations.mockResolvedValue({ items: [pltRawOp()], next: undefined });

    const result = await shape();

    expect(result.operations).toHaveLength(1);
    expect(result.operations?.[0].type).toBe("FEES");
    expect(result.operations?.[0].value).toEqual(new BigNumber("595400"));
  });

  it("records a syncHash that names both the CAL and the on state", async () => {
    const result = await shape();

    expect(result.syncHash).toMatch(/^0x[0-9a-f]+:tokens=on$/);
  });

  it("gives two different blacklists two different syncHashes", async () => {
    const first = await shape(undefined, ["a"]);
    const second = await shape(undefined, ["b"]);

    expect(first.syncHash).not.toBe(second.syncHash);
  });

  it("re-reads from zero when the flag has just been turned on", async () => {
    await shape(storedAccount({ syncHash: "tokens=off" }));

    expect(listOperations).toHaveBeenCalledWith(
      tokensOnConfig,
      VALID_ADDRESS,
      { minHeight: 0, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("does not re-read on a transient CAL outage, keeping the stored hash", async () => {
    const stored = await shape();
    (mockCryptoAssetsStore as { getTokensSyncHash: jest.Mock }).getTokensSyncHash.mockRejectedValue(
      new Error("CAL down"),
    );

    const result = await shape(storedAccount({ syncHash: stored.syncHash }));

    expect(result.syncHash).toBe(stored.syncHash);
    expect(listOperations).toHaveBeenLastCalledWith(
      tokensOnConfig,
      VALID_ADDRESS,
      { minHeight: 501, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("labels a first sync off when the CAL is down, so the next one re-reads", async () => {
    (mockCryptoAssetsStore as { getTokensSyncHash: jest.Mock }).getTokensSyncHash.mockRejectedValue(
      new Error("CAL down"),
    );

    const result = await shape();

    expect(result.syncHash).toBe("tokens=off");
  });

  it("invalidates the syncHash when a balance failure leaves transfers unattributed", async () => {
    getAccountBalance.mockRejectedValue(new Error("balance endpoint down"));
    listOperations.mockResolvedValue({ items: [pltRawOp()], next: undefined });

    const result = await shape();

    expect(result.syncHash).toBe("refetch-pending");
  });

  it("re-reads from zero on the first healthy sync after transfers went unattributed", async () => {
    await shape(storedAccount({ syncHash: "refetch-pending" }));

    expect(listOperations).toHaveBeenLastCalledWith(
      tokensOnConfig,
      VALID_ADDRESS,
      { minHeight: 0, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("keeps asking for a re-read while the token list stays absent", async () => {
    // The fault is the balance response, not the CAL, so nothing else re-arms:
    // giving up after one attempt would strand these transfers for good.
    getAccountBalance.mockRejectedValue(new Error("balance endpoint down"));
    listOperations.mockResolvedValue({ items: [pltRawOp()], next: undefined });

    const result = await shape(storedAccount({ syncHash: "refetch-pending" }));

    expect(result.syncHash).toBe("refetch-pending");
  });

  it("defers that re-read while the CAL is still down, rather than losing it", async () => {
    (mockCryptoAssetsStore as { getTokensSyncHash: jest.Mock }).getTokensSyncHash.mockRejectedValue(
      new Error("CAL down"),
    );

    const result = await shape(storedAccount({ syncHash: "refetch-pending" }));

    expect(result.syncHash).toBe("refetch-pending");
    expect(listOperations).toHaveBeenLastCalledWith(
      tokensOnConfig,
      VALID_ADDRESS,
      { minHeight: 501, limit: 1000, order: "desc" },
      CURRENCY_ID,
    );
  });

  it("fails the shape when a page cannot be fetched, rather than storing a fragment", async () => {
    listOperations.mockRejectedValue(new Error("network error"));

    await expect(shape()).rejects.toThrow("network error");
  });

  it("links sub-operations from the stored sub-accounts when the token list is absent", async () => {
    // The `unchanged` arm: the account keeps the sub-accounts it had, so the
    // links must come from those rather than from a resolution that did not run.
    getAccountBalance.mockRejectedValue(new Error("balance endpoint down"));
    const raw = pltRawOp();
    listOperations.mockResolvedValue({ items: [raw], next: undefined });

    const stored = createFixtureTokenAccount({
      token: TOKEN,
      operations: [{ hash: raw.hash, accountId: SUB_ACCOUNT_ID }] as unknown as Operation[],
    });

    const result = await shape(storedAccount({ subAccounts: [stored] }));

    expect(result.operations?.[0].subOperations).toHaveLength(1);
  });

  it("keeps the computed syncHash when a balance failure cost it no transfers", async () => {
    getAccountBalance.mockRejectedValue(new Error("balance endpoint down"));

    const result = await shape();

    expect(result.syncHash).toMatch(/:tokens=on$/);
  });
});
