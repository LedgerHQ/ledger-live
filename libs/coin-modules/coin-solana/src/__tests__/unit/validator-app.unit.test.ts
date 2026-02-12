import { getEnv } from "@ledgerhq/live-env";
import * as network from "@ledgerhq/live-network";
import { getValidators } from "../../network/validator-app";

jest.spyOn({ getEnv }, "getEnv").mockImplementation((key: string) => {
  const testUrls: Record<string, string> = {
    SOLANA_VALIDATORS_APP_BASE_URL: "https://validators-solana.coin.ledger.com/api/v1/validators",
    SOLANA_TESTNET_VALIDATORS_APP_BASE_URL:
      "https://validators-solana.coin.ledger.com/api/v1/validators",
    SOLANA_VALIDATORS_SUMMARY_BASE_URL:
      "https://earn-dashboard.aws.stg.ldg-tech.com/figment/solana/validators_summary",
  };
  return testUrls[key] || "";
});

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
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.warn for cleaner test output
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("APY integration", () => {
    it("should work for testnet without APY", async () => {
      jest.spyOn(network, "default").mockResolvedValue({ status: 200, data: [] });

      const result = await getValidators("testnet");

      expect(network.default).toHaveBeenCalledTimes(1);
      expect(network.default).toHaveBeenCalledWith({
        method: "GET",
        url: "https://validators-solana.coin.ledger.com/api/v1/validators/testnet.json?order=score&limit=1000",
      });
      expect(result).toEqual([]);
    });

    it("should fetch and integrate APY for mainnet", async () => {
      const validator = mockValidator();
      const apyData = mockApyData();

      jest
        .spyOn(network, "default")
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockResolvedValueOnce({ status: 200, data: [apyData] });

      const result = await getValidators("mainnet-beta");

      expect(network.default).toHaveBeenCalledTimes(2);
      expect(result[0]).toMatchObject({
        activeStake: 1000000,
        voteAccount: "test-validator",
        apy: 0.075,
      });
    });

    it("should handle APY fetch errors gracefully", async () => {
      const validator = mockValidator();
      jest
        .spyOn(network, "default")
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockRejectedValueOnce(new Error("Network error"));

      const result = await getValidators("mainnet-beta");

      expect(result[0]).toMatchObject({
        name: "Test Validator",
        apy: undefined,
      });
    });

    it("should handle invalid APY data", async () => {
      const validator = mockValidator();
      jest
        .spyOn(network, "default")
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockResolvedValueOnce({ status: 200, data: "invalid" });

      const result = await getValidators("mainnet-beta");
      expect(result[0]).toMatchObject({
        name: "Test Validator",
        apy: undefined,
      });
    });

    it("should filter invalid APY entries", async () => {
      const validator = mockValidator({ vote_account: "valid-validator" });
      const apyData = [
        mockApyData({ address: "valid-validator", delegator_apy: 0.075 }),
        mockApyData({ address: null, delegator_apy: 0.08 }),
        mockApyData({ address: "other", delegator_apy: "invalid" }),
      ];

      jest
        .spyOn(network, "default")
        .mockResolvedValueOnce({ status: 200, data: [validator] })
        .mockResolvedValueOnce({ status: 200, data: apyData });

      const result = await getValidators("mainnet-beta");
      expect(result).toEqual([
        {
          activeStake: 1000000,
          voteAccount: "valid-validator",
          apy: 0.075,
          name: "Test Validator",
          avatarUrl: undefined,
          wwwUrl: undefined,
          totalScore: 8,
          commission: 5,
        },
      ]);
    });
  });

  describe("validator filtering", () => {
    it("should filter delinquent and incomplete validators", async () => {
      const validators = [
        mockValidator({ vote_account: "good", delinquent: false }),
        mockValidator({ vote_account: "bad", delinquent: true }),
        mockValidator({ vote_account: "incomplete", active_stake: null }),
      ];

      jest
        .spyOn(network, "default")
        .mockResolvedValueOnce({ status: 200, data: validators })
        .mockResolvedValueOnce({ status: 200, data: [] });

      const result = await getValidators("mainnet-beta");

      expect(result).toEqual([
        {
          activeStake: 1000000,
          commission: 5,
          totalScore: 8,
          voteAccount: "good",
          name: "Test Validator",
          avatarUrl: undefined,
          wwwUrl: undefined,
          apy: undefined,
        },
      ]);
    });

    it("should handle failed API calls", async () => {
      jest
        .spyOn(network, "default")
        .mockResolvedValueOnce({ status: 500, data: null })
        .mockResolvedValueOnce({ status: 200, data: [] });

      const result = await getValidators("mainnet-beta");
      expect(result).toHaveLength(0);
    });
  });
});
