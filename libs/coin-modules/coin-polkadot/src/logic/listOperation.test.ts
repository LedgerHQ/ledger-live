import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js"; // Assuming BigNumber is used for value and fee
import { PolkadotOperation, PolkadotOperationExtra } from "../types";
import { listOperations } from "./listOperations";

const mockGetOperations = jest.fn();
jest.mock("../network", () => {
  return {
    getOperations: (
      accountId: string,
      addr: string,
      currency?: CryptoCurrency,
      startAt = 0,
      limit = 200,
    ) => mockGetOperations(accountId, addr, currency, startAt, limit),
  };
});

describe("listOperations", () => {
  const fakeAddress = "iamamockaddressanddontmatteratall";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return operations", async () => {
    const limit = 5;
    const startAt = 0;

    const mockOperations: PolkadotOperation[] = [
      {
        id: "1",
        hash: "hash1",
        type: "OUT",
        value: new BigNumber(100),
        fee: new BigNumber(1),
        senders: ["sender1"],
        recipients: ["recipient1"],
        blockHeight: 10,
        blockHash: "blockHash1",
        date: new Date("2025-03-13T00:00:00Z"),
        accountId: "accountId1",
        extra: { index: 1 } as PolkadotOperationExtra,
      },
      {
        id: "2",
        hash: "hash2",
        type: "IN",
        value: new BigNumber(50),
        fee: new BigNumber(5),
        senders: ["sender2"],
        recipients: ["recipient2"],
        blockHeight: 11,
        blockHash: "blockHash2",
        date: new Date("2025-03-13T01:00:00Z"),
        accountId: "accountId2",
        extra: { index: 1 } as PolkadotOperationExtra,
      },
    ];

    mockGetOperations.mockResolvedValue(mockOperations);

    const result = await listOperations(fakeAddress, { limit, startAt });

    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(undefined);

    expect(result).toEqual([
      [
        {
          id: "10-1",
          asset: { type: "native" },
          tx: {
            hash: "hash1",
            fees: BigInt(1),
            block: {
              height: 10,
              hash: "blockHash1",
              time: new Date("2025-03-13T00:00:00Z"),
            },
            date: new Date("2025-03-13T00:00:00Z"),
            failed: false,
          },
          type: "OUT",
          value: BigInt(100),
          senders: ["sender1"],
          recipients: ["recipient1"],
        },
        {
          id: "11-1",
          asset: { type: "native" },
          tx: {
            hash: "hash2",
            fees: BigInt(5),
            block: {
              height: 11,
              hash: "blockHash2",
              time: new Date("2025-03-13T01:00:00Z"),
            },
            date: new Date("2025-03-13T01:00:00Z"),
            failed: false,
          },
          type: "IN",
          value: BigInt(50),
          senders: ["sender2"],
          recipients: ["recipient2"],
        },
      ],
      11, // The last blockHeight in the list
    ]);
  });

  it("should handle empty operations array", async () => {
    const limit = 5;
    const startAt = 0;

    mockGetOperations.mockResolvedValue([]);

    const result = await listOperations(fakeAddress, { limit, startAt });

    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(undefined);
    expect(result).toEqual([[], 0]);
  });

  it("should handle operations with missing blockHeight", async () => {
    const limit = 5;
    const startAt = 0;

    const mockOperations: PolkadotOperation[] = [
      {
        id: "1",
        hash: "hash1",
        type: "OUT",
        value: new BigNumber(100),
        fee: new BigNumber(1),
        senders: ["sender1"],
        recipients: ["recipient1"],
        blockHeight: undefined, // Missing blockHeight
        blockHash: "blockHash1",
        date: new Date("2025-03-13T00:00:00Z"),
        accountId: "accountId1",
        extra: { index: 1 } as PolkadotOperationExtra,
      },
    ];

    mockGetOperations.mockResolvedValue(mockOperations);

    const result = await listOperations(fakeAddress, { limit, startAt });

    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(undefined);

    expect(result).toEqual([
      [
        {
          id: "0-1",
          asset: { type: "native" },
          tx: {
            hash: "hash1",
            fees: BigInt(1),
            block: {
              height: 0,
              hash: "blockHash1",
              time: new Date("2025-03-13T00:00:00Z"),
            },
            date: new Date("2025-03-13T00:00:00Z"),
            failed: false,
          },
          type: "OUT",
          value: BigInt(100),
          senders: ["sender1"],
          recipients: ["recipient1"],
        },
      ],
      0,
    ]);
  });

  it("should handle a case with no startAt value", async () => {
    const limit = 5;

    const mockOperations: PolkadotOperation[] = [
      {
        id: "1",
        hash: "hash1",
        type: "OUT",
        value: new BigNumber(100),
        fee: new BigNumber(1),
        senders: ["sender1"],
        recipients: ["recipient1"],
        blockHeight: 10,
        blockHash: "blockHash1",
        date: new Date("2025-03-13T00:00:00Z"),
        accountId: "accountId1",
        extra: { index: 1 } as PolkadotOperationExtra,
      },
    ];

    mockGetOperations.mockResolvedValue(mockOperations);

    const result = await listOperations(fakeAddress, { limit });

    expect(mockGetOperations).toHaveBeenCalledTimes(1);
    expect(mockGetOperations.mock.lastCall[2]).toEqual(undefined);

    expect(result).toEqual([
      [
        {
          id: "10-1",
          asset: { type: "native" },
          tx: {
            hash: "hash1",
            fees: BigInt(1),
            block: {
              height: 10,
              hash: "blockHash1",
              time: new Date("2025-03-13T00:00:00Z"),
            },
            date: new Date("2025-03-13T00:00:00Z"),
            failed: false,
          },
          type: "OUT",
          value: BigInt(100),
          senders: ["sender1"],
          recipients: ["recipient1"],
        },
      ],
      10,
    ]);
  });
});
