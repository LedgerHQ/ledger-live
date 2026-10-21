import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedEnrichedPrivateRecord,
  getMockedRecord,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { apiClient } from "../network/api";
import { enrichPrivateRecords } from "../network/utils";
import type { AleoTransition } from "../types";
import { toPrivateBridgeOperation, toPrivateFeeBridgeOperation } from "./utils";
import { buildConsumedRecordTags, listPrivateOperations } from "./listPrivateOperations";

jest.mock("../network/api");
jest.mock("../network/utils");
jest.mock("./utils");

const mockEnrichPrivateRecords = jest.mocked(enrichPrivateRecords);
const mockToPrivateBridgeOperation = jest.mocked(toPrivateBridgeOperation);
const mockToPrivateFeeBridgeOperation = jest.mocked(toPrivateFeeBridgeOperation);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);

const mockConfig = getMockedConfig("mainnet");
const mockViewKey = "AViewKey1mockviewkey";
const mockAddress = "aleo1test123address456";
const mockLedgerAccountId = "js:2:aleo:aleo1test123address456:";

const getMockedTransition = (inputs: AleoTransition["inputs"]): AleoTransition => ({
  id: "au1",
  scm: "s",
  tcm: "t",
  tpk: "tpk1",
  inputs,
  outputs: [],
  program: PROGRAM_ID.CREDITS,
  function: EXPLORER_TRANSFER_TYPES.PRIVATE,
});

const run = (
  overrides: Partial<Parameters<typeof listPrivateOperations>[0]> & {
    privateRecords: Parameters<typeof listPrivateOperations>[0]["privateRecords"];
  },
) =>
  listPrivateOperations({
    config: mockConfig,
    viewKey: mockViewKey,
    address: mockAddress,
    ledgerAccountId: mockLedgerAccountId,
    knownTransactionIds: new Set(),
    ...overrides,
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockEnrichPrivateRecords.mockResolvedValue([]);
  mockToPrivateBridgeOperation.mockReturnValue(getMockedOperation());
});

describe("listPrivateOperations", () => {
  it("should return an empty result when no private records are provided", async () => {
    const result = await run({ privateRecords: [] });

    expect(result.operations).toEqual([]);
    expect(result.consumedRecordTags).toEqual(new Set());
  });

  it("should enrich every record in a single call, whatever its program", async () => {
    const records = [
      getMockedRecord({ tag: "tag1", program_name: PROGRAM_ID.CREDITS }),
      getMockedRecord({ tag: "tag2", program_name: "custom_token.aleo" }),
    ];

    await run({ privateRecords: records });

    expect(mockEnrichPrivateRecords).toHaveBeenCalledTimes(1);
    expect(mockEnrichPrivateRecords).toHaveBeenCalledWith({
      config: mockConfig,
      viewKey: mockViewKey,
      address: mockAddress,
      records,
    });
  });

  it("should enrich token records alongside native ones", async () => {
    const nativeRecord = getMockedRecord({ tag: "native-tag" });
    const tokenRecord = getMockedRecord({ tag: "token-tag", program_name: "arc20_eth.aleo" });

    await run({ privateRecords: [nativeRecord], tokenRecords: [tokenRecord] });

    expect(mockEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ records: [nativeRecord, tokenRecord] }),
    );
  });

  it("should only build operations for native records, not for token records", async () => {
    const nativeRecord = getMockedRecord({ tag: "native-tag" });
    const tokenRecord = getMockedRecord({ tag: "token-tag", program_name: "arc20_eth.aleo" });
    const nativeEnriched = getMockedEnrichedPrivateRecord({ rawRecord: nativeRecord });
    const nativeOp = getMockedOperation({ id: "native-op" });

    mockEnrichPrivateRecords.mockResolvedValue([
      nativeEnriched,
      getMockedEnrichedPrivateRecord({ rawRecord: tokenRecord }),
    ]);
    mockToPrivateBridgeOperation.mockReturnValue(nativeOp);

    const { operations } = await run({
      privateRecords: [nativeRecord],
      tokenRecords: [tokenRecord],
    });

    expect(operations).toEqual([nativeOp]);
    expect(mockToPrivateBridgeOperation).toHaveBeenCalledTimes(1);
    expect(mockToPrivateBridgeOperation).toHaveBeenCalledWith(
      mockLedgerAccountId,
      nativeEnriched,
      mockAddress,
    );
  });

  it("should skip records the enrichment could not resolve", async () => {
    const records = [getMockedRecord({ tag: "tag1" }), getMockedRecord({ tag: "tag2" })];
    const op = getMockedOperation({ id: "op2" });

    mockEnrichPrivateRecords.mockResolvedValue([
      null,
      getMockedEnrichedPrivateRecord({ rawRecord: records[1] }),
    ]);
    mockToPrivateBridgeOperation.mockReturnValue(op);

    const { operations } = await run({ privateRecords: records });

    expect(operations).toEqual([op]);
  });

  it.each([EXPLORER_TRANSFER_TYPES.JOIN, EXPLORER_TRANSFER_TYPES.SPLIT])(
    "should not enrich %s records",
    async functionName => {
      const transferRecord = getMockedRecord({ tag: "transfer-tag" });
      mockGetTransactionById.mockResolvedValueOnce(getMockedTransactionDetails("at1manage"));

      const { operations } = await run({
        privateRecords: [
          transferRecord,
          getMockedRecord({ transaction_id: "at1manage", function_name: functionName }),
        ],
        tokenRecords: [
          getMockedRecord({ function_name: functionName, program_name: "arc20_eth.aleo" }),
        ],
      });

      expect(mockEnrichPrivateRecords).toHaveBeenCalledWith(
        expect.objectContaining({ records: [transferRecord] }),
      );
      expect(operations).toEqual([]);
    },
  );

  it("should forward onProgress and signal to the enrichment", async () => {
    const onProgress = jest.fn();
    const signal = new AbortController().signal;

    await run({ privateRecords: [getMockedRecord()], onProgress, signal });

    expect(mockEnrichPrivateRecords).toHaveBeenCalledWith(
      expect.objectContaining({ onProgress, signal }),
    );
  });
});

describe("buildConsumedRecordTags", () => {
  it("should collect tags from record inputs of outgoing transactions", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { sender: mockAddress },
      details: {
        execution: {
          transitions: [
            getMockedTransition([
              { id: "in0", type: "record", tag: "consumed-tag-1" },
              { id: "in1", type: "private", value: "cipher_recipient" },
            ]),
          ],
        },
      },
    });

    expect(buildConsumedRecordTags([enriched], mockAddress)).toEqual(new Set(["consumed-tag-1"]));
  });

  it("should collect tags from ARC-20 record_with_dynamic_id inputs", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { sender: mockAddress },
      details: {
        execution: {
          transitions: [
            getMockedTransition([
              {
                id: "in0",
                type: "record_with_dynamic_id",
                tag: "consumed-token-tag",
                dynamic_id: "dynamic-id-0",
              },
            ]),
            // forwarded to another program, so this transition carries no tag of its own
            getMockedTransition([{ id: "in0", type: "record_dynamic" }]),
          ],
        },
      },
    });

    expect(buildConsumedRecordTags([enriched], mockAddress)).toEqual(
      new Set(["consumed-token-tag"]),
    );
  });

  it("should collect execution tags from a transaction with no fee", () => {
    const { fee: _, ...details } = getMockedTransactionDetails(undefined, {
      execution: {
        transitions: [getMockedTransition([{ id: "in0", type: "record", tag: "consumed-tag-1" }])],
      },
    });
    const enriched = {
      ...getMockedEnrichedPrivateRecord({ rawRecord: { sender: mockAddress } }),
      details,
    };

    expect(buildConsumedRecordTags([enriched], mockAddress)).toEqual(new Set(["consumed-tag-1"]));
  });

  it("should ignore transactions this address did not send", () => {
    const enriched = getMockedEnrichedPrivateRecord({
      rawRecord: { sender: "aleo1someoneelse" },
      details: {
        execution: {
          transitions: [getMockedTransition([{ id: "in0", type: "record", tag: "incoming-tag" }])],
        },
      },
    });

    expect(buildConsumedRecordTags([enriched], mockAddress)).toEqual(new Set());
  });

  it("should ignore records the enrichment could not resolve", () => {
    expect(buildConsumedRecordTags([null], mockAddress)).toEqual(new Set());
  });
});

const getFeeRecord = (transactionId: string) =>
  getMockedRecord({
    transaction_id: `${transactionId}  `,
    function_name: EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
  });

const getCallDetails = (
  transactionId: string,
  program: string,
  functionName: string,
  status = "Accepted",
) =>
  getMockedTransactionDetails(transactionId, {
    execution: { transitions: [{ ...getMockedTransition([]), program, function: functionName }] },
    status,
  });

describe("listPrivateOperations fee-only transactions", () => {
  const feeOperation = getMockedOperation({ type: "FEES" });

  beforeEach(() => {
    mockToPrivateFeeBridgeOperation.mockReturnValue(feeOperation);
  });

  it("should emit a FEES operation for a fee_private record whose transaction transfers nothing", async () => {
    const feeRecord = getFeeRecord("at1join");
    const details = getCallDetails("at1join", PROGRAM_ID.CREDITS, "join");
    mockGetTransactionById.mockResolvedValueOnce(details);

    const { operations } = await run({ privateRecords: [feeRecord] });

    expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
    expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "at1join");
    expect(mockToPrivateFeeBridgeOperation).toHaveBeenCalledTimes(1);
    expect(mockToPrivateFeeBridgeOperation).toHaveBeenCalledWith(
      mockLedgerAccountId,
      feeRecord,
      details,
      mockAddress,
    );
    expect(operations).toEqual([feeOperation]);
  });

  it("should list fee-only operations after the transfer operations", async () => {
    const transferRecord = getMockedRecord({ transaction_id: "at1transfer" });
    const transferOperation = getMockedOperation({ id: "transfer-op" });
    mockEnrichPrivateRecords.mockResolvedValue([
      getMockedEnrichedPrivateRecord({ rawRecord: transferRecord }),
    ]);
    mockToPrivateBridgeOperation.mockReturnValue(transferOperation);
    mockGetTransactionById.mockResolvedValueOnce(
      getCallDetails("at1join", PROGRAM_ID.CREDITS, "join"),
    );

    const { operations } = await run({ privateRecords: [transferRecord, getFeeRecord("at1join")] });

    expect(operations).toEqual([transferOperation, feeOperation]);
  });

  it("should skip a transaction another operation already lists", async () => {
    const { operations } = await run({
      privateRecords: [getFeeRecord("at1public")],
      knownTransactionIds: new Set(["at1public"]),
    });

    expect(mockGetTransactionById).not.toHaveBeenCalled();
    expect(operations).toEqual([]);
  });

  it("should skip a transaction that also produced a transfer record", async () => {
    const { operations } = await run({
      privateRecords: [
        getFeeRecord("at1transfer"),
        getMockedRecord({
          transaction_id: "at1transfer",
          function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        }),
      ],
    });

    expect(mockGetTransactionById).not.toHaveBeenCalled();
    expect(operations).toEqual([]);
  });

  it.each([
    ["a rejected private token transfer", "token_registry.aleo", "Rejected"],
    ["an accepted transfer the account only paid the fee for", PROGRAM_ID.CREDITS, "Accepted"],
  ])("should emit a FEES operation for %s", async (_, program, status) => {
    const feeRecord = getFeeRecord("at1call");
    const details = getCallDetails("at1call", program, EXPLORER_TRANSFER_TYPES.PRIVATE, status);
    mockGetTransactionById.mockResolvedValueOnce(details);

    const { operations } = await run({ privateRecords: [feeRecord] });

    expect(mockToPrivateFeeBridgeOperation).toHaveBeenCalledTimes(1);
    expect(mockToPrivateFeeBridgeOperation).toHaveBeenCalledWith(
      mockLedgerAccountId,
      feeRecord,
      details,
      mockAddress,
    );
    expect(operations).toEqual([feeOperation]);
  });

  it.each([
    ["a staking call", "Accepted"],
    ["a rejected staking call", "Rejected"],
  ])("should skip %s", async (_, status) => {
    mockGetTransactionById.mockResolvedValueOnce(
      getCallDetails("at1call", PROGRAM_ID.CREDITS, "bond_public", status),
    );

    const { operations } = await run({ privateRecords: [getFeeRecord("at1call")] });

    expect(mockToPrivateFeeBridgeOperation).not.toHaveBeenCalled();
    expect(operations).toEqual([]);
  });

  it("should mark only the fee transition's record inputs of a rejected call as consumed", async () => {
    mockGetTransactionById.mockResolvedValueOnce(
      getMockedTransactionDetails("at1call", {
        execution: {
          transitions: [getMockedTransition([{ id: "in0", type: "record", tag: "rejected-tag" }])],
        },
        fee: {
          transition: {
            ...getMockedTransition([
              { id: "in0", type: "record", tag: "fee-tag" },
              { id: "in1", type: "public", value: "5000000u64" },
            ]),
            function: EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
          },
        },
        status: "Rejected",
      }),
    );

    const { consumedRecordTags } = await run({ privateRecords: [getFeeRecord("at1call")] });

    expect(consumedRecordTags).toEqual(new Set(["fee-tag"]));
  });

  it("should reject when transaction details cannot be fetched", async () => {
    mockGetTransactionById.mockRejectedValueOnce(new Error("explorer down"));

    await expect(run({ privateRecords: [getFeeRecord("at1down")] })).rejects.toThrow(
      "explorer down",
    );
  });
});

const getRecordManagementDetails = (functionName: string, status: string) =>
  getMockedTransactionDetails("at1manage", {
    execution: {
      transitions: [
        {
          ...getMockedTransition([
            { id: "in0", type: "record", tag: "input-tag-1" },
            { id: "in1", type: "record", tag: "input-tag-2" },
          ]),
          function: functionName,
        },
      ],
    },
    fee: {
      transition: {
        ...getMockedTransition([{ id: "in0", type: "record", tag: "fee-tag" }]),
        function: EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
      },
    },
    status,
  });

describe("listPrivateOperations record management transactions", () => {
  const feeOperation = getMockedOperation({ type: "FEES" });

  beforeEach(() => {
    mockToPrivateFeeBridgeOperation.mockReturnValue(feeOperation);
  });

  it("should mark the inputs of a fee-free split as consumed without listing an operation", async () => {
    const { fee: _, ...details } = getRecordManagementDetails(
      EXPLORER_TRANSFER_TYPES.SPLIT,
      "Accepted",
    );
    mockGetTransactionById.mockResolvedValueOnce(details);

    const { operations, consumedRecordTags } = await run({
      privateRecords: [
        getMockedRecord({
          transaction_id: "at1manage",
          function_name: EXPLORER_TRANSFER_TYPES.SPLIT,
        }),
      ],
    });

    expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "at1manage");
    expect(mockToPrivateFeeBridgeOperation).not.toHaveBeenCalled();
    expect(operations).toEqual([]);
    expect(consumedRecordTags).toEqual(new Set(["input-tag-1", "input-tag-2"]));
  });

  it.each([
    ["an accepted", "Accepted", ["input-tag-1", "input-tag-2", "fee-tag"]],
    ["a rejected", "Rejected", ["fee-tag"]],
  ])(
    "should fetch %s join paid with a private fee once and list its fee",
    async (_, status, expectedTags) => {
      const feeRecord = getFeeRecord("at1manage");
      const details = getRecordManagementDetails(EXPLORER_TRANSFER_TYPES.JOIN, status);
      mockGetTransactionById.mockResolvedValueOnce(details);

      const { operations, consumedRecordTags } = await run({
        privateRecords: [
          getMockedRecord({
            transaction_id: "at1manage",
            function_name: EXPLORER_TRANSFER_TYPES.JOIN,
          }),
          feeRecord,
        ],
      });

      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockToPrivateFeeBridgeOperation).toHaveBeenCalledWith(
        mockLedgerAccountId,
        feeRecord,
        details,
        mockAddress,
      );
      expect(operations).toEqual([feeOperation]);
      expect(consumedRecordTags).toEqual(new Set(expectedTags));
    },
  );

  it("should mark the inputs of a join paid with a public fee as consumed without listing it again", async () => {
    mockGetTransactionById.mockResolvedValueOnce({
      ...getRecordManagementDetails(EXPLORER_TRANSFER_TYPES.JOIN, "Accepted"),
      fee: {
        transition: {
          ...getMockedTransition([{ id: "in0", type: "public", value: "5000000u64" }]),
          function: EXPLORER_TRANSFER_TYPES.FEE_PUBLIC,
        },
      },
    });

    const { operations, consumedRecordTags } = await run({
      privateRecords: [
        getMockedRecord({
          transaction_id: "at1manage",
          function_name: EXPLORER_TRANSFER_TYPES.JOIN,
        }),
      ],
      knownTransactionIds: new Set(["at1manage"]),
    });

    expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "at1manage");
    expect(mockToPrivateFeeBridgeOperation).not.toHaveBeenCalled();
    expect(operations).toEqual([]);
    expect(consumedRecordTags).toEqual(new Set(["input-tag-1", "input-tag-2"]));
  });
});
