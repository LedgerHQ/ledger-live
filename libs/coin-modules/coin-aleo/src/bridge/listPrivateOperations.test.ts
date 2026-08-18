import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedEnrichedPrivateRecord, getMockedRecord } from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { enrichPrivateRecords } from "../network/utils";
import type { AleoTransition } from "../types";
import { toPrivateBridgeOperation } from "./utils";
import { buildConsumedRecordTags, listPrivateOperations } from "./listPrivateOperations";

jest.mock("../network/utils");
jest.mock("./utils");

const mockEnrichPrivateRecords = jest.mocked(enrichPrivateRecords);
const mockToPrivateBridgeOperation = jest.mocked(toPrivateBridgeOperation);

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
