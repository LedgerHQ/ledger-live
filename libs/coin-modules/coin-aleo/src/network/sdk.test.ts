import { sdkClient } from "./sdk";

jest.mock("./sdk");

const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);

describe("sdkClient", () => {
  describe("decryptRecord", () => {
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

      const result = await sdkClient.decryptRecord(mockCiphertext, mockViewKey);

      expect(mockDecryptRecord).toHaveBeenCalledWith(mockCiphertext, mockViewKey);
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDecryptedData);
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network error");
      mockDecryptRecord.mockRejectedValue(mockError);

      await expect(sdkClient.decryptRecord(mockCiphertext, mockViewKey)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("decryptCiphertext", () => {
    // TODO:
  });
});
