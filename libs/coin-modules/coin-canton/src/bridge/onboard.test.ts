import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { isCantonCoinPreapproved } from "./onboard";
import * as gateway from "../network/gateway";

jest.mock("../network/gateway");
const mockedGateway = gateway as jest.Mocked<typeof gateway>;

describe("onboard", () => {
  const mockPartyId = "test-party-id";
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

  describe("isCantonCoinPreapproved", () => {
    it("should return true when contract exists and is not expired", async () => {
      // GIVEN
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      mockedGateway.getTransferPreApproval.mockResolvedValue({
        contract_id: "test-contract-id",
        receiver: mockPartyId,
        provider: "test-provider",
        valid_from: "2024-01-01T00:00:00Z",
        last_renewed_at: "2024-01-01T00:00:00Z",
        expires_at: futureDate.toISOString(),
      });

      // WHEN
      const result = await isCantonCoinPreapproved(mockCurrency, mockPartyId);

      // THEN
      expect(result).toBe(true);
      expect(mockedGateway.getTransferPreApproval).toHaveBeenCalledWith(mockCurrency, mockPartyId);
    });

    it("should return false when contract exists but is expired", async () => {
      // GIVEN
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      mockedGateway.getTransferPreApproval.mockResolvedValue({
        contract_id: "test-contract-id",
        receiver: mockPartyId,
        provider: "test-provider",
        valid_from: "2024-01-01T00:00:00Z",
        last_renewed_at: "2024-01-01T00:00:00Z",
        expires_at: pastDate.toISOString(),
      });

      // WHEN
      const result = await isCantonCoinPreapproved(mockCurrency, mockPartyId);

      // THEN
      expect(result).toBe(false);
      expect(mockedGateway.getTransferPreApproval).toHaveBeenCalledWith(mockCurrency, mockPartyId);
    });
  });
});
