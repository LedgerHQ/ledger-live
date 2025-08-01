import BigNumber from "bignumber.js";
import { TransferLog, EventLog } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

// Mock dependencies before importing the function under test
jest.mock("../network", () => ({
  getFees: jest.fn(),
}));
jest.mock("@ledgerhq/coin-framework/operation", () => ({
  encodeOperationId: jest.fn(),
}));
jest.mock("@vechain/sdk-core", () => ({
  ABIEvent: {
    parseLog: jest.fn(),
  },
  Hex: {
    of: jest.fn(),
  },
  VIP180_ABI: {},
}));

// Import the functions under test after mocking
import {
  mapVetTransfersToOperations,
  mapTokenTransfersToOperations,
} from "./mapTransfersToOperations";
import { getFees } from "../network";

const { ABIEvent, Hex, VIP180_ABI } = jest.requireMock("@vechain/sdk-core");

const mockedGetFees = jest.mocked(getFees);
const mockedEncodeOperationId = jest.mocked(encodeOperationId);
const mockedABIEvent = ABIEvent;
const mockedHex = Hex;

describe("mapVetTransfersToOperations", () => {
  const mockAccountId = "vechain:1:0x123:";
  const mockAddr = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

  const mockTransferLogs: TransferLog[] = [
    {
      sender: "0x5034aa590125b64023a0262112b98d72e3c8e40e",
      recipient: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
      amount: "1000000000000000000",
      meta: {
        blockID: "0xblock123",
        blockNumber: 12345,
        blockTimestamp: 1640995200,
        txID: "0xtx123",
        txOrigin: "0x5034aa590125b64023a0262112b98d72e3c8e40e",
        clauseIndex: 0,
      },
    },
    {
      sender: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
      recipient: "0x456789012345678901234567890123456789abcd",
      amount: "2000000000000000000",
      meta: {
        blockID: "0xblock456",
        blockNumber: 12346,
        blockTimestamp: 1640995260,
        txID: "0xtx456",
        txOrigin: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
        clauseIndex: 0,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFees.mockResolvedValue(new BigNumber("21000000000000000"));
    mockedEncodeOperationId.mockImplementation(
      (accountId, hash, type) => `${accountId}${hash}${type}`,
    );
  });

  it("should map incoming VET transfers to operations", async () => {
    const result = await mapVetTransfersToOperations(
      [mockTransferLogs[0]],
      mockAccountId,
      mockAddr,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: `${mockAccountId}0xtx123IN`,
      hash: "0xtx123",
      type: "IN",
      value: new BigNumber("1000000000000000000"),
      fee: new BigNumber("21000000000000000"),
      senders: ["0x5034aa590125b64023a0262112b98d72e3c8e40e"],
      recipients: ["0x742d35cc6634c0532925a3b8d0b251d8c1743ec4"],
      blockHeight: 12345,
      blockHash: "0xblock123",
      accountId: mockAccountId,
      date: new Date(1640995200 * 1000),
      extra: {},
    });
  });

  it("should map outgoing VET transfers to operations", async () => {
    const result = await mapVetTransfersToOperations(
      [mockTransferLogs[1]],
      mockAccountId,
      mockAddr,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: `${mockAccountId}0xtx456OUT`,
      hash: "0xtx456",
      type: "OUT",
      value: new BigNumber("2000000000000000000"),
      fee: new BigNumber("21000000000000000"),
      senders: ["0x742d35cc6634c0532925a3b8d0b251d8c1743ec4"],
      recipients: ["0x456789012345678901234567890123456789abcd"],
      blockHeight: 12346,
      blockHash: "0xblock456",
      accountId: mockAccountId,
      date: new Date(1640995260 * 1000),
      extra: {},
    });
  });

  it("should handle multiple transfers", async () => {
    const result = await mapVetTransfersToOperations(mockTransferLogs, mockAccountId, mockAddr);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("IN");
    expect(result[1].type).toBe("OUT");
  });

  it("should call getFees for each transfer", async () => {
    await mapVetTransfersToOperations(mockTransferLogs, mockAccountId, mockAddr);

    expect(mockedGetFees).toHaveBeenCalledTimes(2);
    expect(mockedGetFees).toHaveBeenCalledWith("0xtx123");
    expect(mockedGetFees).toHaveBeenCalledWith("0xtx456");
  });

  it("should handle case-insensitive address comparison", async () => {
    const upperCaseAddr = mockAddr.toUpperCase();
    const transferWithUpperCase: TransferLog = {
      ...mockTransferLogs[0],
      recipient: upperCaseAddr,
    };

    const result = await mapVetTransfersToOperations(
      [transferWithUpperCase],
      mockAccountId,
      mockAddr,
    );

    expect(result[0].type).toBe("IN");
  });

  it("should convert addresses to lowercase in the operation", async () => {
    const transferWithMixedCase: TransferLog = {
      ...mockTransferLogs[0],
      sender: "0x5034AA590125B64023A0262112B98D72E3C8E40E",
      recipient: "0x742D35CC6634C0532925A3B8D0B251D8C1743EC4",
    };

    const result = await mapVetTransfersToOperations(
      [transferWithMixedCase],
      mockAccountId,
      mockAddr,
    );

    expect(result[0].senders[0]).toBe("0x5034aa590125b64023a0262112b98d72e3c8e40e");
    expect(result[0].recipients[0]).toBe("0x742d35cc6634c0532925a3b8d0b251d8c1743ec4");
  });
});

describe("mapTokenTransfersToOperations", () => {
  const mockAccountId = "vechain:1:0x123:";
  const mockAddr = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

  const mockEventLogs: EventLog[] = [
    {
      address: "0x0000000000000000000000000000456e65726779",
      topics: [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000005034aa590125b64023a0262112b98d72e3c8e40e",
        "0x000000000000000000000000742d35cc6634c0532925a3b8d0b251d8c1743ec4",
      ],
      data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000",
      meta: {
        blockID: "0xblock789",
        blockNumber: 12347,
        blockTimestamp: 1640995320,
        txID: "0xtx789",
        txOrigin: "0x5034aa590125b64023a0262112b98d72e3c8e40e",
        clauseIndex: 0,
      },
    },
  ];

  const mockDecodedEvent = {
    eventName: "Transfer" as const,
    args: {
      from: "0x5034aa590125b64023a0262112b98d72e3c8e40e",
      to: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
      value: BigInt("1000000000000000000"),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetFees.mockResolvedValue(new BigNumber("37000000000000000"));
    mockedEncodeOperationId.mockImplementation(
      (accountId, hash, type) => `${accountId}${hash}${type}`,
    );
    mockedHex.of.mockImplementation((exp: any) => ({ toString: () => exp.toString() }) as any);
    mockedABIEvent.parseLog.mockReturnValue(mockDecodedEvent);
  });

  it("should map incoming token transfers to operations", async () => {
    const result = await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: `${mockAccountId}0xtx789IN`,
      hash: "0xtx789",
      type: "IN",
      value: new BigNumber("1000000000000000000"),
      fee: new BigNumber("37000000000000000"),
      senders: ["0x5034aa590125b64023a0262112b98d72e3c8e40e"],
      recipients: ["0x742d35cc6634c0532925a3b8d0b251d8c1743ec4"],
      blockHeight: 12347,
      blockHash: "0xblock789",
      accountId: mockAccountId,
      date: new Date(1640995320 * 1000),
      extra: {},
    });
  });

  it("should map outgoing token transfers to operations", async () => {
    const outgoingEvent = {
      eventName: "Transfer" as const,
      args: {
        from: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
        to: "0x456789012345678901234567890123456789abcd",
        value: BigInt("2000000000000000000"),
      },
    };
    mockedABIEvent.parseLog.mockReturnValue(outgoingEvent);

    const result = await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(result[0].type).toBe("OUT");
    expect(result[0].value).toEqual(new BigNumber("2000000000000000000"));
  });

  it("should decode event logs correctly", async () => {
    await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(mockedHex.of).toHaveBeenCalledWith(mockEventLogs[0].data);
    expect(mockedHex.of).toHaveBeenCalledWith(mockEventLogs[0].topics[0]);
    expect(mockedHex.of).toHaveBeenCalledWith(mockEventLogs[0].topics[1]);
    expect(mockedHex.of).toHaveBeenCalledWith(mockEventLogs[0].topics[2]);

    expect(mockedABIEvent.parseLog).toHaveBeenCalledWith(
      VIP180_ABI,
      expect.objectContaining({
        data: expect.anything(),
        topics: expect.any(Array),
      }),
    );
  });

  it("should handle bigint values correctly", async () => {
    const largeValueEvent = {
      eventName: "Transfer" as const,
      args: {
        from: "0x5034aa590125b64023a0262112b98d72e3c8e40e",
        to: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
        value: BigInt("123456789012345678901234567890"),
      },
    };
    mockedABIEvent.parseLog.mockReturnValue(largeValueEvent);

    const result = await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(result[0].value).toEqual(new BigNumber("123456789012345678901234567890"));
  });

  it("should call getFees for each event", async () => {
    await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(mockedGetFees).toHaveBeenCalledTimes(1);
    expect(mockedGetFees).toHaveBeenCalledWith("0xtx789");
  });

  it("should handle multiple events", async () => {
    const multipleEvents = [
      mockEventLogs[0],
      {
        ...mockEventLogs[0],
        meta: { ...mockEventLogs[0].meta, txID: "0xtx790" },
      },
    ];

    await mapTokenTransfersToOperations(multipleEvents, mockAccountId, mockAddr);

    expect(mockedGetFees).toHaveBeenCalledTimes(2);
    expect(mockedABIEvent.parseLog).toHaveBeenCalledTimes(2);
  });

  it("should handle case-insensitive address comparison for tokens", async () => {
    const upperCaseEvent = {
      eventName: "Transfer" as const,
      args: {
        from: "0x5034aa590125b64023a0262112b98d72e3c8e40e",
        to: mockAddr.toUpperCase(),
        value: BigInt("1000000000000000000"),
      },
    };
    mockedABIEvent.parseLog.mockReturnValue(upperCaseEvent);

    const result = await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(result[0].type).toBe("IN");
  });

  it("should convert token addresses to lowercase", async () => {
    const mixedCaseEvent = {
      eventName: "Transfer" as const,
      args: {
        from: "0x5034AA590125B64023A0262112B98D72E3C8E40E",
        to: "0x742D35CC6634C0532925A3B8D0B251D8C1743EC4",
        value: BigInt("1000000000000000000"),
      },
    };
    mockedABIEvent.parseLog.mockReturnValue(mixedCaseEvent);

    const result = await mapTokenTransfersToOperations(mockEventLogs, mockAccountId, mockAddr);

    expect(result[0].senders[0]).toBe("0x5034aa590125b64023a0262112b98d72e3c8e40e");
    expect(result[0].recipients[0]).toBe("0x742d35cc6634c0532925a3b8d0b251d8c1743ec4");
  });
});
