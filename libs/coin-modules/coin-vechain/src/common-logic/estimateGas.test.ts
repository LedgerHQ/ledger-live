import { estimateGas } from "./estimateGas";
import { getThorClient } from "./getThorClient";
import { TransactionClause } from "@vechain/sdk-core";
import { EstimateGasResult } from "@vechain/sdk-network";

// Mock dependencies
jest.mock("./getThorClient");

const mockedGetThorClient = jest.mocked(getThorClient);

describe("estimateGas", () => {
  const mockClauses: TransactionClause[] = [
    {
      to: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
      value: "1000000000000000000",
      data: "0x",
    },
    {
      to: "0x123456789012345678901234567890123456789a",
      value: "2000000000000000000",
      data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d0b251d8c1743ec40000000000000000000000000000000000000000000000000de0b6b3a7640000",
    },
  ];

  const mockOrigin = "0x5034aa590125b64023a0262112b98d72e3c8e40e";

  const mockEstimateGasResult: EstimateGasResult = {
    totalGas: 21000,
    reverted: false,
    revertReasons: [],
    vmErrors: [],
  };

  const mockThorClient = {
    gas: {
      estimateGas: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetThorClient.mockReturnValue(mockThorClient as any);
  });

  it("should estimate gas for transaction clauses", async () => {
    mockThorClient.gas.estimateGas.mockResolvedValue(mockEstimateGasResult);

    const result = await estimateGas(mockClauses, mockOrigin);

    expect(mockedGetThorClient).toHaveBeenCalledTimes(1);
    expect(mockThorClient.gas.estimateGas).toHaveBeenCalledWith(mockClauses, mockOrigin);
    expect(result).toEqual(mockEstimateGasResult);
  });

  it("should handle single clause", async () => {
    const singleClause: TransactionClause[] = [mockClauses[0]];
    mockThorClient.gas.estimateGas.mockResolvedValue(mockEstimateGasResult);

    const result = await estimateGas(singleClause, mockOrigin);

    expect(mockThorClient.gas.estimateGas).toHaveBeenCalledWith(singleClause, mockOrigin);
    expect(result).toEqual(mockEstimateGasResult);
  });

  it("should handle empty clauses array", async () => {
    const emptyClauses: TransactionClause[] = [];
    mockThorClient.gas.estimateGas.mockResolvedValue({
      totalGas: 0,
      reverted: false,
      revertReasons: [],
      vmErrors: [],
    });

    const result = await estimateGas(emptyClauses, mockOrigin);

    expect(mockThorClient.gas.estimateGas).toHaveBeenCalledWith(emptyClauses, mockOrigin);
    expect(result.totalGas).toBe(0);
  });

  it("should handle gas estimation with revert", async () => {
    const revertedResult: EstimateGasResult = {
      totalGas: 0,
      reverted: true,
      revertReasons: ["insufficient balance"],
      vmErrors: ["VM error: out of gas"],
    };
    mockThorClient.gas.estimateGas.mockResolvedValue(revertedResult);

    const result = await estimateGas(mockClauses, mockOrigin);

    expect(result).toEqual(revertedResult);
    expect(result.reverted).toBe(true);
    expect(result.revertReasons).toContain("insufficient balance");
  });

  it("should handle high gas estimation", async () => {
    const highGasResult: EstimateGasResult = {
      totalGas: 500000,
      reverted: false,
      revertReasons: [],
      vmErrors: [],
    };
    mockThorClient.gas.estimateGas.mockResolvedValue(highGasResult);

    const result = await estimateGas(mockClauses, mockOrigin);

    expect(result.totalGas).toBe(500000);
  });

  it("should propagate errors from thor client", async () => {
    const errorMessage = "Network error";
    mockThorClient.gas.estimateGas.mockRejectedValue(new Error(errorMessage));

    await expect(estimateGas(mockClauses, mockOrigin)).rejects.toThrow(errorMessage);
  });

  it("should handle clauses with data for token transfers", async () => {
    const tokenTransferClause: TransactionClause[] = [
      {
        to: "0x0000000000000000000000000000456e65726779",
        value: "0",
        data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d0b251d8c1743ec40000000000000000000000000000000000000000000000000de0b6b3a7640000",
      },
    ];

    const tokenGasResult: EstimateGasResult = {
      totalGas: 37000,
      reverted: false,
      revertReasons: [],
      vmErrors: [],
    };
    mockThorClient.gas.estimateGas.mockResolvedValue(tokenGasResult);

    const result = await estimateGas(tokenTransferClause, mockOrigin);

    expect(mockThorClient.gas.estimateGas).toHaveBeenCalledWith(tokenTransferClause, mockOrigin);
    expect(result.totalGas).toBe(37000);
  });

  it("should get a new thor client instance for each call", async () => {
    mockThorClient.gas.estimateGas.mockResolvedValue(mockEstimateGasResult);

    await estimateGas(mockClauses, mockOrigin);
    await estimateGas(mockClauses, mockOrigin);

    expect(mockedGetThorClient).toHaveBeenCalledTimes(2);
  });

  it("should return the exact result from thor client", async () => {
    const exactResult: EstimateGasResult = {
      totalGas: 123456,
      reverted: false,
      revertReasons: [],
      vmErrors: [],
    };
    mockThorClient.gas.estimateGas.mockResolvedValue(exactResult);

    const result = await estimateGas(mockClauses, mockOrigin);

    expect(result).toBe(exactResult);
  });
});
