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
  const mockCurrency = getMockedCurrency();
  const mockViewKey = "AViewKey1mockviewkey";
  const mockAddress = "aleo1test123address456";
  const mockLedgerAccountId = "js:2:aleo:aleo1test123address456:";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return an empty array when no private records are provided", async () => {
    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [],
    });

    expect(mockEnrichPrivateRecord).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should filter out records from non-credits programs", async () => {
    const record = getMockedRecord({
      program_name: "custom_token.aleo",
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should filter out transfer_public records as they are not private operations", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PUBLIC,
    });

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [record],
    });

    expect(mockEnrichPrivateRecord).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should process transfer_private records", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });
    const mockOp = getMockedOperation();

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
    expect(result).toEqual([mockOp]);
  });

  it("should process transfer_public_to_private records", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });
    const mockOp = getMockedOperation();

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
    expect(result).toEqual([mockOp]);
  });

  it("should process transfer_private_to_public records", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });
    const mockOp = getMockedOperation();

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
    expect(result).toEqual([mockOp]);
  });

  it("should call toPrivateBridgeOperation with ledgerAccountId, enriched record, and address", async () => {
    const record = getMockedRecord({
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: record });
    const mockOp = getMockedOperation();

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
    const mockOp = getMockedOperation({ id: "op2" });

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
    expect(result).toEqual([mockOp]);
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
    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(ops));
  });

  it("should skip non-native records while still processing valid ones", async () => {
    const invalidRecord = getMockedRecord({
      transaction_id: "tx-invalid",
      program_name: "custom_token.aleo",
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const validRecord = getMockedRecord({
      transaction_id: "tx-valid",
      program_name: PROGRAM_ID.CREDITS,
      function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
    });
    const mockEnriched = getMockedEnrichedPrivateRecord({ rawRecord: validRecord });
    const mockOp = getMockedOperation();

    mockEnrichPrivateRecord.mockResolvedValue(mockEnriched);
    mockToPrivateBridgeOperation.mockReturnValue(mockOp);

    const result = await listPrivateOperations({
      currency: mockCurrency,
      viewKey: mockViewKey,
      address: mockAddress,
      ledgerAccountId: mockLedgerAccountId,
      privateRecords: [invalidRecord, validRecord],
    });

    expect(mockEnrichPrivateRecord).toHaveBeenCalledTimes(1);
    expect(mockEnrichPrivateRecord).toHaveBeenCalledWith(
      expect.objectContaining({ rawRecord: validRecord }),
    );
    expect(result).toEqual([mockOp]);
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
    expect(result).toEqual([]);
  });
});
