import network from "../network";
import { PolkadotOperation, PolkadotOperationExtra } from "../types";
import { BigNumber } from "bignumber.js"; // Assuming BigNumber is used for value and fee
import { listOperations } from "./listOperations";

jest.mock("../network");
const mockGetOperations = network.getOperations as jest.Mock;

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
        extra: {} as PolkadotOperationExtra,
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
        extra: {} as PolkadotOperationExtra,
      },
    ];

    mockGetOperations.mockResolvedValue(mockOperations);

    const result = await listOperations(fakeAddress, { limit, startAt });

    expect(result).toEqual([
      [
        {
          operationIndex: 0,
          tx: {
            hash: "hash1",
            fees: BigInt(1),
            block: {
              height: 10,
              time: new Date("2025-03-13T00:00:00Z"),
            },
            date: new Date("2025-03-13T00:00:00Z"),
          },
          type: "OUT",
          value: BigInt(100),
          senders: ["sender1"],
          recipients: ["recipient1"],
        },
        {
          operationIndex: 0,
          tx: {
            hash: "hash2",
            fees: BigInt(5),
            block: {
              height: 11,
              time: new Date("2025-03-13T01:00:00Z"),
            },
            date: new Date("2025-03-13T01:00:00Z"),
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
        extra: {} as PolkadotOperationExtra,
      },
    ];

    mockGetOperations.mockResolvedValue(mockOperations);

    const result = await listOperations(fakeAddress, { limit, startAt });

    expect(result).toEqual([
      [
        {
          operationIndex: 0,
          tx: {
            hash: "hash1",
            fees: BigInt(1),
            block: {
              height: 0,
              time: new Date("2025-03-13T00:00:00Z"),
            },
            date: new Date("2025-03-13T00:00:00Z"),
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
        extra: {} as PolkadotOperationExtra,
      },
    ];

    mockGetOperations.mockResolvedValue(mockOperations);

    const result = await listOperations(fakeAddress, { limit });

    expect(result).toEqual([
      [
        {
          operationIndex: 0,
          tx: {
            hash: "hash1",
            fees: BigInt(1),
            block: {
              height: 10,
              time: new Date("2025-03-13T00:00:00Z"),
            },
            date: new Date("2025-03-13T00:00:00Z"),
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
