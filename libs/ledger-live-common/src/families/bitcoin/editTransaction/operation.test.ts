import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import type { BitcoinCoinConfig } from "@ledgerhq/coin-bitcoin/config";
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
