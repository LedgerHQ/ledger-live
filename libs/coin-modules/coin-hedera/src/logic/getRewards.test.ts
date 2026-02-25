import { apiClient } from "../network/api";
import { getRewards } from "./getRewards";

describe("getRewards", () => {
  const mockAddress = "0.0.123456";
  const mockGetAccountTransactions = jest.spyOn(apiClient, "getAccountTransactions");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty rewards when account has no staking rewards", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          transaction_hash: "0xabc123",
          consensus_timestamp: "1704067210.123456789",
          staking_reward_transfers: [],
        },
      ],
      nextCursor: null,
    });

    const result = await getRewards(mockAddress);

    expect(result.items).toEqual([]);
    expect(mockGetAccountTransactions).toHaveBeenCalledTimes(1);
    expect(mockGetAccountTransactions).toHaveBeenCalledWith({
      address: mockAddress,
      fetchAllPages: false,
      pagingToken: null,
      limit: 100,
      order: "desc",
    });
  });

  it("should return rewards for account with staking rewards", async () => {
    const rewardAmount = "5000000";
    const txHash = "0xabc123";
    const consensusTimestamp = "1704067210.123456789";

    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          transaction_hash: txHash,
          consensus_timestamp: consensusTimestamp,
          staking_reward_transfers: [
            {
              account: mockAddress,
              amount: rewardAmount,
            },
          ],
        },
      ],
      nextCursor: null,
    });

    const result = await getRewards(mockAddress);

    expect(result).toEqual({
      items: [
        {
          stake: mockAddress,
          asset: { type: "native" },
          amount: BigInt(rewardAmount),
          receivedAt: new Date(Number.parseInt(consensusTimestamp.split(".")[0], 10) * 1000),
          transactionHash: txHash,
        },
      ],
      next: undefined,
    });
  });

  it("should filter rewards by account address", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          transaction_hash: "0xabc123",
          consensus_timestamp: "1704067210.123456789",
          staking_reward_transfers: [
            {
              account: mockAddress,
              amount: "5000000",
            },
            {
              account: "0.0.999999",
              amount: "3000000",
            },
          ],
        },
      ],
      nextCursor: null,
    });

    const result = await getRewards(mockAddress);

    expect(result.items).toMatchObject([
      {
        stake: mockAddress,
        amount: BigInt("5000000"),
      },
    ]);
  });

  it("should handle multiple rewards from different transactions", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          transaction_hash: "0xabc123",
          consensus_timestamp: "1714067210.123456789",
          staking_reward_transfers: [
            {
              account: mockAddress,
              amount: "5000000",
            },
          ],
        },
        {
          transaction_hash: "0xdef456",
          consensus_timestamp: "1704067210.123456789",
          staking_reward_transfers: [
            {
              account: mockAddress,
              amount: "3000000",
            },
          ],
        },
      ],
      nextCursor: null,
    });

    const result = await getRewards(mockAddress);

    expect(result.items).toMatchObject([
      { amount: BigInt("5000000") },
      { amount: BigInt("3000000") },
    ]);
  });

  it("should handle pagination with cursor", async () => {
    const cursor = "next-page-token";
    const nextCursor = "another-page-token";

    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          transaction_hash: "0xabc123",
          consensus_timestamp: "1704067210.123456789",
          staking_reward_transfers: [
            {
              account: mockAddress,
              amount: "5000000",
            },
          ],
        },
      ],
      nextCursor,
    });

    const result = await getRewards(mockAddress, cursor);

    expect(result.next).toBe(nextCursor);
    expect(mockGetAccountTransactions).toHaveBeenCalledTimes(1);
    expect(mockGetAccountTransactions).toHaveBeenCalledWith({
      address: mockAddress,
      fetchAllPages: false,
      pagingToken: cursor,
      limit: 100,
      order: "desc",
    });
  });

  it("should not return cursor when no more pages available", async () => {
    mockGetAccountTransactions.mockResolvedValue({
      transactions: [
        {
          transaction_hash: "0xabc123",
          consensus_timestamp: "1704067210.123456789",
          staking_reward_transfers: [
            {
              account: mockAddress,
              amount: "5000000",
            },
          ],
        },
      ],
      nextCursor: null,
    });

    const result = await getRewards(mockAddress);

    expect(result.next).toBeUndefined();
  });
});
