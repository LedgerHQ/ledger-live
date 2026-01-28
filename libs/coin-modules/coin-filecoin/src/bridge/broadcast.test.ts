import { broadcast } from "./broadcast";
import { broadcastTx } from "../api";
import { getTxToBroadcast } from "../common-logic";
import { Operation } from "@ledgerhq/types-live";

jest.mock("../api");
jest.mock("../common-logic");

const mockedBroadcastTx = broadcastTx as jest.MockedFunction<typeof broadcastTx>;
const mockedGetTxToBroadcast = getTxToBroadcast as jest.MockedFunction<typeof getTxToBroadcast>;

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast a transaction and return operation with hash", async () => {
    const mockTxHash = "bafy2bzacetest1234567890";
    const mockOperation: Operation = {
      id: "test-op-id",
      hash: "",
      type: "OUT",
      value: BigInt(1000000000000000000),
      fee: BigInt(100000000000),
      blockHeight: null,
      blockHash: null,
      accountId: "js:2:filecoin:f1test:filecoin",
      senders: ["f1sender"],
      recipients: ["f1recipient"],
      date: new Date("2024-01-01"),
      extra: {},
    };

    const mockSignedOperation = {
      operation: mockOperation,
      signature: "mocksignature",
      rawData: { message: {}, signature: {} },
    };

    mockedGetTxToBroadcast.mockReturnValue({ message: {}, signature: {} });
    mockedBroadcastTx.mockResolvedValue({ hash: mockTxHash });

    const result = await broadcast({ signedOperation: mockSignedOperation } as never);

    expect(mockedGetTxToBroadcast).toHaveBeenCalledWith(
      mockOperation,
      "mocksignature",
      mockSignedOperation.rawData,
    );
    expect(mockedBroadcastTx).toHaveBeenCalled();
    expect(result.hash).toBe(mockTxHash);
    expect(result.id).toContain(mockTxHash);
  });

  it("should throw when broadcastTx fails", async () => {
    const mockOperation: Operation = {
      id: "test-op-id",
      hash: "",
      type: "OUT",
      value: BigInt(1000000000000000000),
      fee: BigInt(100000000000),
      blockHeight: null,
      blockHash: null,
      accountId: "js:2:filecoin:f1test:filecoin",
      senders: ["f1sender"],
      recipients: ["f1recipient"],
      date: new Date("2024-01-01"),
      extra: {},
    };

    const mockSignedOperation = {
      operation: mockOperation,
      signature: "mocksignature",
      rawData: { message: {}, signature: {} },
    };

    mockedGetTxToBroadcast.mockReturnValue({ message: {}, signature: {} });
    mockedBroadcastTx.mockRejectedValue(new Error("Broadcast failed"));

    await expect(broadcast({ signedOperation: mockSignedOperation } as never)).rejects.toThrow(
      "Broadcast failed",
    );
  });
});
