jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn(),
}));

jest.mock("./apiCalls", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../logic/getSequence", () => ({
  getSequence: jest.fn(),
}));

import { getEnv } from "@ledgerhq/live-env";

import MultiversXApi from "./apiCalls";
import { createApi } from "./index";
import type { MultiversXApiConfig } from "./types";
import { getSequence as mockGetSequence } from "../logic/getSequence";

describe("MultiversX API", () => {
  describe("createApi", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns an object with all required API methods", () => {
      (getEnv as jest.Mock).mockImplementation((key: string) => {
        if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
        if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
        throw new Error(`Unexpected env key: ${key}`);
      });

      const api = createApi();

      // All 14 required methods should be defined
      expect(api.getBalance).toBeDefined();
      expect(api.getSequence).toBeDefined();
      expect(api.lastBlock).toBeDefined();
      expect(api.listOperations).toBeDefined();
      expect(api.getStakes).toBeDefined();
      expect(api.getValidators).toBeDefined();
      expect(api.craftTransaction).toBeDefined();
      expect(api.estimateFees).toBeDefined();
      expect(api.combine).toBeDefined();
      expect(api.broadcast).toBeDefined();
      expect(api.validateIntent).toBeDefined();
      expect(api.getRewards).toBeDefined();
      expect(api.getBlock).toBeDefined();
      expect(api.getBlockInfo).toBeDefined();
      expect(api.craftRawTransaction).toBeDefined();
    });

    it("works with no config (uses defaults)", () => {
      (getEnv as jest.Mock).mockImplementation((key: string) => {
        if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
        if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
        throw new Error(`Unexpected env key: ${key}`);
      });

      const api = createApi();

      expect(api).toBeDefined();
      expect(typeof api.getBalance).toBe("function");
      expect(MultiversXApi).toHaveBeenCalledWith("https://env.api", "https://env.delegation");
    });

    it("accepts custom configuration", () => {
      (getEnv as jest.Mock).mockImplementation((key: string) => {
        if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
        if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
        throw new Error(`Unexpected env key: ${key}`);
      });

      const config: MultiversXApiConfig = {
        apiEndpoint: "https://custom.api.com",
        delegationApiEndpoint: "https://custom.delegation.com",
      };

      const api = createApi(config);

      expect(api).toBeDefined();
      expect(typeof api.getBalance).toBe("function");
      expect(MultiversXApi).toHaveBeenCalledWith(
        "https://custom.api.com",
        "https://custom.delegation.com",
      );
    });

    describe("unsupported methods", () => {
      it("throws 'getRewards is not supported' for getRewards", async () => {
        (getEnv as jest.Mock).mockImplementation((key: string) => {
          if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
          if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
          throw new Error(`Unexpected env key: ${key}`);
        });

        const api = createApi();

        await expect(
          api.getRewards("erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu"),
        ).rejects.toThrow("getRewards is not supported");
      });

      it("throws 'getBlock is not supported' for getBlock", async () => {
        (getEnv as jest.Mock).mockImplementation((key: string) => {
          if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
          if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
          throw new Error(`Unexpected env key: ${key}`);
        });

        const api = createApi();

        await expect(api.getBlock(12345)).rejects.toThrow("getBlock is not supported");
      });

      it("throws 'getBlockInfo is not supported' for getBlockInfo", async () => {
        (getEnv as jest.Mock).mockImplementation((key: string) => {
          if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
          if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
          throw new Error(`Unexpected env key: ${key}`);
        });

        const api = createApi();

        await expect(api.getBlockInfo(12345)).rejects.toThrow("getBlockInfo is not supported");
      });

      it("throws 'craftRawTransaction is not supported' for craftRawTransaction", async () => {
        (getEnv as jest.Mock).mockImplementation((key: string) => {
          if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
          if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
          throw new Error(`Unexpected env key: ${key}`);
        });

        const api = createApi();

        await expect(api.craftRawTransaction("raw", "sender", "pubkey", 1n)).rejects.toThrow(
          "craftRawTransaction is not supported",
        );
      });
    });

    describe("getSequence", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (getEnv as jest.Mock).mockImplementation((key: string) => {
          if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
          if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
          throw new Error(`Unexpected env key: ${key}`);
        });
      });

      it("returns nonce as bigint for address with transaction history", async () => {
        const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
        const expectedNonce = 42n;
        (mockGetSequence as jest.Mock).mockResolvedValue(expectedNonce);

        const api = createApi();
        const result = await api.getSequence(testAddress);

        expect(result).toBe(expectedNonce);
        expect(typeof result).toBe("bigint");
        expect(mockGetSequence).toHaveBeenCalledWith(expect.anything(), testAddress);
      });

      it("returns 0n for new address with no transactions", async () => {
        const testAddress = "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu";
        (mockGetSequence as jest.Mock).mockResolvedValue(0n);

        const api = createApi();
        const result = await api.getSequence(testAddress);

        expect(result).toBe(0n);
        expect(typeof result).toBe("bigint");
      });

      it("throws descriptive error for invalid address", async () => {
        const invalidAddress = "invalid-address";
        const errorMessage = `Invalid MultiversX address: ${invalidAddress}`;
        (mockGetSequence as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const api = createApi();

        await expect(api.getSequence(invalidAddress)).rejects.toThrow(errorMessage);
      });

      it("throws descriptive error when network fails", async () => {
        const testAddress = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";
        const networkError = `Failed to fetch account ${testAddress}: Network timeout`;
        (mockGetSequence as jest.Mock).mockRejectedValue(new Error(networkError));

        const api = createApi();

        await expect(api.getSequence(testAddress)).rejects.toThrow(networkError);
      });
    });

    describe("lastBlock", () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (getEnv as jest.Mock).mockImplementation((key: string) => {
          if (key === "MULTIVERSX_API_ENDPOINT") return "https://env.api";
          if (key === "MULTIVERSX_DELEGATION_API_ENDPOINT") return "https://env.delegation";
          throw new Error(`Unexpected env key: ${key}`);
        });
      });

      it("returns BlockInfo with current height", async () => {
        const expectedHeight = 12345678;
        const mockApiInstance = {
          getBlockchainBlockHeight: jest.fn().mockResolvedValue(expectedHeight),
        };
        (MultiversXApi as jest.Mock).mockImplementation(() => mockApiInstance);

        const api = createApi();
        const result = await api.lastBlock();

        expect(result).toEqual({ height: expectedHeight });
        expect(typeof result.height).toBe("number");
        expect(mockApiInstance.getBlockchainBlockHeight).toHaveBeenCalledTimes(1);
      });

      it("throws error when network fails", async () => {
        const networkError = new Error("Network timeout");
        const mockApiInstance = {
          getBlockchainBlockHeight: jest.fn().mockRejectedValue(networkError),
        };
        (MultiversXApi as jest.Mock).mockImplementation(() => mockApiInstance);

        const api = createApi();

        await expect(api.lastBlock()).rejects.toThrow("Network timeout");
      });
    });
  });
});
