import { type Operation as Op, type Page } from "@ledgerhq/coin-framework/api/types";
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
  const mockOrder = "asc" as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return operations and next cursor", async () => {
    const { items: operations, next } = await listOperations(mockAddress, { order: mockOrder });

    expect(operations).toEqual(mockOperations.items);
    expect(next).toBe(mockOperations.next);
    expect(mockGetListOperations).toHaveBeenCalledWith(mockAddress, "asc", withApi, undefined);
  });

  it("should return empty array and undefined when no operations", async () => {
    mockGetListOperations.mockResolvedValueOnce({ items: [], next: "" });

    const { items: operations, next } = await listOperations(mockAddress, { order: mockOrder });

    expect(operations).toEqual([]);
    expect(next).toBeUndefined();
  });

  it("should handle pagination parameters", async () => {
    const mockCursor = "cursor123";
    const { items: operations } = await listOperations(mockAddress, {
      order: mockOrder,
      cursor: mockCursor,
    });

    expect(operations).toEqual(mockOperations.items);
    expect(mockGetListOperations).toHaveBeenCalledWith(mockAddress, "asc", withApi, mockCursor);
  });

  it("should return operations sorted by date in ascending order", async () => {
    const { items: operations } = await listOperations(mockAddress, { order: mockOrder });

    expect(operations[1].tx.date.getTime()).toBeGreaterThan(operations[0].tx.date.getTime());
  });
});
