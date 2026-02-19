import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import aleoConfig from "../config";
import { EXPLORER_TRANSFER_TYPES } from "../constants";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedEnrichedTransaction } from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import {
  getNetworkConfig,
  parseMicrocredits,
  determineTransactionType,
  patchAccountWithViewKey,
  toAlpacaOperation,
  toBridgeOperation,
} from "./utils";

jest.mock("../config");

const mockedAleoConfig = jest.mocked(aleoConfig);

describe("getNetworkConfig", () => {
  const mockCurrency = getMockedCurrency();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return network config with correct structure", () => {
    const mockConfig = getMockedConfig("mainnet");

    mockedAleoConfig.getCoinConfig.mockReturnValue(mockConfig);

    const result = getNetworkConfig(mockCurrency);

    expect(result).toEqual({
      nodeUrl: "https://node.example.com",
      sdkUrl: "https://sdk.example.com",
      networkType: "mainnet",
    });
  });

  it("should call getCoinConfig with correct currency", () => {
    const mockConfig = getMockedConfig("testnet");

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
