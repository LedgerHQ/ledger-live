import { fetchFeeEstimateTransaction, fetchFeeEstimateTransfer } from "@stacks/transactions";
import { fetchLowTransactionFee } from "../fetchLowTransactionFee";

jest.mock("@stacks/transactions", () => ({
  fetchFeeEstimateTransaction: jest.fn(),
  fetchFeeEstimateTransfer: jest.fn(),
}));

const params = {
  payload: "0xpayload",
  estimatedLength: 180,
  network: "mainnet" as const,
  client: { baseUrl: "https://stacks.test.invalid" },
};

const missingRoute = new Error(
  'Error estimating transaction fee. Response 404: Not Found. Attempted to fetch https://stacks.coin.ledger.com/v2/fees/transaction and failed with the message: "no Route matched"',
);

describe("fetchLowTransactionFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the rounded low tier when the transaction fee route responds", async () => {
    jest.mocked(fetchFeeEstimateTransaction).mockResolvedValue([
      { fee: 100.4, fee_rate: 1 },
      { fee: 250, fee_rate: 2 },
      { fee: 500, fee_rate: 4 },
    ]);

    await expect(fetchLowTransactionFee(params)).resolves.toBe(100);
    expect(fetchFeeEstimateTransfer).not.toHaveBeenCalled();
  });

  it("should fall back to the transfer fee rate when the transaction fee route is missing", async () => {
    jest.mocked(fetchFeeEstimateTransaction).mockRejectedValue(missingRoute);
    jest.mocked(fetchFeeEstimateTransfer).mockResolvedValue(27360n);

    await expect(fetchLowTransactionFee(params)).resolves.toBe(27360);
    expect(fetchFeeEstimateTransfer).toHaveBeenCalledWith({
      transaction: 180,
      network: "mainnet",
      client: params.client,
    });
  });

  it("should rethrow when the transaction fee route fails for another reason", async () => {
    jest.mocked(fetchFeeEstimateTransaction).mockRejectedValue(new Error("Response 500"));

    await expect(fetchLowTransactionFee(params)).rejects.toThrow("Response 500");
    expect(fetchFeeEstimateTransfer).not.toHaveBeenCalled();
  });
});
