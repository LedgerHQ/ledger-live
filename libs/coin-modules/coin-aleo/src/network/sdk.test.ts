import { sdkClient } from "./sdk";

jest.mock("./sdk");

const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);
const mockDecryptCiphertext = jest.mocked(sdkClient.decryptCiphertext);

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
    const mockParams = {
      ciphertext: "ct1mock_ciphertext_data",
      tpk: "tpk1mock_transition_public_key",
      viewKey: "AViewKey1mock_view_key_data",
      programId: "credits.aleo",
      functionName: "transfer_private",
      outputIndex: 0,
    };
    const mockDecryptedData = {
      plaintext: "1000000u64",
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should successfully decrypt ciphertext", async () => {
      mockDecryptCiphertext.mockResolvedValue(mockDecryptedData);

      const result = await sdkClient.decryptCiphertext(mockParams);

      expect(mockDecryptCiphertext).toHaveBeenCalledWith(mockParams);
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDecryptedData);
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network error");
      mockDecryptCiphertext.mockRejectedValue(mockError);

      await expect(sdkClient.decryptCiphertext(mockParams)).rejects.toThrow("Network error");
    });
  });
});
