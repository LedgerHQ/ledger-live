import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { sdkClient } from "./sdk";

jest.mock("./sdk");

const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);

describe("sdkClient", () => {
  describe("decryptRecord", () => {
    const mockCurrency = getMockedCurrency();
    const mockCiphertext = "record1mock_ciphertext_data";
    const mockViewKey = "AViewKey1mock_view_key_data";
    const mockDecryptedData = {
      amount: "1000",
      owner: "aleo1...",
      data: { microcredits: "1000" },
      nonce: "",
      version: 1,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully decrypt a record", async () => {
      mockDecryptRecord.mockResolvedValue(mockDecryptedData);

      const result = await sdkClient.decryptRecord({
        currency: mockCurrency,
        ciphertext: mockCiphertext,
        viewKey: mockViewKey,
      });

      expect(mockDecryptRecord).toHaveBeenCalledWith({
        currency: mockCurrency,
        ciphertext: mockCiphertext,
        viewKey: mockViewKey,
      });
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDecryptedData);
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network error");
      mockDecryptRecord.mockRejectedValue(mockError);

      await expect(
        sdkClient.decryptRecord({
          currency: mockCurrency,
          ciphertext: mockCiphertext,
          viewKey: mockViewKey,
        }),
      ).rejects.toThrow("Network error");
    });
  });

  describe("decryptCiphertext", () => {
    // TODO:
  });
});
