import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { sdkClient } from "../network/sdk";
import { craftTransaction } from "./craftTransaction";
import { mapTransactionIntentToSdkIntent, serializeTransaction } from "./utils";

jest.mock("../network/sdk");
jest.mock("./utils");

const mockCurrency: CryptoCurrency = getCryptoCurrencyById("aleo");
const mockViewKey = "AViewKey1mockviewkey";
const mockIntent: TransactionIntent = {
  type: "transfer_public",
  amount: BigInt(1000),
  to: "aleo1recipient",
};
const mockMappedIntent = { mapped: "intent" };
const mockSdkResponse = { foo: "bar" };
const mockSerializedTx = { tx: "serialized" };

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(mapTransactionIntentToSdkIntent).mockReturnValue(mockMappedIntent);
    jest.mocked(sdkClient.createRequestFromIntent).mockResolvedValue(mockSdkResponse);
    jest.mocked(serializeTransaction).mockReturnValue(mockSerializedTx);
  });

  it("should return a crafted transaction with serialized response", async () => {
    const result = await craftTransaction({
      currency: mockCurrency,
      txIntent: mockIntent,
      viewKey: mockViewKey,
    });

    expect(result).toEqual({ transaction: mockSerializedTx });
  });

  it("should map transaction intent and pass to SDK client", async () => {
    await craftTransaction({
      currency: mockCurrency,
      txIntent: mockIntent,
      viewKey: mockViewKey,
    });

    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledWith(mockIntent);
    expect(mapTransactionIntentToSdkIntent).toHaveBeenCalledTimes(1);
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      currency: mockCurrency,
      intent: mockMappedIntent,
      viewKey: mockViewKey,
    });
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
  });

  it("should omit viewKey from request when not provided", async () => {
    await craftTransaction({
      currency: mockCurrency,
      txIntent: mockIntent,
    });

    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledWith({
      currency: mockCurrency,
      intent: mockMappedIntent,
    });
    expect(sdkClient.createRequestFromIntent).toHaveBeenCalledTimes(1);
  });

  it("should serialize the SDK response", async () => {
    await craftTransaction({
      currency: mockCurrency,
      txIntent: mockIntent,
      viewKey: mockViewKey,
    });

    expect(serializeTransaction).toHaveBeenCalledWith(mockSdkResponse);
    expect(serializeTransaction).toHaveBeenCalledTimes(1);
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
