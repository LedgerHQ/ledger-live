import { getMockedConfig } from "../test/fixtures/config.fixture";
import { apiClient } from "../network/api";
import { getAccountInfo } from "./getAccountInfo";

jest.mock("../network/api");

describe("getAccountInfo", () => {
  const address = "0.0.12345";
  const mockConfig = getMockedConfig();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps the mirror account onto the generic AccountInfo contract", async () => {
    (apiClient.getAccount as jest.Mock).mockResolvedValue({
      max_automatic_token_associations: -1,
      staked_node_id: 3,
      pending_reward: 42,
      balance: { balance: 1000000000 },
    });

    const result = await getAccountInfo(mockConfig, address);

    expect(apiClient.getAccount).toHaveBeenCalledWith({ configOrCurrencyId: mockConfig, address });
    expect(result).toEqual({
      type: "hedera",
      maxAutomaticTokenAssociations: -1,
      stakedNodeId: 3,
      balance: 1000000000,
      pendingReward: 42,
    });
  });

  it("carries a null staked node id through unchanged for a non-staking account", async () => {
    (apiClient.getAccount as jest.Mock).mockResolvedValue({
      max_automatic_token_associations: 0,
      staked_node_id: null,
      pending_reward: 0,
      balance: { balance: 500 },
    });

    const result = await getAccountInfo(mockConfig, address);

    expect(result.stakedNodeId).toBeNull();
  });
});
