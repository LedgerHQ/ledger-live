import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import { fromTrongridTxInfoToOperation } from "./trongrid-adapters";
import { TrongridTxInfo } from "../../types";

// Mock fromBigNumberToBigInt
jest.mock("@ledgerhq/coin-framework/utils", () => ({
  fromBigNumberToBigInt: jest.fn(),
}));

describe("fromTrongridTxInfoToOperation", () => {
  const mockUserAddress = "from";

  const mockTrongridTxInfo: TrongridTxInfo = {
    txID: "tx123",
    blockHeight: 10,
    date: 1627843345,
    fee: "1000", // Fee as string (simulating BigNumber)
    value: "5000", // Value as string (simulating BigNumber)
    from: "from",
    to: "to",
    tokenType: "trc20",
    tokenAddress: "boo",
  } as unknown as TrongridTxInfo;

  beforeEach(() => {
    jest.clearAllMocks();
    (fromBigNumberToBigInt as jest.Mock).mockImplementation(
      (value: string, defaultValue: bigint) => (value != null ? BigInt(value) : defaultValue),
    );
  });

  it("should correctly transform a TrongridTxInfo to an Operation", () => {
    const result = fromTrongridTxInfoToOperation(mockTrongridTxInfo, mockUserAddress);

    expect(result).toMatchObject({
      operationIndex: 0,
      tx: {
        hash: "tx123",
        block: { height: 10, time: 1627843345 },
        fees: BigInt(1000),
        date: 1627843345,
      },
      type: "OUT",
      value: BigInt(5000),
      senders: ["from"],
      recipients: ["to"],
      asset: { standard: "trc20", contractAddress: "boo" },
    });
  });

  it("should return IN operation type when the user address is the recipient", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      from: "randomAddress",
      to: mockUserAddress,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockUserAddress);

    expect(result.type).toBe("IN");
  });

  it("should return OUT operation type when the user address is the sender", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      from: mockUserAddress,
      to: "randomAddress",
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockUserAddress);

    expect(result.type).toBe("OUT");
  });

  it("should handle missing blockHeight gracefully", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      blockHeight: undefined,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockUserAddress);

    expect(result.tx.block.height).toBe(0); // default value
  });

  it("should return undefined asset (not a token) when type / tokenAddr is undefined", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      tokenType: undefined,
      tokenAddressOrId: undefined,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockUserAddress);

    expect(result.asset).toBeUndefined();
  });

  it("should return UNKNOWN operation in default case", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      from: mockUserAddress,
      to: mockUserAddress,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockUserAddress);

    expect(result.type).toBe("UNKNOWN");
  });

  it("should handle missing fee or value gracefully", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      fee: undefined,
      value: undefined,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockUserAddress);

    expect(result.tx.fees).toBe(BigInt(0));
    expect(result.value).toBe(BigInt(0));
  });
});
