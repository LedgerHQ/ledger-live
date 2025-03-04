import { computedTokenAddress, getOwnerAddress } from "./solana";
import network from "@ledgerhq/live-network";

jest.mock("@ledgerhq/live-network");

describe("solana", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("getOwnerAddress", () => {
    it.each([
      ["prod", "https://nft.api.live.ledger.com"],
      [undefined, "https://nft.api.live.ledger.com"],
      ["test", "https://nft.api.live.ledger-test.com"],
    ])("fetch the correct %s service environement", async (env, baseUrl) => {
      // Given
      const ownerAddress = "SOL_ADDR";
      const challenge = "WHATEVER_CHALLENGE";
      const mockResponse = {};
      (network as jest.Mock).mockResolvedValue({ data: mockResponse });

      // When
      await getOwnerAddress(ownerAddress, challenge, env as "prod" | "test");

      // Then
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${baseUrl}/v2/solana/owner/${ownerAddress}?challenge=${challenge}`,
      });
    });

    it("transforms data as expected", async () => {
      // Given
      const ownerAddress = "SOL_ADDR";
      const challenge = "WHATEVER_CHALLENGE";
      const mintAddress = "MINT_ADDR";
      const tokenAddress = "TOKEN_ADDR";
      const mockResponse = {
        descriptorType: "TrustedName",
        descriptorVersion: 2,
        tokenAccount: tokenAddress,
        owner: ownerAddress,
        contract: mintAddress,
        signedDescriptor: "SIGNATURE",
      };
      (network as jest.Mock).mockResolvedValue({ data: mockResponse });

      // When
      const result = await getOwnerAddress(ownerAddress, challenge);

      // Then
      expect(result).toEqual({
        contract: mintAddress,
        owner: ownerAddress,
        tokenAccount: tokenAddress,
        signedDescriptor: "SIGNATURE",
      });
    });
  });

  describe("computedTokenAddress", () => {
    it.each([
      ["prod", "https://nft.api.live.ledger.com"],
      [undefined, "https://nft.api.live.ledger.com"],
      ["test", "https://nft.api.live.ledger-test.com"],
    ])("fetch the correct %s service environement", async (env, baseUrl) => {
      // Given
      const ownerAddress = "SOL_ADDR";
      const mintAddress = "MINT_ADDR";
      const challenge = "WHATEVER_CHALLENGE";
      const mockResponse = {};
      (network as jest.Mock).mockResolvedValue({ data: mockResponse });

      // When
      await computedTokenAddress(ownerAddress, mintAddress, challenge, env as "prod" | "test");

      // Then
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${baseUrl}/v2/solana/computed-token-account/${ownerAddress}/${mintAddress}?challenge=${challenge}`,
      });
    });

    it("transforms data as expected", async () => {
      // Given
      const ownerAddress = "SOL_ADDR";
      const challenge = "WHATEVER_CHALLENGE";
      const mintAddress = "MINT_ADDR";
      const tokenAddress = "TOKEN_ADDR";
      const mockResponse = {
        descriptorType: "TrustedName",
        descriptorVersion: 2,
        tokenAccount: tokenAddress,
        owner: ownerAddress,
        contract: mintAddress,
        signedDescriptor: "SIGNATURE",
      };
      (network as jest.Mock).mockResolvedValue({ data: mockResponse });

      // When
      const result = await computedTokenAddress(ownerAddress, mintAddress, challenge);

      // Then
      expect(result).toEqual({
        contract: mintAddress,
        owner: ownerAddress,
        tokenAccount: tokenAddress,
        signedDescriptor: "SIGNATURE",
      });
    });
  });
});
