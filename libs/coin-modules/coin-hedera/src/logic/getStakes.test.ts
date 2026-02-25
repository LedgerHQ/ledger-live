import { apiClient } from "../network/api";
import { getStakes } from "./getStakes";

describe("getStakes", () => {
  const mockAddress = "0.0.123456";
  const mockGetAccount = jest.spyOn(apiClient, "getAccount");
  const mockGetNodes = jest.spyOn(apiClient, "getNodes");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty stakes when account is not delegated to any node", async () => {
    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      balance: { balance: "1000000000" },
      pending_reward: "0",
      staked_node_id: null,
    });

    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: 1,
          node_account_id: "0.0.3",
          stake: "100000000000",
          max_stake: "500000000000",
        },
      ],
    });

    const result = await getStakes(mockAddress);

    expect(result.items).toEqual([]);
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount).toHaveBeenCalledWith(mockAddress);
    expect(mockGetNodes).toHaveBeenCalledTimes(1);
    expect(mockGetNodes).toHaveBeenCalledWith({ fetchAllPages: true });
  });

  it("should return inactive stake when delegated node is not found", async () => {
    const balance = "1000000000";
    const pendingReward = "100000000";
    const stakedNodeId = 999;

    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      balance: { balance },
      pending_reward: pendingReward,
      staked_node_id: stakedNodeId,
    });

    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: 1,
          node_account_id: "0.0.3",
          stake: "100000000000",
          max_stake: "500000000000",
        },
      ],
    });

    const result = await getStakes(mockAddress);

    expect(result.items).toEqual([
      {
        uid: mockAddress,
        address: mockAddress,
        asset: { type: "native" },
        state: "inactive",
        amount: BigInt(balance) + BigInt(pendingReward),
        amountDeposited: BigInt(balance),
        amountRewarded: BigInt(pendingReward),
        details: {
          stakedNodeId,
          overstaked: null,
        },
      },
    ]);
  });

  it("should return active stake for delegated account", async () => {
    const balance = "5000000000";
    const pendingReward = "100000000";
    const nodeId = 1;
    const nodeAccountId = "0.0.3";

    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      balance: { balance },
      pending_reward: pendingReward,
      staked_node_id: nodeId,
    });

    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: nodeId,
          node_account_id: nodeAccountId,
          stake: "100000000000",
          max_stake: "500000000000",
        },
      ],
    });

    const result = await getStakes(mockAddress);

    expect(result.items).toEqual([
      {
        uid: mockAddress,
        address: mockAddress,
        asset: { type: "native" },
        state: "active",
        amount: BigInt(balance) + BigInt(pendingReward),
        amountDeposited: BigInt(balance),
        amountRewarded: BigInt(pendingReward),
        delegate: nodeAccountId,
        details: {
          stakedNodeId: nodeId,
          overstaked: false,
        },
      },
    ]);
  });

  it("should detect overstaked validator", async () => {
    const nodeId = 1;

    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      balance: { balance: "1000000000" },
      pending_reward: "50000000",
      staked_node_id: nodeId,
    });

    mockGetNodes.mockResolvedValue({
      nodes: [
        {
          node_id: nodeId,
          node_account_id: "0.0.3",
          stake: "500000000000",
          max_stake: "500000000000",
        },
      ],
    });

    const result = await getStakes(mockAddress);

    expect(result.items[0].details?.overstaked).toBe(true);
  });
});
