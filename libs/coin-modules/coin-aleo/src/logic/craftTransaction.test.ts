import { sdkClient } from "../network/sdk";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedPreparedRequestResponse } from "../__tests__/fixtures/sdk.fixture";
import {
  MOCK_MULTI_RECORD_TVKS,
  mockTxIntentFeePrivate,
  mockTxIntentTransferPrivate,
  mockTxIntentTransferPrivate2,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import { mockUnspentRecord1, mockUnspentRecord2 } from "../__tests__/fixtures/account.fixture";
import { TRANSACTION_TYPE } from "../constants";
import type { AleoTransactionIntent, FeeConfiguration, Intent } from "../types";
import { craftTransaction } from "./craftTransaction";
import { mapTransactionIntentToSdkIntent, toHex } from "./utils";

jest.mock("../network/sdk");
jest.mock("./utils");

const mockConfig = getMockedConfig("mainnet");
const mockViewKey = "AViewKey1mockviewkey";
const mockSdkIntent: Intent = {
  type: "transfer_public",
  amount: "1000",
  to: "aleo1recipient",
};
const mockMultiRecordSdkIntent: Intent = {
  type: "transfer_private_2",
  amount: "200",
  to: "aleo1recipient",
  records: [mockUnspentRecord1.decryptedData, mockUnspentRecord2.decryptedData],
};
const mockSingleRecordSdkIntent: Intent = {
  type: "transfer_private",
  amount: "200",
  to: "aleo1recipient",
  record: mockUnspentRecord1.decryptedData,
};
const mockSdkResponse = getMockedPreparedRequestResponse({
  network_id: 0,
  function_name: "transfer_public",
  inputs: [],
  input_types: [],
});
const mockSerializedTx = "7b227478223a2273657269616c697a6564227d";
const mockFeeConfiguration: FeeConfiguration = {
  function_name: "fee_public",
  max_base_fee: "1000",
  max_priority_fee: "10",
};

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mapTransactionIntentToSdkIntent).mockReturnValue(mockSdkIntent);
    jest.mocked(sdkClient.createRequestFromIntent).mockResolvedValue(mockSdkResponse);
    jest.mocked(toHex).mockReturnValue(mockSerializedTx);
  });

  it("should craft transaction by mapping intent, calling SDK and serializing response", async () => {
    const result = await craftTransaction({
      config: mockConfig,
      txIntent: mockTxIntentTransferPublic,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });

    expect(result).toEqual({ transaction: mockSerializedTx });
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledTimes(1);
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledWith(mockTxIntentTransferPublic);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      config: mockConfig,
      intent: mockSdkIntent,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });
    expect(toHex).toHaveBeenCalledTimes(1);
    expect(toHex).toHaveBeenCalledWith(mockSdkResponse);
  });

  it("should omit viewKey from request when not provided", async () => {
    await craftTransaction({
      config: mockConfig,
      txIntent: mockTxIntentTransferPublic,
      feeConfiguration: null,
    });

    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      config: mockConfig,
      intent: mockSdkIntent,
      feeConfiguration: null,
    });
  });

  it("should propagate SDK client errors", async () => {
    jest.mocked(sdkClient.createRequestFromIntent).mockRejectedValueOnce(new Error("sdk error"));

    await expect(
      craftTransaction({
        config: mockConfig,
        txIntent: mockTxIntentTransferPublic,
        feeConfiguration: mockFeeConfiguration,
        viewKey: mockViewKey,
      }),
    ).rejects.toThrow("sdk error");
  });

  it("should craft fee_private intent and call SDK", async () => {
    await craftTransaction({
      config: mockConfig,
      txIntent: mockTxIntentFeePrivate,
      feeConfiguration: mockFeeConfiguration,
    });

    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledWith(mockTxIntentFeePrivate);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(toHex).toHaveBeenCalledTimes(1);
  });

  it("should pass tvks read from txIntent.data to SDK for multi-record intents", async () => {
    jest.mocked(mapTransactionIntentToSdkIntent).mockReturnValue(mockMultiRecordSdkIntent);

    await craftTransaction({
      config: mockConfig,
      txIntent: mockTxIntentTransferPrivate2,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });

    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      config: mockConfig,
      intent: mockMultiRecordSdkIntent,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
      tvks: MOCK_MULTI_RECORD_TVKS,
    });
  });

  it("should require a non-empty txIntent.data.tvks for multi-record intents before calling the SDK", async () => {
    jest.mocked(mapTransactionIntentToSdkIntent).mockReturnValue(mockMultiRecordSdkIntent);
    const txIntentWithEmptyTvks: AleoTransactionIntent = {
      ...mockTxIntentTransferPrivate2,
      data: {
        type: TRANSACTION_TYPE.TRANSFER_PRIVATE,
        records: [mockUnspentRecord1.decryptedData, mockUnspentRecord2.decryptedData],
        tvks: [],
      },
    };

    await expect(
      craftTransaction({
        config: mockConfig,
        txIntent: txIntentWithEmptyTvks,
        feeConfiguration: mockFeeConfiguration,
        viewKey: mockViewKey,
      }),
    ).rejects.toThrow("aleo: tvks are required for transactions with nested calls");

    expect(sdkClient.createRequestFromIntent).not.toHaveBeenCalled();
  });

  it("should craft successfully with an empty tvks array for a single-record intent, omitting tvks from the SDK call", async () => {
    jest.mocked(mapTransactionIntentToSdkIntent).mockReturnValue(mockSingleRecordSdkIntent);

    const result = await craftTransaction({
      config: mockConfig,
      txIntent: mockTxIntentTransferPrivate,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });

    expect(result).toEqual({ transaction: mockSerializedTx });
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      config: mockConfig,
      intent: mockSingleRecordSdkIntent,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });
    expect(sdkClient.createRequestFromIntent).not.toHaveBeenCalledWith(
      expect.objectContaining({ tvks: expect.anything() }),
    );
  });
});
