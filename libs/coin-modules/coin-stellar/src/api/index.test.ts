import { createApi } from "./index";

const mockGetOperations = jest.fn();

jest.mock("../logic/listOperations", () => ({
  listOperations: () => mockGetOperations(),
}));

const api = createApi({
  explorer: {
    url: "explorer.com",
    fetchLimit: 200,
  },
  useStaticFees: true,
  enableNetworkLogs: false,
});

describe("operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 0 operations for a valid account", async () => {
    mockGetOperations.mockResolvedValue([[], 0]);

    // When
    const operations = await api.listOperations("addr", { limit: 100 });

    // Then
    expect(operations).toEqual([[], 0]);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 1 operation for a valid account", async () => {
    const mockOperation = {
      hash: "e035a56c32003e3b0e4c9c5499b0750d71d98233ae6ae94323ff0a458b05a30b",
      address: "addr",
      type: "Operation",
      value: 200,
      fee: 0.0291,
      block: {
        hash: "hash",
        time: new Date("2024-03-20T10:00:00Z"),
        height: 10,
      },
      senders: ["addr"],
      recipients: ["recipient"],
      date: new Date("2024-03-20T10:00:00Z"),
      transactionSequenceNumber: 2,
    };
    mockGetOperations.mockResolvedValue([[mockOperation], 0]);

    // When
    const operations = await api.listOperations("addr", { limit: 100, start: 9 });

    // Then
    expect(operations).toEqual([[mockOperation], 0]);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 0 operations if start is greater than the last operation", async () => {
    const mockOperation = {
      hash: "e035a56c32003e3b0e4c9c5499b0750d71d98233ae6ae94323ff0a458b05a30b",
      address: "addr",
      type: "Operation",
      value: 200,
      fee: 0.0291,
      block: {
        hash: "hash",
        time: new Date("2024-03-20T10:00:00Z"),
        height: 10,
      },
      senders: ["addr"],
      recipients: ["recipient"],
      date: new Date("2024-03-20T10:00:00Z"),
      transactionSequenceNumber: 2,
    };
    mockGetOperations.mockResolvedValue([[mockOperation], 0]);

    // When
    const operations = await api.listOperations("addr", { start: 100, limit: 100 });

    // Then
    expect(operations).toEqual([[], 0]);
  });

  it("should call multiple times listOperations", async () => {
    const mockOperation = {
      hash: "e035a56c32003e3b0e4c9c5499b0750d71d98233ae6ae94323ff0a458b05a30b",
      address: "addr",
      type: "Operation",
      value: 200,
      fee: 0.0291,
      block: {
        hash: "hash",
        time: new Date("2024-03-20T10:00:00Z"),
        height: 10,
      },
      senders: ["addr"],
      recipients: ["recipient"],
      date: new Date("2024-03-20T10:00:00Z"),
      transactionSequenceNumber: 2,
    };

    mockGetOperations
      .mockResolvedValueOnce([[mockOperation], 10])
      .mockResolvedValueOnce([[mockOperation], 0]);

    // When
    const operations = await api.listOperations("addr", { start: 9, limit: 100 });

    // Then
    expect(operations).toEqual([[mockOperation, mockOperation], 0]);
    expect(mockGetOperations).toHaveBeenCalledTimes(2);
  });
});
