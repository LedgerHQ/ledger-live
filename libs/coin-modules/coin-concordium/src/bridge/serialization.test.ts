import BigNumber from "bignumber.js";
import type { ConcordiumResources, RawOperation } from "../types";
import {
  createTestAccount,
  createTestConcordiumAccount,
  createTestAccountRaw,
  createTestConcordiumAccountRaw,
} from "../test/testHelpers";
import {
  mapRawOperationToBridgeOperation,
  isConcordiumAccount,
  assignToAccountRaw,
  assignFromAccountRaw,
} from "./serialization";

const ACCOUNT_ID = "js:2:concordium_testnet:someaddr:";

function createRawOperation(overrides?: Partial<RawOperation>): RawOperation {
  return {
    hash: "aa".repeat(32),
    type: "OUT",
    sender: "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w",
    recipient: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
    amount: "1000000",
    fee: "500",
    value: "1000500",
    memo: undefined,
    date: new Date("2024-06-01T00:00:00Z"),
    blockHash: "bbcc",
    blockHeight: 500,
    failed: false,
    id: 42,
    ...overrides,
  };
}

describe("isConcordiumAccount", () => {
  it("should return true for valid Concordium account", () => {
    const account = createTestConcordiumAccount({
      concordiumResources: {
        isOnboarded: true,
        credId: "abc",
        publicKey: "def",
        identityIndex: 0,
        credNumber: 0,
        ipIdentity: 0,
      },
    });

    const result = isConcordiumAccount(account);

    expect(result).toBe(true);
  });

  it("should return false for non-Concordium currency", () => {
    const account = createTestAccount({
      currency: {
        ...createTestAccount().currency,
        family: "ethereum",
      },
    });

    const result = isConcordiumAccount(account);

    expect(result).toBe(false);
  });

  it("should return false when concordiumResources is missing", () => {
    const account = createTestAccount();

    const result = isConcordiumAccount(account);

    expect(result).toBe(false);
  });

  it("should return false when currency is undefined", () => {
    const account = createTestAccount();
    delete (account as { currency?: unknown }).currency;

    const result = isConcordiumAccount(account);

    expect(result).toBe(false);
  });
});

describe("assignToAccountRaw", () => {
  it("should copy concordiumResources to accountRaw", () => {
    const resources: ConcordiumResources = {
      isOnboarded: true,
      credId: "cred123",
      publicKey: "pub456",
      identityIndex: 0,
      credNumber: 1,
      ipIdentity: 2,
    };
    const account = createTestConcordiumAccount({ concordiumResources: resources });
    const accountRaw = createTestAccountRaw();

    assignToAccountRaw(account, accountRaw);

    expect("concordiumResources" in accountRaw).toBe(true);
    if ("concordiumResources" in accountRaw) {
      expect(accountRaw.concordiumResources).toEqual({
        isOnboarded: true,
        credId: "cred123",
        publicKey: "pub456",
        identityIndex: 0,
        credNumber: 1,
        ipIdentity: 2,
      });
    }
  });

  it("should not modify accountRaw when concordiumResources is missing", () => {
    const account = createTestAccount();
    const accountRaw = createTestAccountRaw();

    assignToAccountRaw(account, accountRaw);

    expect("concordiumResources" in accountRaw).toBe(false);
  });

  it("should handle undefined values in resources", () => {
    const resources = {
      isOnboarded: false,
    } as ConcordiumResources;
    const account = createTestConcordiumAccount({ concordiumResources: resources });
    const accountRaw = createTestAccountRaw();

    assignToAccountRaw(account, accountRaw);

    expect("concordiumResources" in accountRaw).toBe(true);
    if ("concordiumResources" in accountRaw) {
      expect(accountRaw.concordiumResources).not.toBeUndefined();
      expect((accountRaw.concordiumResources as any)?.isOnboarded).toBe(false);
    }
  });
});

describe("assignFromAccountRaw", () => {
  it("should copy concordiumResources from accountRaw to account", () => {
    const accountRaw = createTestConcordiumAccountRaw({
      concordiumResources: {
        isOnboarded: true,
        credId: "cred789",
        publicKey: "pub012",
        identityIndex: 3,
        credNumber: 4,
        ipIdentity: 5,
      },
    });
    const account = createTestAccount();

    assignFromAccountRaw(accountRaw, account);

    expect("concordiumResources" in account).toBe(true);
    if ("concordiumResources" in account) {
      expect(account.concordiumResources).toEqual({
        isOnboarded: true,
        credId: "cred789",
        publicKey: "pub012",
        identityIndex: 3,
        credNumber: 4,
        ipIdentity: 5,
      });
    }
  });

  it("should not modify account when concordiumResources is missing in raw", () => {
    const accountRaw = createTestAccountRaw();
    const account = createTestAccount();

    assignFromAccountRaw(accountRaw, account);

    expect("concordiumResources" in account).toBe(false);
  });
});

describe("roundtrip serialization", () => {
  it("should preserve all fields through toRaw and fromRaw", () => {
    const originalResources: ConcordiumResources = {
      isOnboarded: true,
      credId: "roundtrip-cred",
      publicKey: "roundtrip-key",
      identityIndex: 10,
      credNumber: 20,
      ipIdentity: 30,
    };
    const account = createTestConcordiumAccount({ concordiumResources: originalResources });

    const accountRaw = createTestAccountRaw();
    assignToAccountRaw(account, accountRaw);
    const restoredAccount = createTestAccount();
    assignFromAccountRaw(accountRaw, restoredAccount);

    expect("concordiumResources" in restoredAccount).toBe(true);
    if ("concordiumResources" in restoredAccount) {
      expect(restoredAccount.concordiumResources).toEqual(originalResources);
    }
  });
});

describe("mapRawOperationToBridgeOperation", () => {
  it("should map a RawOperation to a bridge Operation with BigNumber values", () => {
    const raw = createRawOperation();
    const result = mapRawOperationToBridgeOperation(raw, ACCOUNT_ID);

    expect(result.value).toEqual(new BigNumber(1000500));
    expect(result.fee).toEqual(new BigNumber(500));
    expect(result.type).toBe("OUT");
    expect(result.hash).toBe(raw.hash);
    expect(result.accountId).toBe(ACCOUNT_ID);
    expect(result.senders).toEqual([raw.sender]);
    expect(result.recipients).toEqual([raw.recipient]);
    expect(result.blockHash).toBe("bbcc");
    expect(result.blockHeight).toBe(500);
    expect(result.date).toBe(raw.date);
  });

  it("should include memo in extra when present", () => {
    const raw = createRawOperation({ memo: "test memo" });
    const result = mapRawOperationToBridgeOperation(raw, ACCOUNT_ID);

    expect((result.extra as Record<string, unknown>)?.memo).toBe("test memo");
  });

  it("should not include memo in extra when absent", () => {
    const raw = createRawOperation({ memo: undefined });
    const result = mapRawOperationToBridgeOperation(raw, ACCOUNT_ID);

    expect((result.extra as Record<string, unknown>)?.memo).toBeUndefined();
  });

  it("should map IN operations correctly", () => {
    const raw = createRawOperation({ type: "IN", value: "2000000", fee: "0" });
    const result = mapRawOperationToBridgeOperation(raw, ACCOUNT_ID);

    expect(result.type).toBe("IN");
    expect(result.value).toEqual(new BigNumber(2000000));
    expect(result.fee).toEqual(new BigNumber(0));
  });

  it("should handle null blockHash", () => {
    const raw = createRawOperation({ blockHash: null });
    const result = mapRawOperationToBridgeOperation(raw, ACCOUNT_ID);

    expect(result.blockHash).toBeNull();
  });
});
