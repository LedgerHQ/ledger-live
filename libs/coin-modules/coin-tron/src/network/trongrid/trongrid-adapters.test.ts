import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import BigNumber from "bignumber.js";
import { TrongridTxInfo } from "../../types";
import { fromTrongridTxInfoToOperation } from "./trongrid-adapters";

// Mock fromBigNumberToBigInt
jest.mock("@ledgerhq/coin-framework/utils", () => ({
  fromBigNumberToBigInt: jest.fn(),
}));

describe("fromTrongridTxInfoToOperation", () => {
  const mockUserAddress = "from";

  const mockBlock = {
    height: 10,
    hash: "blockHash123",
    time: new Date(1627843345000),
  };

  const mockTrongridTxInfo: TrongridTxInfo = {
    txID: "tx123",
    blockHeight: 10,
    date: new Date(1627843345000),
    fee: new BigNumber("1000"),
    value: new BigNumber("5000"),
    from: "from",
    to: "to",
    tokenType: "trc20",
    tokenAddress: "boo",
    hasFailed: false,
    type: "TriggerSmartContract",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fromBigNumberToBigInt as jest.Mock).mockImplementation(
      (value: BigNumber | undefined, defaultValue: bigint) =>
        value ? BigInt(value.toFixed()) : defaultValue,
    );
  });

  it("should correctly transform a TrongridTxInfo to an Operation", () => {
    const result = fromTrongridTxInfoToOperation(mockTrongridTxInfo, mockBlock, mockUserAddress);

    expect(result).toEqual({
      id: "tx123",
      tx: {
        hash: "tx123",
        block: { height: 10, hash: "blockHash123", time: new Date(1627843345000) },
        fees: BigInt(1000),
        date: new Date(1627843345000),
        failed: false,
      },
      type: "OUT",
      value: BigInt(5000),
      senders: ["from"],
      recipients: ["to"],
      asset: { type: "trc20", assetReference: "boo" },
    });
  });

  it("should return IN operation type when the user address is the recipient", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      from: "randomAddress",
      to: mockUserAddress,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockBlock, mockUserAddress);

    expect(result.type).toBe("IN");
  });

  it("should return OUT operation type when the user address is the sender", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      from: mockUserAddress,
      to: "randomAddress",
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockBlock, mockUserAddress);

    expect(result.type).toBe("OUT");
  });

  it("should handle missing blockHeight gracefully", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      blockHeight: undefined,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockBlock, mockUserAddress);

    expect(result.tx.block.height).toBe(10);
  });

  it("should return a native asset (not a token) when type / tokenAddr is undefined", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      tokenType: undefined,
      tokenAddressOrId: undefined,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockBlock, mockUserAddress);

    expect(result.asset).toEqual({ type: "native" });
  });

  it("should return UNKNOWN operation in default case", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      from: mockUserAddress,
      to: mockUserAddress,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockBlock, mockUserAddress);

    expect(result.type).toBe("UNKNOWN");
  });

  it("should handle missing fee or value gracefully", () => {
    const txInfo = {
      ...mockTrongridTxInfo,
      fee: undefined,
      value: undefined,
    };

    const result = fromTrongridTxInfoToOperation(txInfo, mockBlock, mockUserAddress);

    expect(result.tx.fees).toBe(BigInt(0));
    expect(result.value).toBe(BigInt(0));
  });
});
