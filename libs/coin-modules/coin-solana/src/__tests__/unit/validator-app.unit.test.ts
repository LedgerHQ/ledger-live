jest.mock("@ledgerhq/live-network", () => jest.fn());
jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn((key: string) => {
    const urls: Record<string, string> = {
      SOLANA_VALIDATORS_APP_BASE_URL: "https://validators.app/api",
      SOLANA_TESTNET_VALIDATORS_APP_BASE_URL: "https://validators.testnet.app/api",
      SOLANA_VALIDATORS_SUMMARY_BASE_URL:
        "https://earn-dashboard.aws.stg.ldg-tech.com/figment/solana/validators_summary",
      LEDGER_CLIENT_VERSION: "test-version",
    };
    return urls[key] || "";
  }),
  changes: { subscribe: jest.fn() },
}));

import { getValidators } from "../../network/validator-app";
import network from "@ledgerhq/live-network";

const mockNetwork = network as jest.MockedFunction<typeof network>;

const mockValidator = (overrides = {}) => ({
  active_stake: 1000000,
  commission: 5,
  total_score: 8,
  vote_account: "test-validator",
  name: "Test Validator",
  delinquent: false,
  ...overrides,
});

const mockApyData = (overrides = {}) => ({
  address: "test-validator",
  delegator_apy: 0.075,
  name: "Test Validator",
  ...overrides,
});

describe("validator-app", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("APY integration", () => {
    it("should work for testnet without APY", async () => {
      mockNetwork.mockResolvedValueOnce({ status: 200, data: [] });

      const result = await getValidators("testnet");

      expect(mockNetwork).toHaveBeenCalledTimes(1);
      expect(mockNetwork).toHaveBeenCalledWith({
        method: "GET",
        url: "https://validators.testnet.app/api/testnet.json?order=score&limit=1000",
      });
      expect(result).toEqual([]);
    });

    it("should fetch and integrate APY for mainnet", async () => {
      const validator = mockValidator();
      const apyData = mockApyData();

      mockNetwork
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockResolvedValueOnce({ status: 200, data: [apyData] });

      const result = await getValidators("mainnet-beta");

      expect(mockNetwork).toHaveBeenCalledTimes(2);
      expect(result[0]).toMatchObject({
        activeStake: 1000000,
        voteAccount: "test-validator",
        apy: 0.075,
      });
    });

    it("should handle APY fetch errors gracefully", async () => {
      const validator = mockValidator();
      mockNetwork
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await getValidators("mainnet-beta");

      expect(result[0].apy).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch Figment APY", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should handle invalid APY data", async () => {
      const validator = mockValidator();
      mockNetwork
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockResolvedValueOnce({ status: 200, data: "invalid" });

      const result = await getValidators("mainnet-beta");
      expect(result[0].apy).toBeUndefined();
    });

    it("should filter invalid APY entries", async () => {
      const validator = mockValidator({ vote_account: "valid-validator" });
      const apyData = [
        mockApyData({ address: "valid-validator", delegator_apy: 0.075 }),
        mockApyData({ address: null, delegator_apy: 0.08 }),
        mockApyData({ address: "other", delegator_apy: "invalid" }),
      ];

      mockNetwork
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockResolvedValueOnce({ status: 200, data: apyData });

      const result = await getValidators("mainnet-beta");
      expect(result[0].apy).toBe(0.075);
    });
  });

  describe("validator filtering", () => {
    it("should filter delinquent and incomplete validators", async () => {
      const validators = [
        mockValidator({ vote_account: "good", delinquent: false }),
        mockValidator({ vote_account: "bad", delinquent: true }),
        mockValidator({ vote_account: "incomplete", active_stake: null }),
      ];

      mockNetwork
        .mockResolvedValueOnce({ status: 200, data: validators })
        .mockResolvedValueOnce({ status: 200, data: [] });

      const result = await getValidators("mainnet-beta");

      expect(result).toHaveLength(1);
      expect(result[0].voteAccount).toBe("good");
    });

    it("should handle failed API calls", async () => {
      mockNetwork
        .mockResolvedValueOnce({ status: 500, data: null })
        .mockResolvedValueOnce({ status: 200, data: [] });

      const result = await getValidators("mainnet-beta");
      expect(result).toHaveLength(0);
    });
  });
});
