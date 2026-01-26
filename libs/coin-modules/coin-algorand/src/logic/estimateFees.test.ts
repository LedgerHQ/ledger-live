import * as network from "../network";
import { estimateFees, getMinFee } from "./estimateFees";

jest.mock("../network");

const mockGetTransactionParams = network.getTransactionParams as jest.MockedFunction<
  typeof network.getTransactionParams
>;

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return minimum fee when suggested fee is 0", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1000,
      lastRound: 2000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    const result = await estimateFees();

    expect(result.value).toBe(1000n);
  });

  it("should calculate fee based on transaction size when fee > 0", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 1, // 1 microAlgo per byte
      minFee: 1000,
      firstRound: 1000,
      lastRound: 2000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    // Default size is 250 + 71 = 321 bytes
    const result = await estimateFees();

    expect(result.value).toBe(1000n); // max(321, 1000) = 1000
  });

  it("should use custom transaction size when provided", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 10, // 10 microAlgos per byte
      minFee: 1000,
      firstRound: 1000,
      lastRound: 2000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    // Custom size 500 + 71 = 571 bytes * 10 = 5710
    const result = await estimateFees(500);

    expect(result.value).toBe(5710n);
  });

  it("should return minimum fee when calculated fee is lower", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 1,
      minFee: 5000,
      firstRound: 1000,
      lastRound: 2000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    const result = await estimateFees();

    expect(result.value).toBe(5000n);
  });

  it("should propagate network errors", async () => {
    mockGetTransactionParams.mockRejectedValue(new Error("Network error"));

    await expect(estimateFees()).rejects.toThrow("Network error");
  });
});

describe("getMinFee", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the minimum fee from network params", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 1000,
      firstRound: 1000,
      lastRound: 2000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    const result = await getMinFee();

    expect(result).toBe(1000n);
  });

  it("should handle different minimum fee values", async () => {
    mockGetTransactionParams.mockResolvedValue({
      fee: 0,
      minFee: 2500,
      firstRound: 1000,
      lastRound: 2000,
      genesisHash: "hash",
      genesisID: "mainnet-v1.0",
    });

    const result = await getMinFee();

    expect(result).toBe(2500n);
  });

  it("should propagate network errors", async () => {
    mockGetTransactionParams.mockRejectedValue(new Error("Network error"));

    await expect(getMinFee()).rejects.toThrow("Network error");
  });
});
