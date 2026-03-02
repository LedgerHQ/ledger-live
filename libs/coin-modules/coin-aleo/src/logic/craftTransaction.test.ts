import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { sdkClient } from "../network/sdk";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { craftTransaction } from "./craftTransaction";
import { mapTransactionIntentToSdkIntent, serializeTransaction } from "./utils";

jest.mock("../network/sdk");
jest.mock("./utils");

const mockCurrency = getMockedCurrency();
const mockViewKey = "AViewKey1mockviewkey";
const mockIntent: TransactionIntent = {
  intentType: "transaction",
  asset: { type: "native" },
  type: "transfer_public",
  amount: BigInt(1000),
  sender: "aleo1sender",
  recipient: "aleo1recipient",
};
const mockMappedIntent = { mapped: "intent" };
const mockSdkResponse = { foo: "bar" };
const mockSerializedTx = "7b227478223a2273657269616c697a6564227d";

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mapTransactionIntentToSdkIntent).mockReturnValue(mockMappedIntent);
    jest.mocked(sdkClient.createRequestFromIntent).mockResolvedValue(mockSdkResponse);
    jest.mocked(serializeTransaction).mockReturnValue(mockSerializedTx);
  });

  it("should craft transaction by mapping intent, calling SDK and serializing response", async () => {
    const result = await craftTransaction({
      currency: mockCurrency,
      txIntent: mockIntent,
      viewKey: mockViewKey,
    });

    expect(result).toEqual({ transaction: mockSerializedTx });
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledTimes(1);
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledWith(mockIntent);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      currency: mockCurrency,
      intent: mockMappedIntent,
      viewKey: mockViewKey,
    });
    expect(serializeTransaction).toHaveBeenCalledTimes(1);
    expect(serializeTransaction).toHaveBeenCalledWith(mockSdkResponse);
  });

  it("should omit viewKey from request when not provided", async () => {
    await craftTransaction({
      currency: mockCurrency,
      txIntent: mockIntent,
    });

    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      currency: mockCurrency,
      intent: mockMappedIntent,
    });
  });

  it("should propagate SDK client errors", async () => {
    jest.mocked(sdkClient.createRequestFromIntent).mockRejectedValueOnce(new Error("sdk error"));

    await expect(
      craftTransaction({
        currency: mockCurrency,
        txIntent: mockIntent,
        viewKey: mockViewKey,
      }),
    ).rejects.toThrow("sdk error");
  });
});
