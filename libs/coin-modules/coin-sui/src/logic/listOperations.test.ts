import { type Operation as Op, type Page, Pagination } from "@ledgerhq/coin-framework/api/types";
import { getListOperations, withApi } from "../network/sdk";
import { listOperations } from "./listOperations";

jest.mock("../network/sdk");

const mockOperations: Page<Op> = {
  items: [
    {
      tx: {
        date: new Date("2024-03-20T10:00:00.000Z"),
        hash: "0x1234567890abcdef",
        fees: BigInt("1000000"),
        failed: false,
        block: {
          height: 5,
        },
      },
      id: "1",
      recipients: ["0xrecipient1"],
      senders: ["0xsender1"],
      type: "OUT",
      value: BigInt("1000000000"),
      asset: {
        type: "native",
      },
    },
    {
      tx: {
        date: new Date("2024-03-20T11:00:00.000Z"),
        hash: "0xabcdef1234567890",
        fees: BigInt("2000000"),
        failed: false,
        block: {
          height: 5,
        },
      },
      id: "2",
      recipients: ["0xrecipient2"],
      senders: ["0xsender2"],
      type: "IN",
      value: BigInt("2000000000"),
      asset: {
        type: "native",
      },
    },
  ],
  next: "0x1234567890abcdef",
};

const mockGetListOperations = jest.mocked(getListOperations);
mockGetListOperations.mockResolvedValue(mockOperations);

describe("List Operations", () => {
  const mockAddress = "0x1234567890abcdef";
  const mockPagination: Pagination = {
    minHeight: 0,
    order: "asc",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return operations and last hash", async () => {
    const [operations, lastHash] = await listOperations(mockAddress, mockPagination);

    expect(operations).toEqual(mockOperations.items);
    expect(lastHash).toBe(mockOperations.items[0].tx.hash);
    expect(mockGetListOperations).toHaveBeenCalledWith(mockAddress, "asc", withApi, undefined);
  });

  it("should return empty array and empty string when no operations", async () => {
    mockGetListOperations.mockResolvedValueOnce({ items: [], next: "" });

    const [operations, lastHash] = await listOperations(mockAddress, mockPagination);

    expect(operations).toEqual([]);
    expect(lastHash).toBe("");
  });

  it("should handle pagination parameters", async () => {
    const [operations] = await listOperations(mockAddress, mockPagination);

    expect(operations).toEqual(mockOperations.items);
  });

  it("should return operations sorted by date in ascending order", async () => {
    const [operations] = await listOperations(mockAddress, mockPagination);

    expect(operations[1].tx.date.getTime()).toBeGreaterThan(operations[0].tx.date.getTime());
  });
});
