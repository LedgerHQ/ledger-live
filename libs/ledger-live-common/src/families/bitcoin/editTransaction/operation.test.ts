import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
import { addSellOperation } from "../../../exchange/sell/sellOperations";
import { getBitcoinCoinConfig } from "../coinConfig";
import { isEditableOperation, isStuckOperation, getStuckAccountAndOperation } from "./operation";

// Deterministic stuck-timeout threshold, decoupled from the module default.
const STUCK_TIMEOUT = 20 * 60 * 1000;

jest.mock("../coinConfig", () => ({
  getBitcoinCoinConfig: jest.fn(),
}));

const mockedGetBitcoinCoinConfig = jest.mocked(getBitcoinCoinConfig);
const coinConfigWithFees = (fees: BitcoinCoinConfig["fees"] = {}): BitcoinCoinConfig => ({
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorer: { url: "https://explorer.test.invalid" },
  fees,
});

beforeEach(() => {
  mockedGetBitcoinCoinConfig.mockReturnValue(
    coinConfigWithFees({ stuckTransactionTimeoutMs: STUCK_TIMEOUT }),
  );
});

const makeOperation = (overrides: Partial<Operation> = {}): Operation =>
  ({
    id: "op-1",
    accountId: "js:2:bitcoin:xpub:native_segwit",
    type: "OUT",
    blockHeight: null,
    date: new Date(),
    ...overrides,
  }) as Operation;

const makeAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    type: "Account",
    currency: { family: "bitcoin" },
    pendingOperations: [],
    operations: [],
    ...overrides,
  }) as unknown as Account;

const stuckDate = () => new Date(Date.now() - (STUCK_TIMEOUT + 60 * 1000));
const recentDate = () => new Date(Date.now() - 60 * 1000);

describe("isEditableOperation", () => {
  const account = {} as Account;

  it("returns true for an unconfirmed outgoing operation (blockHeight null)", () => {
    expect(isEditableOperation(account, makeOperation({ type: "OUT", blockHeight: null }))).toBe(
      true,
    );
  });

  it("returns true when blockHeight is undefined", () => {
    expect(
      isEditableOperation(account, makeOperation({ type: "OUT", blockHeight: undefined })),
    ).toBe(true);
  });

  it("returns false when the operation is confirmed (has a blockHeight)", () => {
    expect(isEditableOperation(account, makeOperation({ type: "OUT", blockHeight: 123456 }))).toBe(
      false,
    );
  });

  it("returns false for a non-outgoing operation", () => {
    expect(isEditableOperation(account, makeOperation({ type: "IN", blockHeight: null }))).toBe(
      false,
    );
  });

  it("returns false for an operation broadcast by a sell flow", () => {
    const sellAccount = makeAccount({ sellOperationIds: ["op-1"] });
    expect(isEditableOperation(sellAccount, makeOperation({ id: "op-1" }))).toBe(false);
    expect(isEditableOperation(sellAccount, makeOperation({ id: "op-2" }))).toBe(true);
  });

  describe("when a pending sell spends unconfirmed change", () => {
    const send = makeOperation({ id: "send", hash: "a", extra: { inputs: ["confirmed-0"] } });
    const relay = makeOperation({ id: "relay", hash: "b", extra: { inputs: ["a-1"] } });
    const other = makeOperation({ id: "other", hash: "c", extra: { inputs: ["confirmed-1"] } });

    it("returns false for the send the sell spends from", () => {
      const sell = makeOperation({ id: "sell", hash: "d", extra: { inputs: ["a-1"] } });
      const sellAccount = makeAccount({
        sellOperationIds: ["sell"],
        pendingOperations: [sell, send, other],
      });

      expect(isEditableOperation(sellAccount, send)).toBe(false);
      expect(isEditableOperation(sellAccount, other)).toBe(true);
    });

    it("returns false for every unconfirmed transaction up the chain", () => {
      const sell = makeOperation({ id: "sell", hash: "d", extra: { inputs: ["b-1"] } });
      const sellAccount = makeAccount({
        sellOperationIds: ["sell"],
        pendingOperations: [sell, relay],
        operations: [send, other],
      });

      expect(isEditableOperation(sellAccount, relay)).toBe(false);
      expect(isEditableOperation(sellAccount, send)).toBe(false);
      expect(isEditableOperation(sellAccount, other)).toBe(true);
    });

    it("returns false for the send as soon as the sell is broadcast, before any sync", () => {
      const sell = makeOperation({ id: "sell", hash: "d", extra: { inputs: ["a-1"] } });
      const beforeSell = makeAccount({
        id: send.accountId,
        pendingOperations: [send],
      });

      const afterSell = addSellOperation(beforeSell, sell);

      expect(isEditableOperation(beforeSell, send)).toBe(true);
      expect(isEditableOperation(afterSell, send)).toBe(false);
    });

    it("returns false for the send when only the explorer's copy of the sell lists its inputs", () => {
      const optimisticSell = makeOperation({ id: "sell", hash: "d", extra: { inputs: [] } });
      const explorerSell = makeOperation({ id: "sell", hash: "d", extra: { inputs: ["a-1"] } });
      const sellAccount = makeAccount({
        sellOperationIds: ["sell"],
        pendingOperations: [optimisticSell, send],
        operations: [explorerSell],
      });

      expect(isEditableOperation(sellAccount, send)).toBe(false);
    });

    it("scans the history once for repeated checks of the same account", () => {
      const sell = makeOperation({ id: "sell", hash: "d", extra: { inputs: ["a-1"] } });
      let historyReads = 0;
      const sellAccount = makeAccount({ sellOperationIds: ["sell"], pendingOperations: [sell] });
      Object.defineProperty(sellAccount, "operations", {
        get: () => {
          historyReads++;
          return [send, other];
        },
      });

      expect(isEditableOperation(sellAccount, send)).toBe(false);
      expect(isEditableOperation(sellAccount, other)).toBe(true);
      expect(isEditableOperation(sellAccount, send)).toBe(false);
      expect(historyReads).toBe(1);
    });

    it("returns true once the sell is confirmed", () => {
      const sell = makeOperation({
        id: "sell",
        hash: "d",
        blockHeight: 123456,
        extra: { inputs: ["a-1"] },
      });
      const sellAccount = makeAccount({ sellOperationIds: ["sell"], operations: [sell, send] });

      expect(isEditableOperation(sellAccount, send)).toBe(true);
    });
  });
});

describe("isStuckOperation", () => {
  it("returns true when the operation is older than the stuck timeout", () => {
    expect(isStuckOperation(makeOperation({ date: stuckDate() }))).toBe(true);
  });

  it("returns false when the operation is more recent than the stuck timeout", () => {
    expect(isStuckOperation(makeOperation({ date: recentDate() }))).toBe(false);
  });

  it("reads the stuck timeout of the operation's currency from its coin config", () => {
    mockedGetBitcoinCoinConfig.mockReturnValue(
      coinConfigWithFees({ stuckTransactionTimeoutMs: 1 }),
    );

    expect(isStuckOperation(makeOperation({ date: recentDate() }))).toBe(true);
    expect(mockedGetBitcoinCoinConfig).toHaveBeenCalledWith("bitcoin");
  });

  it("falls back to the module default when the coin config has no stuck timeout", () => {
    mockedGetBitcoinCoinConfig.mockReturnValue(coinConfigWithFees());

    expect(isStuckOperation(makeOperation({ date: stuckDate() }))).toBe(true);
    expect(isStuckOperation(makeOperation({ date: recentDate() }))).toBe(false);
  });
});

describe("getStuckAccountAndOperation", () => {
  it("returns undefined when the account is not a bitcoin account", () => {
    const operation = makeOperation({ date: stuckDate() });
    const account = makeAccount({
      currency: { family: "ethereum" } as Account["currency"],
      pendingOperations: [operation],
      operations: [operation],
    });

    expect(getStuckAccountAndOperation(account, null)).toBeUndefined();
  });

  it("returns undefined when there are no pending operations", () => {
    const account = makeAccount({ pendingOperations: [], operations: [] });

    expect(getStuckAccountAndOperation(account, null)).toBeUndefined();
  });

  it("returns undefined when the pending operation is not stuck yet", () => {
    const operation = makeOperation({ date: recentDate() });
    const account = makeAccount({
      pendingOperations: [operation],
      operations: [operation],
    });

    expect(getStuckAccountAndOperation(account, null)).toBeUndefined();
  });

  it("returns undefined when the stuck pending operation has no matching confirmed operation", () => {
    const account = makeAccount({
      pendingOperations: [makeOperation({ id: "op-1", date: stuckDate() })],
      operations: [],
    });

    expect(getStuckAccountAndOperation(account, null)).toBeUndefined();
  });

  it("returns the stuck operation and its account when one is found", () => {
    const operation = makeOperation({ id: "op-1", date: stuckDate() });
    const account = makeAccount({
      pendingOperations: [operation],
      operations: [operation],
    });

    expect(getStuckAccountAndOperation(account, null)).toEqual({
      account,
      parentAccount: undefined,
      operation,
    });
  });

  it("returns the oldest stuck operation when several are stuck", () => {
    const older = makeOperation({ id: "op-older", date: new Date(Date.now() - 2 * STUCK_TIMEOUT) });
    const newer = makeOperation({
      id: "op-newer",
      date: new Date(Date.now() - (STUCK_TIMEOUT + 60 * 1000)),
    });
    const account = makeAccount({
      pendingOperations: [newer, older],
      operations: [newer, older],
    });

    const result = getStuckAccountAndOperation(account, null);

    expect(result?.operation).toBe(older);
  });

  it("resolves the main account from the parent account for a token account", () => {
    const operation = makeOperation({ id: "op-1", date: stuckDate() });
    const parentAccount = makeAccount({
      pendingOperations: [operation],
      operations: [operation],
    });
    const tokenAccount = { type: "TokenAccount" } as unknown as AccountLike;

    expect(getStuckAccountAndOperation(tokenAccount, parentAccount)).toEqual({
      account: parentAccount,
      parentAccount: undefined,
      operation,
    });
  });
});
