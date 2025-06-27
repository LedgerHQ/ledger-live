import network from "@ledgerhq/live-network";
import { getPublicKey } from "./hedera";

jest.mock("@ledgerhq/live-network");

describe("hedera", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("getPublicKey", () => {
    it.each([
      ["prod", "https://nft.api.live.ledger.com"],
      [undefined, "https://nft.api.live.ledger.com"],
      ["test", "https://nft.api.live.ledger-test.com"],
    ])("fetch the correct %s service environment", async (env, baseUrl) => {
      // Given
      const accountId = "HEDERA_ACCOUNT_ID";
      const challenge = "WHATEVER_CHALLENGE";
      const mockResponse = {};
      (network as jest.Mock).mockResolvedValue({ data: mockResponse });

      // When
      await getPublicKey(accountId, challenge, env as "prod" | "test");

      // Then
      expect(network).toHaveBeenCalledWith({
        method: "GET",
        url: `${baseUrl}/v2/hedera/pubkey/${accountId}?challenge=${challenge}`,
      });
    });

    it("transforms data as expected", async () => {
      // Given
      const accountId = "HEDERA_ACCOUNT_ID";
      const publicKey = "HEDERA_PUBLIC_KEY";
      const challenge = "WHATEVER_CHALLENGE";
      const mockResponse = {
        descriptorType: "TrustedDomainName",
        descriptorVersion: 3,
        account: accountId,
        key: publicKey,
        signedDescriptor: "SIGNATURE",
      };
      (network as jest.Mock).mockResolvedValue({ data: mockResponse });

      // When
      const result = await getPublicKey(accountId, challenge);

      // Then
      expect(result).toEqual({
        accountId,
        publicKey,
        signedDescriptor: "SIGNATURE",
      });
    });
  });
});
