import BigNumber from "bignumber.js";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedDecryptedRecord, getMockedRecord } from "../__tests__/fixtures/api.fixture";
import {
  mockApiTxIntentFeePrivate,
  mockApiTxIntentTransferPrivate,
  mockApiTxIntentTransferPrivateSelection,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import { PROGRAM_ID, TRANSACTION_TYPE } from "../constants";
import { decryptRecordAmount, fetchAllOwnedRecords } from "../network/utils";
import type { AleoApiTransactionIntent, AleoContext } from "../types";
import { resolveRecords, selectRecords } from "./recordSelection";

jest.mock("../network/utils");

const mockedFetchAllOwnedRecords = jest.mocked(fetchAllOwnedRecords);
const mockedDecryptRecordAmount = jest.mocked(decryptRecordAmount);

const TOKEN_PROGRAM_ID = "token_b.aleo";
const config = getMockedConfig("testnet");
const context: AleoContext = {
  config: async () => config,
  logger: () => {},
  provableId: "scan-uuid",
  viewKey: "AViewKey1test",
};

const decryptedRecord = (commitment: string) =>
  getMockedDecryptedRecord({ nonce: `${commitment}-nonce` });

function mockUnspentRecords(
  records: { commitment: string; amount: number; programName?: string; recordName?: string }[],
) {
  const ownedRecords = records.map(({ commitment, programName, recordName }) =>
    getMockedRecord({
      commitment,
      program_name: programName ?? PROGRAM_ID.CREDITS,
      record_name: recordName ?? (programName ? "Token" : "credits"),
    }),
  );

  mockedFetchAllOwnedRecords.mockImplementation(async ({ programs }) =>
    ownedRecords.filter(record => programs?.includes(record.program_name)),
  );
  mockedDecryptRecordAmount.mockImplementation(async (_config, _viewKey, record) => ({
    amount: new BigNumber(records.find(r => r.commitment === record.commitment)?.amount ?? 0),
    details: decryptedRecord(record.commitment),
  }));
}

const tokenSelectionIntent: AleoApiTransactionIntent = {
  ...mockApiTxIntentTransferPrivateSelection,
  amount: 400n,
  type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
  data: { type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE, programId: TOKEN_PROGRAM_ID },
};

describe("selectRecords", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("picks the amount records, then a fee record outside them", async () => {
    mockUnspentRecords([
      { commitment: "a", amount: 150 },
      { commitment: "b", amount: 100 },
      { commitment: "c", amount: 30 },
    ]);

    const selection = await selectRecords({
      config,
      context,
      txIntent: mockApiTxIntentTransferPrivateSelection,
      fee: 20n,
    });

    expect(selection).toEqual({ recordCommitments: ["a", "b"], feeRecordCommitment: "c" });
    expect(mockedFetchAllOwnedRecords).toHaveBeenCalledWith({
      config,
      uuid: "scan-uuid",
      unspent: true,
      programs: [PROGRAM_ID.CREDITS],
      functions: [],
    });
  });

  it("picks no fee record when fees are sponsored", async () => {
    mockUnspentRecords([{ commitment: "a", amount: 250 }]);

    const selection = await selectRecords({
      config,
      context,
      txIntent: mockApiTxIntentTransferPrivateSelection,
      fee: null,
    });

    expect(selection).toEqual({ recordCommitments: ["a"] });
  });

  it("fails when the records can't cover the amount", async () => {
    mockUnspentRecords([{ commitment: "a", amount: 100 }]);

    await expect(
      selectRecords({
        config,
        context,
        txIntent: mockApiTxIntentTransferPrivateSelection,
        fee: 20n,
      }),
    ).rejects.toThrow("not enough private records to cover the amount");
  });

  it("fails before signing when no record is left for the fee", async () => {
    mockUnspentRecords([{ commitment: "a", amount: 250 }]);

    await expect(
      selectRecords({
        config,
        context,
        txIntent: mockApiTxIntentTransferPrivateSelection,
        fee: 20n,
      }),
    ).rejects.toThrow("no private record left to cover the fee");
  });

  it("picks token records for the amount and a credits record for the fee", async () => {
    mockUnspentRecords([
      { commitment: "token-1", amount: 500, programName: TOKEN_PROGRAM_ID },
      { commitment: "not-a-token", amount: 1000, programName: TOKEN_PROGRAM_ID, recordName: "x" },
      { commitment: "credits-1", amount: 30 },
    ]);

    const selection = await selectRecords({
      config,
      context,
      txIntent: tokenSelectionIntent,
      fee: 20n,
    });

    expect(selection).toEqual({ recordCommitments: ["token-1"], feeRecordCommitment: "credits-1" });
  });

  it("rejects an intent that spends no private records", async () => {
    await expect(
      selectRecords({ config, context, txIntent: mockTxIntentTransferPublic, fee: null }),
    ).rejects.toThrow("intent data is required for transfer_public");
  });
});

describe("resolveRecords", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnspentRecords([
      { commitment: "record-1-commitment", amount: 150 },
      { commitment: "record-2-commitment", amount: 100 },
      { commitment: "record-3-commitment", amount: 30 },
    ]);
  });

  it("passes an intent without records through unchanged", async () => {
    const result = await resolveRecords({ config, context, txIntent: mockTxIntentTransferPublic });

    expect(result).toBe(mockTxIntentTransferPublic);
    expect(mockedFetchAllOwnedRecords).not.toHaveBeenCalled();
  });

  it("resolves the commitments into decrypted records, in the given order", async () => {
    const tvks = ["tvk-0", "tvk-1", "tvk-2"];

    const result = await resolveRecords({
      config,
      context,
      txIntent: {
        ...mockApiTxIntentTransferPrivate,
        data: {
          type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
          recordCommitments: ["record-3-commitment", "record-1-commitment"],
          tvks,
        },
      },
    });

    expect(result).toEqual({
      ...mockApiTxIntentTransferPrivate,
      data: {
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        records: [decryptedRecord("record-3-commitment"), decryptedRecord("record-1-commitment")],
        tvks,
      },
    });
  });

  it("keeps the token program of a private token intent", async () => {
    mockUnspentRecords([{ commitment: "token-1", amount: 500, programName: TOKEN_PROGRAM_ID }]);

    const result = await resolveRecords({
      config,
      context,
      txIntent: {
        ...tokenSelectionIntent,
        data: {
          type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
          programId: TOKEN_PROGRAM_ID,
          recordCommitments: ["token-1"],
        },
      },
    });

    expect(result).toEqual({
      ...tokenSelectionIntent,
      data: {
        type: TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
        programId: TOKEN_PROGRAM_ID,
        records: [decryptedRecord("token-1")],
        tvks: [],
      },
    });
  });

  it.each([
    [
      ["record-1-commitment", "record-2-commitment"],
      [],
      "expected 3 tvks for 2 record(s), received 0",
    ],
    [["record-1-commitment"], ["tvk-0"], "expected 0 tvks for 1 record(s), received 1"],
  ])("rejects %j with tvks %j", async (recordCommitments, tvks, message) => {
    await expect(
      resolveRecords({
        config,
        context,
        txIntent: {
          ...mockApiTxIntentTransferPrivate,
          data: { type: TRANSACTION_TYPE.TRANSFER_PRIVATE, recordCommitments, tvks },
        },
      }),
    ).rejects.toThrow(message);
    expect(mockedFetchAllOwnedRecords).not.toHaveBeenCalled();
  });

  it("fails when a commitment is no longer unspent", async () => {
    await expect(
      resolveRecords({
        config,
        context,
        txIntent: {
          ...mockApiTxIntentTransferPrivate,
          data: { type: TRANSACTION_TYPE.TRANSFER_PRIVATE, recordCommitments: ["spent-elsewhere"] },
        },
      }),
    ).rejects.toThrow("records are no longer unspent: spent-elsewhere");
  });

  it("resolves the fee record of a fee_private intent", async () => {
    const result = await resolveRecords({ config, context, txIntent: mockApiTxIntentFeePrivate });

    expect(result).toEqual({
      ...mockApiTxIntentFeePrivate,
      data: {
        type: "fee_private",
        executionId:
          "7287422539927885800585937944314327552710698933416219800491628782750554575326field",
        priorityFee: 6000n,
        record: decryptedRecord("record-2-commitment"),
      },
    });
  });
});
