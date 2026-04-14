import { sdkClient } from "../network/sdk";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedPreparedRequestResponse } from "../__tests__/fixtures/sdk.fixture";
import {
  mockTxIntentFeePrivate,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";
import type { FeeConfiguration, Intent } from "../types";
import { craftTransaction } from "./craftTransaction";
import { mapTransactionIntentToSdkIntent, toHex } from "./utils";

jest.mock("../network/sdk");
jest.mock("./utils");

const mockCurrency = getMockedCurrency();
const mockViewKey = "AViewKey1mockviewkey";
const mockSdkIntent: Intent = {
  type: "transfer_public",
  amount: "1000",
  to: "aleo1recipient",
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
      currency: mockCurrency,
      txIntent: mockTxIntentTransferPublic,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });

    expect(result).toEqual({ transaction: mockSerializedTx });
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledTimes(1);
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledWith(mockTxIntentTransferPublic);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      configOrCurrencyId: mockCurrency.id,
      intent: mockSdkIntent,
      feeConfiguration: mockFeeConfiguration,
      viewKey: mockViewKey,
    });
    expect(toHex).toHaveBeenCalledTimes(1);
    expect(toHex).toHaveBeenCalledWith(mockSdkResponse);
  });

  it("should omit viewKey from request when not provided", async () => {
    await craftTransaction({
      currency: mockCurrency,
      txIntent: mockTxIntentTransferPublic,
      feeConfiguration: null,
    });

    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      configOrCurrencyId: mockCurrency.id,
      intent: mockSdkIntent,
      feeConfiguration: null,
    });
  });

  it("should propagate SDK client errors", async () => {
    jest.mocked(sdkClient.createRequestFromIntent).mockRejectedValueOnce(new Error("sdk error"));

    await expect(
      craftTransaction({
        currency: mockCurrency,
        txIntent: mockTxIntentTransferPublic,
        feeConfiguration: mockFeeConfiguration,
        viewKey: mockViewKey,
      }),
    ).rejects.toThrow("sdk error");
  });

  it("should craft fee_private intent and call SDK", async () => {
    await craftTransaction({
      currency: mockCurrency,
      txIntent: mockTxIntentFeePrivate,
      feeConfiguration: mockFeeConfiguration,
    });

    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledWith(mockTxIntentFeePrivate);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(toHex).toHaveBeenCalledTimes(1);
  });
});
