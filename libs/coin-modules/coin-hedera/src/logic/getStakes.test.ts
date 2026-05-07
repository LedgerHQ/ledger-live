import { apiClient } from "../network/api";
import { getStakes } from "./getStakes";

describe("getStakes", () => {
  const mockAddress = "0.0.123456";
  const mockGetAccount = jest.spyOn(apiClient, "getAccount");
  const mockGetNode = jest.spyOn(apiClient, "getNode");
  const mockGetNodes = jest.spyOn(apiClient, "getNodes");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty stakes when account is not delegated to any node", async () => {
    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      max_automatic_token_associations: 0,
      evm_address: "",
      balance: { balance: 1000000000, timestamp: "0", tokens: [] },
      pending_reward: 0,
      staked_node_id: null,
    });

    const result = await getStakes(mockAddress);

    expect(result.items).toEqual([]);
    expect(mockGetAccount).toHaveBeenCalledTimes(1);
    expect(mockGetAccount).toHaveBeenCalledWith(mockAddress);
    // when there's no staked_node_id we must not hit the nodes endpoint at all
    expect(mockGetNode).not.toHaveBeenCalled();
    expect(mockGetNodes).not.toHaveBeenCalled();
  });

  it("should return inactive stake and skip node lookup when staked_node_id is -1", async () => {
    const balance = 1000000000;
    const pendingReward = 100000000;

    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      max_automatic_token_associations: 0,
      evm_address: "",
      balance: { balance, timestamp: "0", tokens: [] },
      pending_reward: pendingReward,
      staked_node_id: -1,
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
          stakedNodeId: -1,
          overstaked: null,
        },
      },
    ]);
    expect(mockGetNode).not.toHaveBeenCalled();
    expect(mockGetNodes).not.toHaveBeenCalled();
  });

  it("should return inactive stake when delegated node is not found", async () => {
    const balance = 1000000000;
    const pendingReward = 100000000;
    const stakedNodeId = 999;

    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      max_automatic_token_associations: 0,
      evm_address: "",
      balance: { balance, timestamp: "0", tokens: [] },
      pending_reward: pendingReward,
      staked_node_id: stakedNodeId,
    });

    mockGetNode.mockResolvedValue(null);

    const result = await getStakes(mockAddress);

    expect(mockGetNode).toHaveBeenCalledTimes(1);
    expect(mockGetNode).toHaveBeenCalledWith(stakedNodeId);
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
    const balance = 5000000000;
    const pendingReward = 100000000;
    const nodeId = 1;
    const nodeAccountId = "0.0.3";

    mockGetAccount.mockResolvedValue({
      account: mockAddress,
      max_automatic_token_associations: 0,
      evm_address: "",
      balance: { balance, timestamp: "0", tokens: [] },
      pending_reward: pendingReward,
      staked_node_id: nodeId,
    });

    mockGetNode.mockResolvedValue({
      node_id: nodeId,
      node_account_id: nodeAccountId,
      description: "",
      stake: 100000000000,
      max_stake: 500000000000,
      min_stake: 0,
      stake_rewarded: 0,
      reward_rate_start: 0,
    });

    const result = await getStakes(mockAddress);

    expect(mockGetNode).toHaveBeenCalledWith(nodeId);
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
      max_automatic_token_associations: 0,
      evm_address: "",
      balance: { balance: 1000000000, timestamp: "0", tokens: [] },
      pending_reward: 50000000,
      staked_node_id: nodeId,
    });

    mockGetNode.mockResolvedValue({
      node_id: nodeId,
      node_account_id: "0.0.3",
      description: "",
      stake: 500000000000,
      max_stake: 500000000000,
      min_stake: 0,
      stake_rewarded: 0,
      reward_rate_start: 0,
    });

    const result = await getStakes(mockAddress);

    expect(result.items[0].details?.overstaked).toBe(true);
  });
});
