import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedEnrichedPrivateRecord, getMockedRecord } from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { enrichPrivateRecord } from "../network/utils";
import { toPrivateBridgeOperation } from "./utils";
import { listPrivateOperations } from "./listPrivateOperations";

jest.mock("../network/utils");
jest.mock("./utils");

const mockEnrichPrivateRecord = jest.mocked(enrichPrivateRecord);
const mockToPrivateBridgeOperation = jest.mocked(toPrivateBridgeOperation);

describe("listPrivateOperations", () => {
  const mockOp = getMockedOperation();
  const mockCurrency = getMockedCurrency();
  const mockViewKey = "AViewKey1mockviewkey";
  const mockAddress = "aleo1test123address456";
  const mockLedgerAccountId = "js:2:aleo:aleo1test123address456:";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an empty operations array and empty set when no private records are provided", async () => {
    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [],
    });

    expect(mockEnrichPrivateRecord).not.toHaveBeenCalled();
    expect(result.operations).toEqual([]);
    expect(result.consumedRecordTags).toEqual(new Set());
  });

  it("should pass non-credits program records to enrichPrivateRecord (filtering is done by the caller)", async () => {
    const record = getMockedRecord({
      program_name: "custom_token.aleo",
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });

    mockEnrichPrivateRecord.mockResolvedValue(null);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(1);
    expect(mockEnrichPrivateRecord).toHaveBeenCalledWith({
      currency: mockCurrency,
      rawRecord: record,
      viewKey: mockViewKey,
      address: mockAddress,
    });
    expect(result.operations).toEqual([]);
    expect(result.consumedRecordTags).toEqual(new Set());
  });

  it("should process transfer_private records", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(1);
    expect(mockEnrichPrivateRecord).toHaveBeenCalledWith({
      currency: mockCurrency,
      rawRecord: record,
      viewKey: mockViewKey,
      address: mockAddress,
    });
    expect(result.operations).toEqual([mockOp]);
  });

  it("should process transfer_public_to_private records", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(1);
    expect(mockEnrichPrivateRecord).toHaveBeenCalledWith({
      currency: mockCurrency,
      rawRecord: record,
      viewKey: mockViewKey,
      address: mockAddress,
    });
    expect(result.operations).toEqual([mockOp]);
  });

  it("should process transfer_private_to_public records", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(1);
    expect(mockEnrichPrivateRecord).toHaveBeenCalledWith({
      currency: mockCurrency,
      rawRecord: record,
      viewKey: mockViewKey,
      address: mockAddress,
    });
    expect(result.operations).toEqual([mockOp]);
  });

  it("should not produce operations for fee_private records (enrichPrivateRecord returns null for them)", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
    });

    mockEnrichPrivateRecord.mockResolvedValue(null);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(1);
    expect(mockToPrivateBridgeOperation).not.toHaveBeenCalled();
    expect(result.operations).toEqual([]);
  });

  it("should call toPrivateBridgeOperation with ledgerAccountId, enriched record, and address", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockToPrivateBridgeOperation).toHaveBeenCalledTimes(1);
    expect(mockToPrivateBridgeOperation).toHaveBeenCalledWith(
      mockLedgerAccountId,
      mockEnriched,
      mockAddress,
    );
  });

  it("should exclude operations when enrichPrivateRecord returns null", async () => {
    const record1 = getMockedRecord({
      transaction_id: "tx1",
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const record2 = getMockedRecord({
      transaction_id: "tx2",
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record2 });

    mockEnrichPrivateRecord.mockResolvedValueOnce(null).mockResolvedValueOnce(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record1, record2],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(2);
    expect(mockToPrivateBridgeOperation).toHaveBeenCalledTimes(1);
    expect(result.operations).toEqual([mockOp]);
  });

  it("should process multiple valid records and return all parsed operations", async () => {
    const records = [
      getMockedRecord({
        transaction_id: "tx1",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      }),
      getMockedRecord({
        transaction_id: "tx2",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
      }),
      getMockedRecord({
        transaction_id: "tx3",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
      }),
    ];
    const ops = [
      getMockedOperation({ id: "op1" }),
      getMockedOperation({ id: "op2" }),
      getMockedOperation({ id: "op3" }),
    ];

    mockEnrichPrivateRecord
      .mockResolvedValueOnce(getMockedEnrichedPrivateRecord({ rawRecord: records[0] }))
      .mockResolvedValueOnce(getMockedEnrichedPrivateRecord({ rawRecord: records[1] }))
      .mockResolvedValueOnce(getMockedEnrichedPrivateRecord({ rawRecord: records[2] }));
    mockToPrivateBridgeOperation
      .mockReturnValueOnce(ops[0])
      .mockReturnValueOnce(ops[1])
      .mockReturnValueOnce(ops[2]);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: records,
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(3);
    expect(mockToPrivateBridgeOperation).toHaveBeenCalledTimes(3);
    expect(result.operations).toHaveLength(3);
    expect(result.operations).toEqual(expect.arrayContaining(ops));
  });

  it("should call enrichPrivateRecord for all records and only produce operations for non-null results", async () => {
    const record1 = getMockedRecord({
      transaction_id: "tx-non-credits",
      program_name: "custom_token.aleo",
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const record2 = getMockedRecord({
      transaction_id: "tx-valid",
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record2 });

    mockEnrichPrivateRecord.mockResolvedValueOnce(null).mockResolvedValueOnce(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record1, record2],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(2);
    expect(mockEnrichPrivateRecord).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ rawRecord: record1 }),
    );
    expect(mockEnrichPrivateRecord).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ rawRecord: record2 }),
    );
    expect(result.operations).toEqual([mockOp]);
  });

  it("should return an empty array when all enrichPrivateRecord calls return null", async () => {
    const records = [
      getMockedRecord({
        transaction_id: "tx1",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      }),
      getMockedRecord({
        transaction_id: "tx2",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      }),
    ];

    mockEnrichPrivateRecord.mockResolvedValue(null);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: records,
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(2);
    expect(mockToPrivateBridgeOperation).not.toHaveBeenCalled();
    expect(result.operations).toEqual([]);
  });

  it("should collect consumed record tags from record-type inputs in outgoing transactions", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({
      rawRecord: { sender: mockAddress },
      details: {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [
                { id: "in0", type: "record", tag: "consumed-tag-1" },
                { id: "in1", type: "private", value: "cipher_recipient" },
                { id: "in2", type: "private", value: "cipher_amount" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private",
            },
          ],
        },
      },
    });

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(result.operations).toEqual([mockOp]);
    expect(result.consumedRecordTags).toEqual(new Set(["consumed-tag-1"]));
  });

  it("should not collect tags from incoming transactions where sender is not this address", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });

    const mockEnriched = getMockedEnrichedPrivateRecord({
      sender: "different_address",
      details: {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [{ id: "in0", type: "record", tag: "incoming-tag" }],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private",
            },
          ],
        },
      },
    });

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(result.consumedRecordTags).toEqual(new Set());
  });

  it("should call onProgress after each enriched record", async () => {
    const records = [
      getMockedRecord({
        transaction_id: "tx1",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      }),
      getMockedRecord({
        transaction_id: "tx2",
        program_name: PROGRAM_ID.CREDITS,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
      }),
    ];

    mockEnrichPrivateRecord
      .mockResolvedValueOnce(getMockedEnrichedPrivateRecord({ rawRecord: records[0] }))
      .mockResolvedValueOnce(getMockedEnrichedPrivateRecord({ rawRecord: records[1] }));
    mockToPrivateBridgeOperation.mockReturnValue(getMockedOperation());

    const onProgress = jest.fn();

    await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: records,
      onProgress,
    });

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2);
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it("should throw AbortError when signal is already aborted before processing", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });

    const controller = new AbortController();
    controller.abort();

    await expect(
      listPrivateOperations({
        currency: mockCurrency,
        viewKey: mockViewKey,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        privateRecords: [record],
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
