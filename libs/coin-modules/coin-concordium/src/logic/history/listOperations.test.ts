import { VALID_ADDRESS } from "../../test/fixtures";
import { listOperations } from "./listOperations";

jest.mock("../../network/grpcClient", () => ({
  getOperations: jest.fn(),
}));

jest.mock("../../network/proxyClient", () => ({
  getOperations: jest.fn(),
}));

const { getOperations: getOperationsGrpcMock } = jest.requireMock("../../network/grpcClient");

const { getOperations: getOperationsProxyMock } = jest.requireMock("../../network/proxyClient");

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use grpc client when minHeight > 0", async () => {
    // GIVEN
    const mockOperations = [
      {
        id: "op1",
        asset: { type: "native" },
        tx: { hash: "tx1", fees: BigInt(100), date: new Date(), failed: false, block: {} },
        type: "OUT",
        value: BigInt(1000),
        senders: [VALID_ADDRESS],
        recipients: ["recipient1"],
      },
    ];
    getOperationsGrpcMock.mockResolvedValue({ items: mockOperations, next: undefined });

    // WHEN
    const result = await listOperations(VALID_ADDRESS, { minHeight: 100 }, "concordium_testnet");

    // THEN
    expect(getOperationsGrpcMock).toHaveBeenCalledWith("concordium_testnet", VALID_ADDRESS, {
      minHeight: 100,
    });
    expect(result).toEqual({ items: mockOperations, next: undefined });
  });

  it("should use proxy client when minHeight is 0", async () => {
    // GIVEN
    const mockLiveOperations = [
      {
        id: "encoded-op-id-1",
        hash: "txhash1",
        fee: 500,
        date: new Date("2024-01-15"),
        blockHeight: 3000,
        blockHash: "block3000",
        type: "OUT",
        value: 50000,
        senders: [VALID_ADDRESS],
        recipients: ["recipient2"],
      },
    ];
    getOperationsProxyMock.mockResolvedValue(mockLiveOperations);

    // WHEN
    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    // THEN
    expect(getOperationsProxyMock).toHaveBeenCalledWith("concordium_testnet", {
      address: VALID_ADDRESS,
      accountId: expect.stringContaining("concordium"),
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: "encoded-op-id-1",
      type: "OUT",
    });
    expect(result.next).toBeUndefined();
  });

  it("should transform proxy operations to API format", async () => {
    // GIVEN
    const opDate = new Date("2024-01-15T12:00:00Z");
    const mockLiveOperations = [
      {
        id: "encoded-op-id-2",
        hash: "txhash2",
        fee: 1000,
        date: opDate,
        blockHeight: 4000,
        blockHash: "block4000",
        type: "IN",
        value: 100000,
        senders: ["sender1"],
        recipients: [VALID_ADDRESS],
      },
    ];
    getOperationsProxyMock.mockResolvedValue(mockLiveOperations);

    // WHEN
    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    // THEN
    const { items: operations } = result;
    expect(operations[0]).toEqual({
      id: "encoded-op-id-2",
      asset: { type: "native" },
      tx: {
        hash: "txhash2",
        fees: BigInt(1000),
        date: opDate,
        failed: false,
        block: {
          height: 4000,
          hash: "block4000",
          time: opDate,
        },
      },
      type: "IN",
      value: BigInt(100000),
      senders: ["sender1"],
      recipients: [VALID_ADDRESS],
    });
  });

  it("should handle missing blockHeight and blockHash", async () => {
    // GIVEN
    const opDate = new Date("2024-01-15T12:00:00Z");
    const mockLiveOperations = [
      {
        id: "encoded-op-id-3",
        hash: "txhash3",
        fee: 500,
        date: opDate,
        blockHeight: undefined,
        blockHash: undefined,
        type: "OUT",
        value: 25000,
        senders: [VALID_ADDRESS],
        recipients: ["recipient3"],
      },
    ];
    getOperationsProxyMock.mockResolvedValue(mockLiveOperations);

    // WHEN
    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    // THEN
    const { items: operations } = result;
    expect(operations[0].tx.block).toEqual({
      height: 0,
      hash: "txhash3", // Falls back to tx hash
      time: opDate,
    });
  });

  it("should return empty array when no operations found", async () => {
    // GIVEN
    getOperationsProxyMock.mockResolvedValue([]);

    // WHEN
    const result = await listOperations(VALID_ADDRESS, { minHeight: 0 }, "concordium_testnet");

    // THEN
    expect(result).toEqual({ items: [], next: undefined });
  });
});
