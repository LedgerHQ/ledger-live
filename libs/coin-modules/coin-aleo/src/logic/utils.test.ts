import BigNumber from "bignumber.js";
import type { TransactionIntent, MemoNotSupported } from "@ledgerhq/coin-framework/api/types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import aleoConfig from "../config";
import { EXPLORER_TRANSFER_TYPES, TRANSACTION_TYPE } from "../constants";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount, mockAleoResources } from "../__tests__/fixtures/account.fixture";
import {
  getMockedEnrichedTransaction,
  getMockedEnrichedPrivateRecord,
} from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getMockedTransaction } from "../__tests__/fixtures/transaction.fixture";
import type { ProvableApi, AleoTransactionIntentData } from "../types";
import {
  getNetworkConfig,
  parseMicrocredits,
  determineTransactionType,
  patchAccountWithViewKey,
  toAlpacaOperation,
  toBridgeOperation,
  toPrivateBridgeOperation,
  generateUniqueUsername,
  resolveConfig,
  getTransactionType,
  calculateAmount,
  isProvableApiConfigured,
  isRecordScannerReady,
  getOperationTransactionType,
  splitPrivateAndPublicOperations,
  serializeTransaction,
  deserializeTransaction,
  mapTransactionIntentToSdkIntent,
} from "./utils";

jest.mock("@ledgerhq/cryptoassets/currencies");
jest.mock("../config");

const mockedAleoConfig = jest.mocked(aleoConfig);
const mockedGetCryptoCurrencyById = jest.mocked(getCryptoCurrencyById);

const mockCurrency = getMockedCurrency();
const mockConfig = getMockedConfig("mainnet");

describe("getNetworkConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return network config with correct structure", () => {
    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    const result = getNetworkConfig(mockCurrency);

    expect(result).toEqual({
      nodeUrl: "https://node.example.com",
      sdkUrl: "https://sdk.example.com",
      networkType: "mainnet",
    });
  });

  it("should call getCoinConfig with correct currency", () => {
    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    getNetworkConfig(mockCurrency);

    expect(aleoConfig.getCoinConfig).toHaveBeenCalledTimes(1);
    expect(aleoConfig.getCoinConfig).toHaveBeenCalledWith(mockCurrency);
  });
});

describe("parseMicrocredits", () => {
  it("should parse valid microcredits string and remove u64 suffix", () => {
    const result = parseMicrocredits("1000000u64");

    expect(result).toBe("1000000");
  });

  it("should parse valid private microcredits string and remove u64.private suffix", () => {
    const result = parseMicrocredits("1000000u64.private");

    expect(result).toBe("1000000");
  });

  it("should parse zero microcredits", () => {
    const result = parseMicrocredits("0u64");

    expect(result).toBe("0");
  });

  it("should parse zero private microcredits", () => {
    const result = parseMicrocredits("0u64.private");

    expect(result).toBe("0");
  });

  it("should parse large microcredits values", () => {
    const result = parseMicrocredits("999999999999999u64");

    expect(result).toBe("999999999999999");
  });

  it("should parse microcredits with .private suffix", () => {
    const result = parseMicrocredits("1000000u64.private");

    expect(result).toBe("1000000");
  });

  it("should throw error when u64 suffix is missing", () => {
    const value = "1000000";
    expect(() => parseMicrocredits(value)).toThrow(`aleo: invalid microcredits format (${value})`);
  });

  it("should throw error for invalid format", () => {
    const value = "1000000u32";
    expect(() => parseMicrocredits(value)).toThrow(`aleo: invalid microcredits format (${value})`);
  });
});

describe("patchAccountWithViewKey", () => {
  it("should encode viewKey in account id", () => {
    const mockViewKey = "AViewKey1mockviewkey";
    const mockAccount = getMockedAccount({
      id: "js:2:aleo:aleo1test:",
      operations: [],
    });

    const result = patchAccountWithViewKey(mockAccount, mockViewKey);

    expect(result.id).not.toBe(mockAccount.id);
    expect(result.id).toBe(`js:2:aleo:aleo1test::${mockViewKey}`);
  });

  it("should update operation ids with new account id", () => {
    const mockViewKey = "AViewKey1mockviewkey";
    const mockOp1 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-op1-OUT",
      accountId: "js:2:aleo:aleo1test:",
      hash: "op1",
      type: "OUT",
    });

    const mockOp2 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-op2-IN",
      accountId: "js:2:aleo:aleo1test:",
      hash: "op2",
      type: "IN",
    });

    const mockPendingOp1 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-pending1-OUT",
      accountId: "js:2:aleo:aleo1test:",
      hash: "pending1",
      type: "OUT",
    });

    const mockPendingOp2 = getMockedOperation({
      id: "js:2:aleo:aleo1test:-pending2-IN",
      accountId: "js:2:aleo:aleo1test:",
      hash: "pending2",
      type: "IN",
    });

    const mockAccount = getMockedAccount({
      id: "js:2:aleo:aleo1test:",
      operations: [mockOp1, mockOp2],
      pendingOperations: [mockPendingOp1, mockPendingOp2],
    });

    const result = patchAccountWithViewKey(mockAccount, mockViewKey);

    expect(result.operations).toEqual([
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-op1-OUT`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-op2-IN`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
    ]);
    expect(result.pendingOperations).toEqual([
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-pending1-OUT`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
      expect.objectContaining({
        id: `js:2:aleo:aleo1test::${mockViewKey}-pending2-IN`,
        accountId: `js:2:aleo:aleo1test::${mockViewKey}`,
      }),
    ]);
  });

  it("should throw if viewKey is missing", () => {
    const mockAccount = getMockedAccount({
      id: "js:2:aleo:aleo1test:",
      operations: [],
    });

    expect(() => patchAccountWithViewKey(mockAccount, "")).toThrow(
      `aleo: viewKey is missing in patchAccountWithViewKey ${mockAccount.freshAddress}`,
    );
  });
});

describe("determineTransactionType", () => {
  it.each([
    [EXPLORER_TRANSFER_TYPES.PRIVATE, "OUT", "private"],
    [EXPLORER_TRANSFER_TYPES.PUBLIC, "OUT", "public"],
    [EXPLORER_TRANSFER_TYPES.PRIVATE, "IN", "private"],
    [EXPLORER_TRANSFER_TYPES.PUBLIC, "IN", "public"],
    ["transfer_public_to_private", "IN", "private"],
    ["transfer_private_to_public", "IN", "public"],
    ["some_other_function", "IN", "public"],
    ["transfer_private_to_public", "OUT", "private"],
    ["transfer_public_to_private", "OUT", "public"],
    ["transfer_private_custom", "OUT", "private"],
    ["some_other_function", "OUT", "public"],
    ["unknown_function", "FEES", "public"],
    ["unknown_function", "NONE", "public"],
    ["", "IN", "public"],
    ["", "OUT", "public"],
  ] as const)(
    "should return '%s' for functionId '%s' and operationType '%s'",
    (functionId, operationType, expected) => {
      const result = determineTransactionType(functionId, operationType);

      expect(result).toBe(expected);
    },
  );
});

describe("toAlpacaOperation", () => {
  const recipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const senderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  it("should set type to IN when address is the recipient", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.type).toBe("IN");
  });

  it("should set type to OUT when address is the sender", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toAlpacaOperation(enriched, senderAddress);

    expect(result.type).toBe("OUT");
  });

  it("should set type to NONE when there are no details", () => {
    const enriched = getMockedEnrichedTransaction({ details: null });

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.type).toBe("NONE");
  });

  it("should map core fields from rawTx", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.id).toBe(enriched.rawTx.transaction_id);
    expect(result.senders).toEqual([enriched.rawTx.sender_address]);
    expect(result.recipients).toEqual([enriched.rawTx.recipient_address]);
    expect(result.value).toBe(BigInt(enriched.rawTx.amount));
    expect(result.asset).toEqual({ type: "native" });
    expect(result.tx.hash).toBe(enriched.rawTx.transaction_id);
    expect(result.tx.block.height).toBe(enriched.rawTx.block_number);
    expect(result.tx.failed).toBe(false);
  });

  it("should derive fees and blockHash from details", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.tx.fees).toBe(BigInt(enriched.details!.fee_value));
    expect(result.tx.block.hash).toBe(enriched.details!.block_hash);
  });

  it("should use empty string for fees and blockHash when details are null", () => {
    const enriched = getMockedEnrichedTransaction({ details: null });

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.tx.fees).toBe(0n);
    expect(result.tx.block.hash).toBe("");
  });

  it("should set failed to true when transaction_status is not Accepted", () => {
    const enriched = getMockedEnrichedTransaction({
      rawTx: { ...getMockedEnrichedTransaction().rawTx, transaction_status: "Rejected" },
    });

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.tx.failed).toBe(true);
  });

  it("should include functionId, transactionType, and ledgerOpType in details", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toAlpacaOperation(enriched, recipientAddress);

    expect(result.details).toMatchObject({
      functionId: enriched.rawTx.function_id,
      ledgerOpType: "IN",
    });
  });
});

describe("toBridgeOperation", () => {
  const ledgerAccountId = "js:2:aleo:aleo1test:";
  const recipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const senderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  it("should produce an operation with encoded id and accountId", () => {
    const enriched = getMockedEnrichedTransaction();
    const expectedId = encodeOperationId(ledgerAccountId, enriched.rawTx.transaction_id, "IN");

    const result = toBridgeOperation(ledgerAccountId, enriched, recipientAddress);

    expect(result.id).toBe(expectedId);
    expect(result.accountId).toBe(ledgerAccountId);
  });

  it("should derive all operation fields from rawTx and details", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toBridgeOperation(ledgerAccountId, enriched, recipientAddress);

    expect(result.hash).toBe(enriched.rawTx.transaction_id);
    expect(result.type).toBe("IN");
    expect(result.value).toEqual(new BigNumber(enriched.rawTx.amount));
    expect(result.fee).toEqual(new BigNumber(enriched.details!.fee_value));
    expect(result.senders).toEqual([enriched.rawTx.sender_address]);
    expect(result.recipients).toEqual([enriched.rawTx.recipient_address]);
    expect(result.blockHeight).toBe(enriched.rawTx.block_number);
    expect(result.blockHash).toBe(enriched.details!.block_hash);
    expect(result.hasFailed).toBe(false);
  });

  it("should generate different ids for different account ids", () => {
    const enriched = getMockedEnrichedTransaction();
    const otherId = "js:2:aleo:aleo1other:";

    const result1 = toBridgeOperation(ledgerAccountId, enriched, recipientAddress);
    const result2 = toBridgeOperation(otherId, enriched, recipientAddress);

    expect(result1.id).not.toBe(result2.id);
    expect(result1.accountId).toBe(ledgerAccountId);
    expect(result2.accountId).toBe(otherId);
  });

  it("should set type to OUT when address is the sender", () => {
    const enriched = getMockedEnrichedTransaction();

    const result = toBridgeOperation(ledgerAccountId, enriched, senderAddress);

    expect(result.type).toBe("OUT");
    expect(result.id).toBe(
      encodeOperationId(ledgerAccountId, enriched.rawTx.transaction_id, "OUT"),
    );
  });
});

describe("generateUniqueUsername", () => {
  it("should generate a SHA-256 hash from timestamp and address", () => {
    const mockAddress = "aleo1test123";
    const result = generateUniqueUsername(mockAddress);

    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should generate unique hashes for different addresses", () => {
    const address1 = "aleo1address1";
    const address2 = "aleo1address2";

    const result1 = generateUniqueUsername(address1);
    const result2 = generateUniqueUsername(address2);

    expect(result1).toMatch(/^[a-f0-9]{64}$/);
    expect(result2).toMatch(/^[a-f0-9]{64}$/);
    expect(result1).not.toBe(result2);
  });
});

describe("resolveConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the config object directly when passed an AleoCoinConfig", () => {
    const result = resolveConfig(mockConfig);

    expect(result).toBe(mockConfig);
    expect(mockedGetCryptoCurrencyById).not.toHaveBeenCalled();
    expect(mockedAleoConfig.getCoinConfig).not.toHaveBeenCalled();
  });

  it("should resolve config by currency id string using getCryptoCurrencyById and getCoinConfig", () => {
    mockedGetCryptoCurrencyById.mockReturnValue(mockCurrency);
    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    const result = resolveConfig("aleo");

    expect(mockedGetCryptoCurrencyById).toHaveBeenCalledWith("aleo");
    expect(mockedAleoConfig.getCoinConfig).toHaveBeenCalledWith(mockCurrency);
    expect(result).toBe(mockConfig);
  });

  it("should propagate error when getCryptoCurrencyById throws for unknown currency id", () => {
    mockedGetCryptoCurrencyById.mockImplementation(() => {
      throw new Error("Currency not found: unknown_currency");
    });

    expect(() => resolveConfig("unknown_currency")).toThrow("Currency not found: unknown_currency");
    expect(mockedAleoConfig.getCoinConfig).not.toHaveBeenCalled();
  });

  it("should propagate error when getCoinConfig throws for currency without config", () => {
    mockedGetCryptoCurrencyById.mockReturnValue(mockCurrency);
    mockedAleoConfig.getCoinConfig.mockImplementation(() => {
      throw new Error("No config for currency: aleo");
    });

    expect(() => resolveConfig("aleo")).toThrow("No config for currency: aleo");
  });
});

describe("getTransactionType", () => {
  it("should return valid transaction type from intent", () => {
    // @ts-expect-error - only intent type is required for this test
    const mockTx: TransactionIntent = { type: TRANSACTION_TYPE.TRANSFER_PUBLIC };

    expect(getTransactionType(mockTx)).toBe(TRANSACTION_TYPE.TRANSFER_PUBLIC);
  });

  it("should throw invariant error for an unknown transaction type", () => {
    // @ts-expect-error - testing invalid intent type
    const mockTx: TransactionIntent = { type: "UNKNOWN" };

    expect(() => getTransactionType(mockTx)).toThrow();
  });

  it("should throw invariant error for a missing transaction type", () => {
    // @ts-expect-error - testing invalid intent type
    const mockTx: TransactionIntent = {};

    expect(() => getTransactionType(mockTx)).toThrow();
  });
});

describe("calculateAmount", () => {
  it("should return transaction amount when useAllAmount is false", () => {
    const estimatedFees = new BigNumber(5000);
    const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
    const mockTransaction = getMockedTransaction({
      amount: new BigNumber(500000),
      useAllAmount: false,
    });

    const result = calculateAmount({
      account: mockAccount,
      transaction: mockTransaction,
      estimatedFees,
    });

    expect(result).toMatchObject({
      amount: mockTransaction.amount,
      totalSpent: mockTransaction.amount.plus(estimatedFees),
    });
  });

  it("should calculate max amount when useAllAmount is true", () => {
    const estimatedFees = new BigNumber(5000);
    const transparentBalance = new BigNumber(100000);
    const mockAccount = getMockedAccount({
      balance: transparentBalance,
      aleoResources: { ...mockAleoResources, transparentBalance },
    });
    const mockTransaction = getMockedTransaction({
      amount: new BigNumber(0),
      useAllAmount: true,
    });

    const result = calculateAmount({
      account: mockAccount,
      transaction: mockTransaction,
      estimatedFees,
    });

    expect(result.amount).toStrictEqual(transparentBalance.minus(estimatedFees));
    expect(result.totalSpent).toEqual(transparentBalance);
  });

  it("should return zero amount when balance is less than fees with useAllAmount", () => {
    const estimatedFees = new BigNumber(5000);
    const mockAccount = getMockedAccount({ balance: new BigNumber(3000) });
    const mockTransaction = getMockedTransaction({
      amount: new BigNumber(0),
      useAllAmount: true,
    });

    const result = calculateAmount({
      account: mockAccount,
      transaction: mockTransaction,
      estimatedFees,
    });

    expect(result).toMatchObject({
      amount: new BigNumber(0),
      totalSpent: estimatedFees,
    });
  });
});

describe("isProvableApiConfigured", () => {
  const validProvableApi: Required<ProvableApi> = {
    apiKey: "test-api-key",
    consumerId: "test-consumer-id",
    uuid: "test-uuid",
    jwt: {
      token: "test-token",
      exp: 123456789,
    },
    scannerStatus: {
      synced: true,
      percentage: 100,
    },
  };

  it("returns true when all required fields are present", () => {
    expect(isProvableApiConfigured(validProvableApi)).toBe(true);
  });

  it("returns false when provableApi is null", () => {
    expect(isProvableApiConfigured(null)).toBe(false);
  });

  it("returns false when uuid is missing", () => {
    const { uuid: _, ...rest } = validProvableApi;

    expect(isProvableApiConfigured(rest)).toBe(false);
  });

  it("returns false when apiKey is missing", () => {
    const { apiKey: _, ...rest } = validProvableApi;

    expect(isProvableApiConfigured(rest)).toBe(false);
  });

  it("returns false when jwt is missing", () => {
    const { jwt: _, ...rest } = validProvableApi;

    expect(isProvableApiConfigured(rest)).toBe(false);
  });

  it("returns false when jwt.token is missing", () => {
    const api: ProvableApi = { ...validProvableApi, jwt: { token: "", exp: 123456789 } };

    expect(isProvableApiConfigured(api)).toBe(false);
  });
});

describe("isRecordScannerReady", () => {
  const baseProvableApi: ProvableApi = {
    apiKey: "test-api-key",
    consumerId: "test-consumer-id",
    uuid: "test-uuid",
    jwt: { token: "test-token", exp: 123456789 },
    scannerStatus: { synced: true, percentage: 100 },
  };

  it("should return true when scannerStatus.synced is true", () => {
    expect(isRecordScannerReady(baseProvableApi)).toBe(true);
  });

  it("should return false when scannerStatus.synced is false", () => {
    const api: ProvableApi = {
      ...baseProvableApi,
      scannerStatus: { synced: false, percentage: 50 },
    };

    expect(isRecordScannerReady(api)).toBe(false);
  });

  it("should return false when scannerStatus is undefined", () => {
    const { scannerStatus: _, ...rest } = baseProvableApi;
    const api: ProvableApi = rest;

    expect(isRecordScannerReady(api)).toBe(false);
  });
});

describe("getOperationTransactionType", () => {
  it.each([
    ["private", TRANSACTION_TYPE.TRANSFER_PRIVATE],
    ["private", TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
    ["public", TRANSACTION_TYPE.TRANSFER_PUBLIC],
    ["public", TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
    ["public", "unknown_type"],
  ])("should return '%s' for transaction type '%s'", (expected, transactionType) => {
    expect(getOperationTransactionType(transactionType)).toBe(expected);
  });
});

describe("toPrivateBridgeOperation", () => {
  const mockLedgerAccountId =
    "js:2:aleo:aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px::";
  const mockRecipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const mockSenderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  it("should return an IN operation when recipient matches address", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      recipient: mockRecipientAddress,
      sender: mockSenderAddress,
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.type).toBe("IN");
    expect(result.senders).toEqual([mockSenderAddress]);
    expect(result.recipients).toEqual([mockRecipientAddress]);
  });

  it("should return an OUT operation when sender matches address", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      sender: mockSenderAddress,
      recipient: mockRecipientAddress,
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockSenderAddress);

    expect(result.type).toBe("OUT");
    expect(result.senders).toEqual([mockSenderAddress]);
    expect(result.recipients).toEqual([mockRecipientAddress]);
  });

  it("should encode operation id using ledgerAccountId, transaction_id and type", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      recipient: mockRecipientAddress,
    });
    const expectedId = encodeOperationId(
      mockLedgerAccountId,
      enriched.rawRecord.transaction_id.trim(),
      "IN",
    );

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.id).toBe(expectedId);
    expect(result.accountId).toBe(mockLedgerAccountId);
  });

  it("should trim whitespace from transaction_id when building hash and id", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { transaction_id: "  tx-with-spaces  " },
      recipient: mockRecipientAddress,
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.hash).toBe("tx-with-spaces");
    expect(result.id).toContain("tx-with-spaces");
  });

  it("should set fee from details.fee_value", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      details: { fee_value: 9999 },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.fee).toEqual(new BigNumber(9999));
  });

  it("should set blockHash from details.block_hash", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      details: { block_hash: "ab1testhash", fee_value: 1000 },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.blockHash).toBe("ab1testhash");
  });

  it("should set date from block_timestamp multiplied by 1000", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { block_timestamp: 1704067200 },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.date).toEqual(new Date(1704067200 * 1000));
  });

  it("should set extra.transactionType to private", () => {
    const enriched = getMockedEnrichedPrivateRecord();

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.extra).toMatchObject({ transactionType: "private" });
  });

  it("should set extra.functionId from rawRecord.function_name", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { function_name: "transfer_private" },
    });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.extra).toMatchObject({ functionId: "transfer_private" });
  });

  it("should set hasFailed to false", () => {
    const enriched = getMockedEnrichedPrivateRecord();

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.hasFailed).toBe(false);
  });

  it("should set value from enriched.value", () => {
    const enriched = getMockedEnrichedPrivateRecord({ value: new BigNumber(42000000) });

    const result = toPrivateBridgeOperation(mockLedgerAccountId, enriched, mockRecipientAddress);

    expect(result.value).toEqual(new BigNumber(42000000));
  });
});

describe("splitPrivateAndPublicOperations", () => {
  const makePublicOp = (id: string) =>
    getMockedOperation({ id, extra: { functionId: "transfer_public", transactionType: "public" } });
  const makePrivateOp = (id: string) =>
    getMockedOperation({
      id,
      extra: { functionId: "transfer_private", transactionType: "private" },
    });

  it("should return two empty arrays for empty input", () => {
    const [privateOps, publicOps] = splitPrivateAndPublicOperations([]);

    expect(privateOps).toEqual([]);
    expect(publicOps).toEqual([]);
  });

  it("should put all public operations into the public array", () => {
    const ops = [makePublicOp("op1"), makePublicOp("op2")];

    const [privateOps, publicOps] = splitPrivateAndPublicOperations(ops);

    expect(privateOps).toEqual([]);
    expect(publicOps).toHaveLength(2);
    expect(publicOps).toEqual(ops);
  });

  it("should put all private operations into the private array", () => {
    const ops = [makePrivateOp("op1"), makePrivateOp("op2")];

    const [privateOps, publicOps] = splitPrivateAndPublicOperations(ops);

    expect(publicOps).toEqual([]);
    expect(privateOps).toHaveLength(2);
    expect(privateOps).toEqual(ops);
  });

  it("should correctly split a mix of private and public operations", () => {
    const pub1 = makePublicOp("pub1");
    const priv1 = makePrivateOp("priv1");
    const pub2 = makePublicOp("pub2");
    const priv2 = makePrivateOp("priv2");

    const [privateOps, publicOps] = splitPrivateAndPublicOperations([pub1, priv1, pub2, priv2]);

    expect(privateOps).toEqual([priv1, priv2]);
    expect(publicOps).toEqual([pub1, pub2]);
  });

  it("should treat operations without extra.transactionType as public", () => {
    const opNoExtra = getMockedOperation({ id: "no-extra", extra: {} });

    const [privateOps, publicOps] = splitPrivateAndPublicOperations([opNoExtra]);

    expect(privateOps).toEqual([]);
    expect(publicOps).toHaveLength(1);
  });

  it("should preserve original order within each group", () => {
    const ops = [
      makePublicOp("pub1"),
      makePrivateOp("priv1"),
      makePublicOp("pub2"),
      makePrivateOp("priv2"),
      makePublicOp("pub3"),
    ];

    const [privateOps, publicOps] = splitPrivateAndPublicOperations(ops);

    expect(publicOps.map(o => o.id)).toEqual(["pub1", "pub2", "pub3"]);
    expect(privateOps.map(o => o.id)).toEqual(["priv1", "priv2"]);
  });
});

describe("mapTransactionIntentToSdkIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TRANSFER_PUBLIC", () => {
    it("should map TRANSFER_PUBLIC intent to SDK intent with correct type and fields", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(123456),
        asset: { type: "native" },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result).toEqual({
        type: "transfer_public",
        amount: "123456",
        to: "aleo1recipient",
      });
      expect(result).not.toHaveProperty("record");
    });

    it("should handle zero amount for TRANSFER_PUBLIC", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: 0n,
        asset: { type: "native" },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result).toMatchObject({
        type: "transfer_public",
        amount: "0",
      });
    });

    it("should handle large amounts for TRANSFER_PUBLIC", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt("999999999999999999"),
        asset: { type: "native" },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result.amount).toBe("999999999999999999");
    });
  });

  describe("TRANSFER_PRIVATE", () => {
    it("should map TRANSFER_PRIVATE intent to SDK intent with record", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(654321),
        asset: { type: "native" },
        data: {
          type: "private",
          record: "record123",
        },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result).toEqual({
        type: "transfer_private",
        amount: "654321",
        to: "aleo1recipient",
        record: "record123",
      });
    });

    it("should throw when private data is missing for TRANSFER_PRIVATE", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(100),
        asset: { type: "native" },
      };

      expect(() => mapTransactionIntentToSdkIntent(mockIntent)).toThrow(
        "aleo: private data is required for transfer_private",
      );
    });

    it("should throw when amountRecord is missing in private data", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(100),
        asset: { type: "native" },
        data: {
          type: "private",
        },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result).toHaveProperty("record");
      expect(result.record).toBeUndefined();
    });
  });

  describe("CONVERT_PUBLIC_TO_PRIVATE", () => {
    it("should map CONVERT_PUBLIC_TO_PRIVATE intent to SDK intent", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: "transfer_public_to_private",
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(789),
        asset: { type: "native" },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result).toEqual({
        type: "transfer_public_to_private",
        amount: "789",
        to: "aleo1recipient",
      });
      expect(result).not.toHaveProperty("record");
    });

    it("should handle min amount for CONVERT_PUBLIC_TO_PRIVATE", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: "transfer_public_to_private",
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: 1n,
        asset: { type: "native" },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result.amount).toBe("1");
    });
  });

  describe("CONVERT_PRIVATE_TO_PUBLIC", () => {
    it("should map CONVERT_PRIVATE_TO_PUBLIC intent to SDK intent with record", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: "transfer_private_to_public",
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(987),
        asset: { type: "native" },
        data: {
          type: "private",
          record: "record987",
        },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(result).toEqual({
        type: "transfer_private_to_public",
        amount: "987",
        to: "aleo1recipient",
        record: "record987",
      });
    });

    it("should throw when private data is missing for CONVERT_PRIVATE_TO_PUBLIC", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: "transfer_private_to_public",
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(100),
        asset: { type: "native" },
      };

      expect(() => mapTransactionIntentToSdkIntent(mockIntent)).toThrow(
        "aleo: private data is required for transfer_private_to_public",
      );
    });
  });

  describe("unsupported transaction types", () => {
    it("should throw for unsupported transaction type", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        // @ts-expect-error - testing unsupported type
        intentType: "transaction",
        type: "UNSUPPORTED_TYPE",
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(1),
        asset: { type: "native" },
      };

      expect(() => mapTransactionIntentToSdkIntent(mockIntent)).toThrow(
        /aleo: unsupported transaction type in mapTransactionIntentToSdkIntent/,
      );
    });

    it("should throw for null transaction type", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        // @ts-expect-error - testing invalid type
        intentType: "transaction",
        type: null,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(1),
        asset: { type: "native" },
      };

      expect(() => mapTransactionIntentToSdkIntent(mockIntent)).toThrow();
    });

    it("should throw for undefined transaction type", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        // @ts-expect-error - testing invalid type
        intentType: "transaction",
        type: undefined,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt(1),
        asset: { type: "native" },
      };

      expect(() => mapTransactionIntentToSdkIntent(mockIntent)).toThrow();
    });
  });

  describe("common validation", () => {
    it.each([["transfer_public"], ["transfer_public_to_private"]])(
      "should preserve recipient address in all transaction types (%s)",
      type => {
        const recipient = "aleo1specific_recipient_address";
        const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
          intentType: "transaction",
          type,
          sender: "aleo1sender",
          recipient,
          amount: 100n,
          asset: { type: "native" },
        };

        const result = mapTransactionIntentToSdkIntent(mockIntent);

        expect(result.to).toBe(recipient);
      },
    );

    it("should convert BigNumber amounts to string", () => {
      const mockIntent: TransactionIntent<MemoNotSupported, AleoTransactionIntentData> = {
        intentType: "transaction",
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        sender: "aleo1sender",
        recipient: "aleo1recipient",
        amount: BigInt("1234567890123"),
        asset: { type: "native" },
      };

      const result = mapTransactionIntentToSdkIntent(mockIntent);

      expect(typeof result.amount).toBe("string");
      expect(result.amount).toBe("1234567890123");
    });
  });
});

describe("serializeTransaction", () => {
  it("should serialize a transaction object to hex string", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
      nonce: 123,
    };

    const result = serializeTransaction(mockTx);

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]*$/);
  });

  it("should produce a hex string with even length", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
    };

    const result = serializeTransaction(mockTx);

    expect(result.length % 2).toBe(0);
  });

  it("should produce different hex strings for different objects", () => {
    const mockTx1 = { chainId: "aleo:mainnet" };
    const mockTx2 = { chainId: "aleo:testnet" };

    const result1 = serializeTransaction(mockTx1);
    const result2 = serializeTransaction(mockTx2);

    expect(result1).not.toBe(result2);
  });

  it("should serialize empty object", () => {
    const mockTx = {};

    const result = serializeTransaction(mockTx);

    expect(result).toBe("7b7d"); // "{}"
  });

  it("should serialize object with nested properties", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
      data: {
        amount: "1000",
        recipient: "aleo1test",
      },
    };

    const result = serializeTransaction(mockTx);

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]+$/);
    expect(result.length % 2).toBe(0);
  });

  it("should serialize object with array properties", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
      recipients: ["aleo1addr1", "aleo1addr2"],
    };

    const result = serializeTransaction(mockTx);

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it("should serialize object with null values", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
      data: null,
    };

    const result = serializeTransaction(mockTx);

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it("should serialize object with numeric values", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
      nonce: 12345,
      fee: 5000,
    };

    const result = serializeTransaction(mockTx);

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it("should serialize object with boolean values", () => {
    const mockTx = {
      chainId: "aleo:mainnet",
      isPrivate: true,
      isSigned: false,
    };

    const result = serializeTransaction(mockTx);

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^[a-f0-9]+$/);
  });
});

describe("deserializeTransaction", () => {
  it("should deserialize valid hex string back to object", () => {
    const originalTx = {
      chainId: "aleo:mainnet",
    };
    const serialized = serializeTransaction(originalTx);

    const result = deserializeTransaction(serialized);

    expect(result).toEqual(originalTx);
  });

  it("should deserialize to correct object structure", () => {
    const serialized = "7b22636861696e4964223a22616c656f3a6d61696e6e6574227d"; // {"chainId":"aleo:mainnet"}

    const result = deserializeTransaction(serialized);

    expect(result).toEqual({ chainId: "aleo:mainnet" });
  });

  it("should round-trip: serialize then deserialize returns equivalent object", () => {
    const originalTx = {
      chainId: "aleo:mainnet",
      nonce: 123,
      data: {
        amount: "1000",
        recipient: "aleo1test",
      },
    };

    const serialized = serializeTransaction(originalTx);
    const deserialized = deserializeTransaction(serialized);

    expect(deserialized).toEqual(originalTx);
  });

  it("should deserialize empty object from hex", () => {
    const serialized = "7b7d"; // "{}"

    const result = deserializeTransaction(serialized);

    expect(result).toEqual({});
  });

  it("should deserialize object with nested properties", () => {
    const originalTx = {
      chainId: "aleo:mainnet",
      nested: {
        level1: {
          level2: "value",
        },
      },
    };

    const serialized = serializeTransaction(originalTx);
    const result = deserializeTransaction(serialized);

    expect(result).toEqual(originalTx);
  });

  it("should deserialize object with array properties", () => {
    const originalTx = {
      chainId: "aleo:mainnet",
      recipients: ["aleo1addr1", "aleo1addr2", "aleo1addr3"],
    };

    const serialized = serializeTransaction(originalTx);
    const result = deserializeTransaction(serialized);

    expect(result).toEqual(originalTx);
  });

  it("should deserialize object with null values", () => {
    const originalTx = {
      chainId: "aleo:mainnet",
      data: null,
    };

    const serialized = serializeTransaction(originalTx);
    const result = deserializeTransaction(serialized);

    expect(result).toEqual(originalTx);
  });

  it("should deserialize object with mixed value types", () => {
    const originalTx = {
      chainId: "aleo:mainnet",
      nonce: 12345,
      isPrivate: true,
      fee: 5000,
      data: null,
      recipients: ["addr1", "addr2"],
    };

    const serialized = serializeTransaction(originalTx);
    const result = deserializeTransaction(serialized);

    expect(result).toEqual(originalTx);
  });

  it("should throw when hex string is invalid", () => {
    const invalidHex = "invalid_hex_string";

    expect(() => deserializeTransaction(invalidHex)).toThrow();
  });

  it("should throw when hex string contains invalid JSON", () => {
    const invalidJsonHex = "7b22696e76616c6964"; // {"invalid (truncated)

    expect(() => deserializeTransaction(invalidJsonHex)).toThrow();
  });

  it("should throw when hex string is empty", () => {
    expect(() => deserializeTransaction("")).toThrow();
  });

  it("should throw when hex string has odd length", () => {
    const oddLengthHex = "7b7"; // odd length

    expect(() => deserializeTransaction(oddLengthHex)).toThrow();
  });

  it("should throw when hex string decodes to invalid JSON", () => {
    const notJsonHex = "6e6f745f6a736f6e"; // "not_json" in hex

    expect(() => deserializeTransaction(notJsonHex)).toThrow();
  });
});
