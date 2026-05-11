import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import aleoConfig from "../config";
import {
  EXPLORER_TRANSFER_TYPES,
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  TRANSACTION_TYPE,
} from "../constants";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedAccount,
  mockAleoResources,
  mockUnspentRecord1,
  mockUnspentRecord2,
} from "../__tests__/fixtures/account.fixture";
import {
  getMockedTransaction as getMockedPublicTransaction,
  getMockedEnrichedPrivateRecord,
} from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getMockedPreparedRequestResponse } from "../__tests__/fixtures/sdk.fixture";
import {
  getMockedTransaction,
  mockTxIntentFeePrivate,
  mockTxIntentFeePublic,
  mockTxIntentSelfTransferToPrivate,
  mockTxIntentSelfTransferToPublic,
  mockTxIntentSelfTransferToPublic2,
  mockTxIntentTransferPrivate,
  mockTxIntentTransferPrivate2,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import type { AleoOperationExtra, ProvableApi } from "../types";
import {
  getNetworkConfig,
  parseMicrocredits,
  determineTransactionType,
  patchAccountWithViewKey,
  toCoinFrameworkOperation,
  toBridgeOperation,
  toPrivateBridgeOperation,
  resolveConfig,
  getTransactionType,
  calculateAmount,
  isProvableApiConfigured,
  isRecordScannerReady,
  getOperationTransactionType,
  splitPrivateAndPublicOperations,
  toHex,
  fromHex,
  mapTransactionIntentToSdkIntent,
  hasSpecificIntentData,
  getOperationDetailsExtraFields,
  getAvailableBalance,
  isSelfTransferTransaction,
  isPublicTransaction,
  isPrivateTransaction,
  createTransactionIntent,
  createFeeTransactionIntent,
  getRecordByCommitment,
  getFunctionNameFromTransactionType,
  getNextSequenceNumber,
  extractViewKey,
  findBestRecordForFee,
  selectPrivateRecordsForAmount,
  getEstimatedSigningTime,
  sumPrivateRecords,
} from "./utils";

jest.mock("../config");

const mockedAleoConfig = jest.mocked(aleoConfig);

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
    expect(aleoConfig.getCoinConfig).toHaveBeenCalledWith(mockCurrency.id);
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

describe("toCoinFrameworkOperation", () => {
  const recipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const senderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  it("should set type to IN when address is the recipient", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toCoinFrameworkOperation(rawTx, recipientAddress);

    expect(result.type).toBe("IN");
  });

  it("should set type to OUT when address is the sender", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toCoinFrameworkOperation(rawTx, senderAddress);

    expect(result.type).toBe("OUT");
  });

  it("should set type to NONE when program_id is not CREDITS", () => {
    const rawTx = getMockedPublicTransaction({ program_id: "custom.aleo" });

    const result = toCoinFrameworkOperation(rawTx, recipientAddress);

    expect(result.type).toBe("NONE");
  });

  it("should map core fields from rawTx", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toCoinFrameworkOperation(rawTx, recipientAddress);

    expect(result.id).toBe(rawTx.transaction_id);
    expect(result.senders).toEqual([rawTx.sender_address]);
    expect(result.recipients).toEqual([rawTx.recipient_address]);
    expect(result.value).toBe(BigInt(rawTx.amount));
    expect(result.asset).toEqual({ type: "native" });
    expect(result.tx.hash).toBe(rawTx.transaction_id);
    expect(result.tx.block.height).toBe(rawTx.block_number);
    expect(result.tx.failed).toBe(false);
  });

  it("should derive fees and blockHash from rawTx", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toCoinFrameworkOperation(rawTx, recipientAddress);

    expect(result.tx.fees).toBe(BigInt(rawTx.fee));
    expect(result.tx.block.hash).toBe(rawTx.block_hash);
  });

  it("should set failed to true when transaction_status is not Accepted", () => {
    const rawTx = getMockedPublicTransaction({ transaction_status: "Rejected" });

    const result = toCoinFrameworkOperation(rawTx, recipientAddress);

    expect(result.tx.failed).toBe(true);
  });

  it("should include functionId, transactionType, and ledgerOpType in details", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toCoinFrameworkOperation(rawTx, recipientAddress);

    expect(result.details).toMatchObject({
      functionId: rawTx.function_id,
      ledgerOpType: "IN",
    });
  });
});

describe("toBridgeOperation", () => {
  const ledgerAccountId = "js:2:aleo:aleo1test:";
  const recipientAddress = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const senderAddress = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

  it("should produce an operation with encoded id and accountId", () => {
    const rawTx = getMockedPublicTransaction();
    const expectedId = encodeOperationId(ledgerAccountId, rawTx.transaction_id, "IN");

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(result.id).toBe(expectedId);
    expect(result.accountId).toBe(ledgerAccountId);
  });

  it("should derive all operation fields from rawTx", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);

    expect(result.hash).toBe(rawTx.transaction_id);
    expect(result.type).toBe("IN");
    expect(result.value).toEqual(new BigNumber(rawTx.amount));
    expect(result.fee).toEqual(new BigNumber(rawTx.fee));
    expect(result.senders).toEqual([rawTx.sender_address]);
    expect(result.recipients).toEqual([rawTx.recipient_address]);
    expect(result.blockHeight).toBe(rawTx.block_number);
    expect(result.blockHash).toBe(rawTx.block_hash);
    expect(result.hasFailed).toBe(false);
  });

  it("should generate different ids for different account ids", () => {
    const rawTx = getMockedPublicTransaction();
    const otherId = "js:2:aleo:aleo1other:";

    const result1 = toBridgeOperation(ledgerAccountId, rawTx, recipientAddress);
    const result2 = toBridgeOperation(otherId, rawTx, recipientAddress);

    expect(result1.id).not.toBe(result2.id);
    expect(result1.accountId).toBe(ledgerAccountId);
    expect(result2.accountId).toBe(otherId);
  });

  it("should set type to OUT when address is the sender", () => {
    const rawTx = getMockedPublicTransaction();

    const result = toBridgeOperation(ledgerAccountId, rawTx, senderAddress);

    expect(result.type).toBe("OUT");
    expect(result.id).toBe(encodeOperationId(ledgerAccountId, rawTx.transaction_id, "OUT"));
  });
});

describe("resolveConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the config object directly when passed an AleoCoinConfig", () => {
    const result = resolveConfig(mockConfig);

    expect(result).toBe(mockConfig);
    expect(mockedAleoConfig.getCoinConfig).not.toHaveBeenCalled();
  });

  it("should resolve config by currency id string using getCoinConfig", () => {
    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    const result = resolveConfig("aleo");

    expect(mockedAleoConfig.getCoinConfig).toHaveBeenCalledWith("aleo");
    expect(result).toBe(mockConfig);
  });

  it("should propagate error when getCoinConfig throws for currency without config", () => {
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

  it("should sum multiple amount records for private transactions with useAllAmount", () => {
    const estimatedFees = new BigNumber(5000);
    const mockTransaction = getMockedTransaction({
      amount: new BigNumber(0),
      useAllAmount: true,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, mockUnspentRecord2.commitment],
        feeRecordCommitment: null,
      },
    });
    const mockAccount = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        privateBalance: new BigNumber(1400000),
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
      },
    });

    const result = calculateAmount({
      account: mockAccount,
      transaction: mockTransaction,
      estimatedFees,
    });

    const expectedAmount = new BigNumber(mockUnspentRecord1.microcredits).plus(
      mockUnspentRecord2.microcredits,
    );

    expect(result).toMatchObject({
      amount: expectedAmount,
      totalSpent: expectedAmount.plus(estimatedFees),
    });
  });

  it("should return zero for private transactions with useAllAmount when the amount record is missing", () => {
    const estimatedFees = new BigNumber(5000);
    const mockTransaction = getMockedTransaction({
      amount: new BigNumber(0),
      useAllAmount: true,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });
    const mockAccount = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
      },
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
    uuid: "test-uuid",
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
});

describe("isRecordScannerReady", () => {
  const baseProvableApi: ProvableApi = {
    uuid: "test-uuid",
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
    ["public", "unknown_type" as any],
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
    const opNoExtra = getMockedOperation({
      id: "no-extra",
      // Intentionally omit `transactionType` to exercise the defaulting logic.
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      extra: {} as AleoOperationExtra,
    });

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

describe("hasSpecificIntentData", () => {
  it("should return true when data.type matches expectedType", () => {
    const intent = mockTxIntentFeePublic;

    expect(hasSpecificIntentData(intent, "fee_public")).toBe(true);
  });

  it("should return false when data.type does not match expectedType", () => {
    const intent = mockTxIntentFeePrivate;

    expect(hasSpecificIntentData(intent, "fee_public")).toBe(false);
  });

  it("should return false when data property is absent", () => {
    const intent = mockTxIntentTransferPublic;

    expect(hasSpecificIntentData(intent, "fee_public")).toBe(false);
  });
});

describe("mapTransactionIntentToSdkIntent", () => {
  it("should map transfer_public intent to SDK intent with correct fields", () => {
    const intent = mockTxIntentTransferPublic;

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: intent.type,
      amount: intent.amount.toString(),
      to: intent.recipient,
    });
  });

  it("should map convert_public_to_private intent to SDK intent with correct fields", () => {
    const intent = mockTxIntentSelfTransferToPrivate;

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: "transfer_public_to_private",
      amount: intent.amount.toString(),
      to: intent.recipient,
    });
  });

  it("should map fee_public intent with priorityFee to SDK intent", () => {
    const intent = mockTxIntentFeePublic;
    if (!hasSpecificIntentData(intent, "fee_public")) {
      throw new Error("guard: expected fee_public intent data");
    }

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: intent.type,
      base_fee: intent.amount.toString(),
      execution_id: intent.data.executionId,
      priority_fee: "5000",
    });
  });

  it("should map transfer_private intent to SDK intent with correct fields", () => {
    const intent = mockTxIntentTransferPrivate;

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: "transfer_private",
      amount: intent.amount.toString(),
      to: intent.recipient,
      record: mockUnspentRecord1.decryptedData,
    });
  });

  it("should map convert_private_to_public intent to SDK intent with correct fields", () => {
    const intent = mockTxIntentSelfTransferToPublic;

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: "transfer_private_to_public",
      amount: intent.amount.toString(),
      to: intent.recipient,
      record: mockUnspentRecord1.decryptedData,
    });
  });

  it("should map transfer_private intent to transfer_private_2 SDK intent for two records", () => {
    const intent = mockTxIntentTransferPrivate2;

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: "transfer_private_2",
      amount: intent.amount.toString(),
      to: intent.recipient,
      records: [mockUnspentRecord1.decryptedData, mockUnspentRecord2.decryptedData],
    });
  });

  it("should map convert_private_to_public intent to transfer_private_to_public_2 SDK intent for two records", () => {
    const intent = mockTxIntentSelfTransferToPublic2;

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: "transfer_private_to_public_2",
      amount: intent.amount.toString(),
      to: intent.recipient,
      records: [mockUnspentRecord1.decryptedData, mockUnspentRecord2.decryptedData],
    });
  });

  it("should throw when private transfer intent contains an empty records array", () => {
    const intent = {
      ...mockTxIntentTransferPrivate,
      data: {
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        records: [],
      },
    };

    expect(() => mapTransactionIntentToSdkIntent(intent)).toThrow(
      `aleo: at least one record is required for ${TRANSACTION_TYPE.TRANSFER_PRIVATE}`,
    );
  });

  it("should throw when private_to_public intent contains an empty records array", () => {
    const intent = {
      ...mockTxIntentSelfTransferToPublic,
      data: {
        type: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
        records: [],
      },
    };

    expect(() => mapTransactionIntentToSdkIntent(intent)).toThrow(
      `aleo: at least one record is required for ${TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC}`,
    );
  });

  it("should throw when private transfer intent contains too many records", () => {
    const records = Array.from(
      { length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1 },
      () => mockUnspentRecord1.decryptedData,
    );
    const intent = {
      ...mockTxIntentTransferPrivate,
      data: {
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        records,
      },
    };

    expect(() => mapTransactionIntentToSdkIntent(intent)).toThrow(
      `aleo: too many records for ${TRANSACTION_TYPE.TRANSFER_PRIVATE} (max: ${MAX_PRIVATE_RECORDS_PER_TRANSACTION})`,
    );
  });

  it("should map fee_private intent to SDK intent with correct fields", () => {
    const intent = mockTxIntentFeePrivate;
    if (!hasSpecificIntentData(intent, "fee_private")) {
      throw new Error("guard: expected fee_private intent data");
    }

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: "fee_private",
      execution_id: intent.data.executionId,
      base_fee: intent.amount.toString(),
      priority_fee: "6000",
      record: mockUnspentRecord2.decryptedData,
    });
  });

  it("should map fee_public intent without priorityFee defaulting priority_fee to '0'", () => {
    const intent = {
      ...mockTxIntentFeePublic,
      data: {
        type: "fee_public",
        executionId: "exec456",
      },
    };

    const result = mapTransactionIntentToSdkIntent(intent);

    expect(result).toEqual({
      type: intent.type,
      base_fee: intent.amount.toString(),
      execution_id: intent.data.executionId,
      priority_fee: "0",
    });
  });

  it("should throw when fee_public intent has no matching data", () => {
    const intent = {
      ...mockTxIntentTransferPublic,
      type: "fee_public",
    };

    expect(() => mapTransactionIntentToSdkIntent(intent)).toThrow(
      `aleo: intent data is required for ${intent.type}`,
    );
  });

  it("should throw for unsupported intent type", () => {
    const intent = {
      ...mockTxIntentTransferPublic,
      type: "custom_intent",
    };

    expect(() => mapTransactionIntentToSdkIntent(intent)).toThrow(
      `aleo: unsupported intent type: ${intent.type}`,
    );
  });
});

describe("toHex", () => {
  it("should produce a hex string that decodes back to the original JSON", () => {
    const tx = getMockedPreparedRequestResponse();

    const result = toHex(tx);
    const decoded = JSON.parse(Buffer.from(result, "hex").toString());

    expect(result).toMatch(/^[a-f0-9]+$/);
    expect(decoded).toEqual(tx);
  });

  it("should produce different hex strings for different transactions", () => {
    const tx1 = getMockedPreparedRequestResponse({ program_id: "custom.aleo" });
    const tx2 = getMockedPreparedRequestResponse({ program_id: "another.aleo" });

    expect(toHex(tx1)).not.toBe(toHex(tx2));
  });
});

describe("fromHex", () => {
  it("should deserialize a hex string back to the original transaction", () => {
    const tx = getMockedPreparedRequestResponse();
    const serialized = toHex(tx);

    const result = fromHex(serialized);

    expect(result).toEqual(tx);
  });

  it("should throw when given an invalid hex string", () => {
    expect(() => fromHex("not-valid-hex")).toThrow();
  });

  it("should throw when given a hex string that is not valid JSON", () => {
    const invalidJsonHex = Buffer.from("not json").toString("hex");

    expect(() => fromHex(invalidJsonHex)).toThrow();
  });
});

describe("getOperationDetailsExtraFields", () => {
  it("should return only the functionId field", () => {
    const extra = {
      functionId: "transfer_private_to_public",
      transactionType: "private",
      patched: true,
    } satisfies AleoOperationExtra;

    const result = getOperationDetailsExtraFields(extra);

    expect(result).toEqual([{ key: "functionId", value: "transfer_private_to_public" }]);
  });
});

describe("getAvailableBalance", () => {
  const mockTransparentBalance = new BigNumber(100);
  const expectedPrivateSpendableBalance = new BigNumber(mockUnspentRecord1.microcredits).plus(
    new BigNumber(mockUnspentRecord2.microcredits),
  );
  const mockAccount = getMockedAccount({
    aleoResources: {
      ...mockAleoResources,
      transparentBalance: mockTransparentBalance,
      privateBalance: new BigNumber(200),
      unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
    },
  });

  it.each([
    [TRANSACTION_TYPE.TRANSFER_PUBLIC, mockTransparentBalance],
    [TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE, mockTransparentBalance],
    [TRANSACTION_TYPE.TRANSFER_PRIVATE, expectedPrivateSpendableBalance],
    [TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC, expectedPrivateSpendableBalance],
  ])("should return correct balance for %s", (mode, expected) => {
    const transaction = getMockedTransaction({ mode });

    expect(getAvailableBalance(mockAccount, transaction)).toStrictEqual(expected);
  });

  it.each([TRANSACTION_TYPE.TRANSFER_PUBLIC, TRANSACTION_TYPE.TRANSFER_PRIVATE])(
    "should return zero when aleoResources is undefined (%s)",
    mode => {
      // @ts-expect-error - testing behavior when aleoResources is explicitly undefined
      const brokenAccount = getMockedAccount({ aleoResources: undefined });
      const transaction = getMockedTransaction({ mode });

      expect(getAvailableBalance(brokenAccount, transaction)).toStrictEqual(new BigNumber(0));
    },
  );

  it("should throw for an unsupported transaction mode", () => {
    const unsupportedMode = "unsupported_mode";
    // @ts-expect-error - testing unsupported mode
    const transaction = getMockedTransaction({ mode: unsupportedMode });

    expect(() => getAvailableBalance(mockAccount, transaction)).toThrow(
      `aleo: unsupported tx mode for balance calculation: ${unsupportedMode}`,
    );
  });
});

describe("isSelfTransferTransaction", () => {
  it.each([
    [true, TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
    [true, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
    [false, "other_type" as never],
  ])("should return %s for mode '%s'", (expected, mode) => {
    const transaction = getMockedTransaction({ mode });

    expect(isSelfTransferTransaction(transaction)).toBe(expected);
  });
});

describe("isPublicTransaction", () => {
  it.each([
    [true, TRANSACTION_TYPE.TRANSFER_PUBLIC],
    [true, TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
    [false, "other_type" as never],
  ])("should return %s for mode '%s'", (expected, mode) => {
    const transaction = getMockedTransaction({ mode });

    expect(isPublicTransaction(transaction)).toBe(expected);
  });
});

describe("isPrivateTransaction", () => {
  it.each([
    [true, TRANSACTION_TYPE.TRANSFER_PRIVATE],
    [true, TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
    [false, "other_type" as never],
  ])("should return %s for mode '%s'", (expected, mode) => {
    const transaction = getMockedTransaction({ mode });

    expect(isPrivateTransaction(transaction)).toBe(expected);
  });
});

describe("createTransactionIntent", () => {
  const mockAccount = getMockedAccount({
    aleoResources: {
      ...mockAleoResources,
      unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
    },
  });

  it("should create a public transaction intent with base fields", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      amount: new BigNumber(500000),
      recipient: "aleo1recipient",
    });

    const result = createTransactionIntent({ account: mockAccount, transaction });

    expect(result).toEqual({
      intentType: "transaction",
      asset: {
        type: "native",
      },
      type: transaction.mode,
      amount: BigInt(transaction.amount.toString()),
      recipient: transaction.recipient,
      sender: mockAccount.freshAddress,
    });
  });

  it("should include useAllAmount when set to true", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      useAllAmount: true,
    });

    const result = createTransactionIntent({ account: mockAccount, transaction });

    expect(result.useAllAmount).toBe(true);
  });

  it("should include data with record for a private transaction", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment],
        feeRecordCommitment: null,
      },
    });

    const result = createTransactionIntent({ account: mockAccount, transaction });

    expect(result).toMatchObject({
      type: transaction.mode,
      data: {
        type: transaction.mode,
        records: [mockUnspentRecord1.decryptedData],
      },
    });
  });

  it("should throw when amountRecordCommitments is empty for a private transaction", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    });

    expect(() => createTransactionIntent({ account: mockAccount, transaction })).toThrow(
      "aleo: missing amount record commitments",
    );
  });

  it("should throw when amountRecordCommitments entry does not match any unspent record", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: ["non-existent-commitment"],
        feeRecordCommitment: null,
      },
    });

    expect(() => createTransactionIntent({ account: mockAccount, transaction })).toThrow(
      "aleo: no amount records found for given commitments: non-existent-commitment",
    );
  });

  it("should throw when at least one commitment is missing even if others resolve", () => {
    const missingCommitment = "non-existent-commitment";
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [mockUnspentRecord1.commitment, missingCommitment],
        feeRecordCommitment: null,
      },
    });

    expect(() => createTransactionIntent({ account: mockAccount, transaction })).toThrow(
      `aleo: no amount records found for given commitments: ${missingCommitment}`,
    );
  });

  it("should throw when selected amount record commitments exceed supported max", () => {
    const amountRecordCommitments = Array.from(
      { length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 1 },
      (_, index) => `commitment-${index}`,
    );
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments,
        feeRecordCommitment: null,
      },
    });

    expect(() => createTransactionIntent({ account: mockAccount, transaction })).toThrow(
      `aleo: too many amount record commitments selected (max: ${MAX_PRIVATE_RECORDS_PER_TRANSACTION})`,
    );
  });
});

describe("createFeeTransactionIntent", () => {
  const mockPublicAccount = getMockedAccount();
  const mockPrivateAccount = getMockedAccount({
    aleoResources: {
      ...mockAleoResources,
      unspentPrivateRecords: [mockUnspentRecord2],
    },
  });
  const executionId = "auth-123";
  const baseFee = new BigNumber(1000);
  const priorityFee = new BigNumber(0);

  it("should create a fee_public intent for a public transaction", () => {
    const transaction = getMockedTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC });

    const result = createFeeTransactionIntent({
      account: mockPublicAccount,
      transaction,
      executionId,
      baseFee,
      priorityFee,
      isFeeSponsored: false,
    });

    expect(result).toEqual({
      intentType: "transaction",
      asset: {
        type: "native",
      },
      type: "fee_public",
      amount: BigInt(1000),
      recipient: transaction.recipient,
      sender: mockPublicAccount.freshAddress,
      data: {
        type: "fee_public",
        priorityFee: BigInt(0),
        executionId,
      },
    });
  });

  it("should create a fee_private intent for a private transaction with a feeRecordCommitment", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: mockUnspentRecord2.commitment,
      },
    });

    const result = createFeeTransactionIntent({
      account: mockPrivateAccount,
      transaction,
      executionId,
      baseFee,
      priorityFee,
      isFeeSponsored: false,
    });

    expect(result).toEqual({
      intentType: "transaction",
      asset: {
        type: "native",
      },
      type: "fee_private",
      amount: BigInt(1000),
      recipient: transaction.recipient,
      sender: mockPrivateAccount.freshAddress,
      data: {
        type: "fee_private",
        priorityFee: BigInt(0),
        executionId,
        record: mockUnspentRecord2.decryptedData,
      },
    });
  });

  it("should throw when feeRecord is missing for a sponsored private transaction", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    });

    expect(() =>
      createFeeTransactionIntent({
        account: mockPrivateAccount,
        transaction,
        executionId,
        baseFee,
        priorityFee,
        isFeeSponsored: false,
      }),
    ).toThrow("aleo: missing fee record commitment");
  });

  it("should throw when feeRecord is missing for a private transaction", () => {
    const transaction = getMockedTransaction({
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitments: [],
        feeRecordCommitment: null,
      },
    });

    expect(() =>
      createFeeTransactionIntent({
        account: mockPrivateAccount,
        transaction,
        executionId,
        baseFee,
        priorityFee,
        isFeeSponsored: false,
      }),
    ).toThrow("aleo: missing fee record commitment");
  });
});

describe("getRecordByCommitment", () => {
  it("should return the record matching the commitment", () => {
    const account = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        unspentPrivateRecords: [mockUnspentRecord1, mockUnspentRecord2],
      },
    });

    const result = getRecordByCommitment({
      account,
      commitment: mockUnspentRecord2.commitment,
    });

    expect(result).toEqual(mockUnspentRecord2);
  });

  it("should return null when no record matches the commitment", () => {
    const account = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        unspentPrivateRecords: [mockUnspentRecord1],
      },
    });

    const result = getRecordByCommitment({
      account,
      commitment: "non-existent-commitment",
    });

    expect(result).toBeNull();
  });

  it("should return null from empty records array", () => {
    const account = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        unspentPrivateRecords: [],
      },
    });

    const result = getRecordByCommitment({
      account,
      commitment: mockUnspentRecord1.commitment,
    });

    expect(result).toBeNull();
  });

  it("should return null when unspentPrivateRecords is null", () => {
    const account = getMockedAccount({
      aleoResources: {
        ...mockAleoResources,
        unspentPrivateRecords: null,
      },
    });

    const result = getRecordByCommitment({
      account,
      commitment: mockUnspentRecord1.commitment,
    });

    expect(result).toBeNull();
  });

  it("should return null when aleoResources is undefined", () => {
    const account = getMockedAccount();
    delete account.aleoResources;

    const result = getRecordByCommitment({
      account,
      commitment: mockUnspentRecord1.commitment,
    });

    expect(result).toBeNull();
  });
});

describe("getNextSequenceNumber", () => {
  it.each([
    [new BigNumber(0), undefined],
    [new BigNumber(1), new BigNumber(0)],
    [new BigNumber(6), new BigNumber(5)],
    [new BigNumber(0), new BigNumber(NaN)],
  ])("should return %i for transactionSequenceNumber '%s'", (expected, seq) => {
    const op = getMockedOperation({ transactionSequenceNumber: seq });
    const account = getMockedAccount({ pendingOperations: [op] });

    expect(getNextSequenceNumber(account)).toEqual(expected);
  });
});

describe("getFunctionNameFromTransactionType", () => {
  it.each([
    ["transfer_public", TRANSACTION_TYPE.TRANSFER_PUBLIC],
    ["transfer_private", TRANSACTION_TYPE.TRANSFER_PRIVATE],
    ["transfer_public_to_private", TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE],
    ["transfer_private_to_public", TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC],
  ])("should return '%s' for transaction type '%s'", (expected, transactionType) => {
    expect(getFunctionNameFromTransactionType(transactionType)).toBe(expected);
  });

  it("should throw for an unsupported transaction type", () => {
    // @ts-expect-error - testing unsupported transaction type
    expect(() => getFunctionNameFromTransactionType("unknown_type")).toThrow(
      "aleo: unsupported transaction type: unknown_type",
    );
  });
});

describe("extractViewKey", () => {
  it("should return the view key extracted from the account id", () => {
    const account = getMockedAccount({ id: "js:2:aleo:aleo1xyz::AViewKey123" });

    expect(extractViewKey(account)).toBe("AViewKey123");
  });

  it("should throw when the account id has no view key", () => {
    const account = getMockedAccount({ id: "js:2:aleo:aleo1test:" });

    expect(() => extractViewKey(account)).toThrow(
      `aleo: view key is missing in ${account.freshAddress} account`,
    );
  });
});

describe("findBestRecordForFee", () => {
  it("should return the smallest record sufficient to cover the fee", () => {
    const targetFee = new BigNumber(500000);
    const result = findBestRecordForFee({
      unspentRecords: [mockUnspentRecord1, mockUnspentRecord2],
      targetFee,
      selectedAmountRecordCommitments: [],
    });
    // mockUnspentRecord2 (600000) is smaller than mockUnspentRecord1 (800000), both cover 500000
    expect(result).toBe(mockUnspentRecord2);
  });

  it("should exclude the record used for the amount", () => {
    const targetFee = new BigNumber(500000);
    const result = findBestRecordForFee({
      unspentRecords: [mockUnspentRecord1, mockUnspentRecord2],
      targetFee,
      selectedAmountRecordCommitments: [mockUnspentRecord2.commitment],
    });
    // mockUnspentRecord2 is excluded; only mockUnspentRecord1 (800000) remains
    expect(result).toBe(mockUnspentRecord1);
  });

  it("should return null when no record is sufficient to cover the fee", () => {
    const targetFee = new BigNumber(999999999);
    const result = findBestRecordForFee({
      unspentRecords: [mockUnspentRecord1, mockUnspentRecord2],
      targetFee,
      selectedAmountRecordCommitments: [],
    });
    expect(result).toBeNull();
  });

  it("should return null for an empty records array", () => {
    const result = findBestRecordForFee({
      unspentRecords: [],
      targetFee: new BigNumber(1000),
      selectedAmountRecordCommitments: [],
    });
    expect(result).toBeNull();
  });

  it("should return the only available record when it exactly meets the fee", () => {
    const targetFee = new BigNumber(800000);
    const result = findBestRecordForFee({
      unspentRecords: [mockUnspentRecord1],
      targetFee,
      selectedAmountRecordCommitments: [],
    });
    expect(result).toBe(mockUnspentRecord1);
  });
});

describe("selectPrivateRecordsForAmount", () => {
  it("should return top MAX_PRIVATE_RECORDS_PER_TRANSACTION records by value descending when targetAmount is null", () => {
    const records = Array.from({ length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 2 }, (_, i) => ({
      ...mockUnspentRecord1,
      commitment: `r${i}`,
      microcredits: `${(i + 1) * 10}`,
    }));

    const result = selectPrivateRecordsForAmount({ unspentRecords: records, targetAmount: null });
    const expectedMicrocredits = [...records]
      .sort((a, b) => new BigNumber(b.microcredits).comparedTo(new BigNumber(a.microcredits)))
      .slice(0, MAX_PRIVATE_RECORDS_PER_TRANSACTION)
      .map(r => r.microcredits);

    expect(result.map(r => r.microcredits)).toEqual(expectedMicrocredits);
  });

  it("should return empty array when targetAmount is null and input is empty", () => {
    const result = selectPrivateRecordsForAmount({ unspentRecords: [], targetAmount: null });

    expect(result).toEqual([]);
  });

  it("should pick the smallest single record that covers the target", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, microcredits: "50" },
      { ...mockUnspentRecord2, microcredits: "5" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(1),
    });

    expect(result.map(r => r.microcredits)).toEqual(["5"]);
  });

  it("should skip records below the target and pick the next sufficient one", () => {
    // [1000, 500, 1, 1]: target 2 -> dust (1) is insufficient, so smallest sufficient is 500
    const unspentRecords = [
      { ...mockUnspentRecord1, commitment: "r0", microcredits: "1000" },
      { ...mockUnspentRecord1, commitment: "r1", microcredits: "500" },
      { ...mockUnspentRecord2, commitment: "r2", microcredits: "1" },
      { ...mockUnspentRecord2, commitment: "r3", microcredits: "1" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(2),
    });

    expect(result.map(r => r.microcredits)).toEqual(["500"]);
  });

  it("should skip 500 when the target is 501 and only 1000 is sufficient", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, commitment: "r0", microcredits: "1000" },
      { ...mockUnspentRecord1, commitment: "r1", microcredits: "500" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(501),
    });

    expect(result.map(r => r.microcredits)).toEqual(["1000"]);
  });

  it("should accumulate largest records first when no single record covers the target", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, microcredits: "7" },
      { ...mockUnspentRecord2, microcredits: "5" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(10),
    });

    expect(result.map(r => r.microcredits)).toEqual(["7", "5"]);
  });

  it("should stop accumulating once the running total meets the target", () => {
    const records = Array.from({ length: 10 }, (_, i) => ({
      ...mockUnspentRecord1,
      commitment: `r${i}`,
      microcredits: "10",
    }));

    const result = selectPrivateRecordsForAmount({
      unspentRecords: records,
      targetAmount: new BigNumber(50),
    });

    expect(result.map(r => r.microcredits)).toEqual(["10", "10", "10", "10", "10"]);
  });

  it("should cap selection at maxRecords and overshoot rather than exceed the limit", () => {
    const singleRecordValue = 10;
    const records = Array.from({ length: MAX_PRIVATE_RECORDS_PER_TRANSACTION + 2 }, (_, i) => ({
      ...mockUnspentRecord1,
      commitment: `r${i}`,
      microcredits: singleRecordValue.toString(),
    }));

    const result = selectPrivateRecordsForAmount({
      unspentRecords: records,
      // just under the sum of max records
      targetAmount: new BigNumber(MAX_PRIVATE_RECORDS_PER_TRANSACTION * singleRecordValue).minus(1),
    });

    const expectedMicrocredits = records
      .slice(0, MAX_PRIVATE_RECORDS_PER_TRANSACTION)
      .map(r => r.microcredits);

    expect(result.map(r => r.microcredits)).toEqual(expectedMicrocredits);
  });

  it("should stop accumulating before recruiting dust when larger records already cover the target", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, commitment: "r0", microcredits: "1000" },
      { ...mockUnspentRecord1, commitment: "r1", microcredits: "500" },
      { ...mockUnspentRecord2, commitment: "r2", microcredits: "1" },
      { ...mockUnspentRecord2, commitment: "r3", microcredits: "1" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(1001),
    });

    expect(result.map(r => r.microcredits)).toEqual(["1000", "500"]);
  });

  it("should return empty array for target ≤ 0", () => {
    const unspentRecords = [{ ...mockUnspentRecord1, microcredits: "100" }];

    expect(
      selectPrivateRecordsForAmount({ unspentRecords, targetAmount: new BigNumber(0) }),
    ).toEqual([]);
    expect(
      selectPrivateRecordsForAmount({ unspentRecords, targetAmount: new BigNumber(-1) }),
    ).toEqual([]);
  });

  it("should filter out zero-value records before selection", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, commitment: "r0", microcredits: "0" },
      { ...mockUnspentRecord1, commitment: "r1", microcredits: "0" },
      { ...mockUnspentRecord2, commitment: "r2", microcredits: "10" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(5),
    });

    expect(result.map(r => r.microcredits)).toEqual(["10"]);
  });

  it("should return empty array when the record cap is exhausted before the target is covered", () => {
    const recordsCount = MAX_PRIVATE_RECORDS_PER_TRANSACTION + 2;
    const recordValue = 10;
    const unspentRecords = Array.from({ length: recordsCount }, (_, i) => ({
      ...mockUnspentRecord1,
      commitment: `r${i}`,
      microcredits: recordValue.toString(),
    }));

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(recordsCount * recordValue),
    });

    expect(result).toEqual([]);
  });

  it("should return all records when their total exactly meets the target", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, commitment: "r0", microcredits: "300" },
      { ...mockUnspentRecord2, commitment: "r1", microcredits: "200" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(500),
    });

    expect(result.map(r => r.microcredits)).toEqual(["300", "200"]);
  });

  it("should return empty array when total funds are insufficient to meet the target", () => {
    const unspentRecords = [
      { ...mockUnspentRecord1, commitment: "r0", microcredits: "100" },
      { ...mockUnspentRecord2, commitment: "r1", microcredits: "50" },
    ];

    const result = selectPrivateRecordsForAmount({
      unspentRecords,
      targetAmount: new BigNumber(999),
    });

    expect(result).toEqual([]);
  });
});

describe("getEstimatedSigningTime", () => {
  // SIGNING_RECORDS_TIME = 12500 ms per record

  it("should return seconds for totals below 1 minute", () => {
    // 4 records × 12500 ms = 50 000 ms = 50 s
    expect(getEstimatedSigningTime(4, "sec", "min")).toBe("~50 sec");
  });

  it("should round seconds correctly for non-integer results", () => {
    // 1 record × 12500 ms = 12.5 s → rounds to 13
    expect(getEstimatedSigningTime(1, "sec", "min")).toBe("~13 sec");
  });

  it("should return minutes floored to 0.5 min for totals >= 1 minute", () => {
    // 5 records × 12500 ms = 62.5 s → floor to 60 s = 1 min
    expect(getEstimatedSigningTime(5, "sec", "min")).toBe("~1 min");
  });

  it("should floor to nearest 30 s above 1 minute", () => {
    // 8 records × 12500 ms = 100 s → floor to 90 s = 1.5 min
    expect(getEstimatedSigningTime(8, "sec", "min")).toBe("~1.5 min");
  });

  it("should floor to 2 min when total is just above 2 minutes", () => {
    // 10 records × 12500 ms = 125 s → floor to 120 s = 2 min
    expect(getEstimatedSigningTime(10, "sec", "min")).toBe("~2 min");
  });

  it("should show 2.5 min when total lands exactly on 150 s", () => {
    // 12 records × 12500 ms = 150 s → floor to 150 s = 2.5 min
    expect(getEstimatedSigningTime(12, "sec", "min")).toBe("~2.5 min");
  });

  it("should return 0 sec for 0 records", () => {
    expect(getEstimatedSigningTime(0, "sec", "min")).toBe("~0 sec");
  });
});

describe("sumPrivateRecords", () => {
  it("returns BigNumber(0) for an empty array", () => {
    expect(sumPrivateRecords([]).isEqualTo(new BigNumber(0))).toBe(true);
  });

  it("sums a single record", () => {
    expect(
      sumPrivateRecords([{ ...mockUnspentRecord1, microcredits: "500" }]).isEqualTo(
        new BigNumber(500),
      ),
    ).toBe(true);
  });

  it("sums multiple records", () => {
    const records = [
      { ...mockUnspentRecord1, microcredits: "100" },
      { ...mockUnspentRecord1, microcredits: "200" },
      { ...mockUnspentRecord1, microcredits: "300" },
    ];
    expect(sumPrivateRecords(records).isEqualTo(new BigNumber(600))).toBe(true);
  });

  it("handles large microcredit values without precision loss", () => {
    const records = [
      { ...mockUnspentRecord1, microcredits: "999999999999999999" },
      { ...mockUnspentRecord1, microcredits: "1" },
    ];
    expect(sumPrivateRecords(records).isEqualTo(new BigNumber("1000000000000000000"))).toBe(true);
  });

  it("handles string-typed microcredits", () => {
    const records = [
      { ...mockUnspentRecord1, microcredits: "42" },
      { ...mockUnspentRecord1, microcredits: "58" },
    ];
    expect(sumPrivateRecords(records).isEqualTo(new BigNumber(100))).toBe(true);
  });
});
