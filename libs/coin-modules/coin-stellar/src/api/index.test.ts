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

const fromGenesis = { minHeight: 0 };

describe("operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("should return 0 operations for a valid account", async () => {
    mockGetOperations.mockResolvedValue([[], ""]);

    // When
    const operations = await api.listOperations("addr", fromGenesis);

    // Then
    expect(operations).toEqual([[], ""]);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 1 operation for a valid account", async () => {
    mockGetOperations.mockResolvedValue([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", fromGenesis);

    // Then
    expect(operations).toEqual([[mockOperation], ""]);
    expect(mockGetOperations).toHaveBeenCalledTimes(1);
  });

  it("should return 0 operations if start is greater than the last operation", async () => {
    mockGetOperations.mockResolvedValue([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", { minHeight: 100 });

    // Then
    expect(operations).toEqual([[], ""]);
  });

  it("should call multiple times listOperations", async () => {
    mockGetOperations
      .mockResolvedValueOnce([[mockOperation], "10"])
      .mockResolvedValueOnce([[mockOperation], ""]);

    // When
    const operations = await api.listOperations("addr", fromGenesis);

    // Then
    expect(operations).toEqual([[mockOperation, mockOperation], ""]);
    expect(mockGetOperations).toHaveBeenCalledTimes(2);
  });
});
