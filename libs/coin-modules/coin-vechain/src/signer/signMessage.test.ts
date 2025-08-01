import { signMessage } from "./signMessage";
import { VechainSDKTransaction, VechainSigner } from "../types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";

// Mock dependencies
jest.mock("../types", () => ({
  ...jest.requireActual("../types"),
  VechainSDKTransaction: {
    of: jest.fn(),
  },
}));

const mockedVechainSDKTransaction = jest.mocked(VechainSDKTransaction);

describe("signMessage", () => {
  const mockDeviceId = "mock-device-id";
  const mockPath = "44'/818'/0'/0/0";

  const mockSigner: VechainSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  };

  const mockSignerContext: SignerContext<VechainSigner> = jest.fn();

  const mockTransactionObject = {
    chainTag: 74,
    blockRef: "0x00000000000b2bce",
    expiration: 18,
    clauses: [
      {
        to: "0x456789012345678901234567890123456789abcd",
        value: "1000000000000000000",
        data: "0x",
      },
    ],
    maxFeePerGas: 10000000000000,
    maxPriorityFeePerGas: 1000000000000,
    gas: 21000,
    dependsOn: null,
    nonce: "0x12345678",
  };

  const mockUnsignedTransaction = {
    encoded: Buffer.from("mockencodedtransaction", "hex"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedVechainSDKTransaction.of.mockReturnValue(mockUnsignedTransaction as any);
    (mockSigner.signTransaction as jest.Mock).mockResolvedValue(Buffer.from("signature123", "hex"));
    (mockSignerContext as jest.Mock).mockImplementation((deviceId, callback) =>
      callback(mockSigner),
    );
  });

  describe("message parsing", () => {
    it("should parse valid JSON message", async () => {
      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      const result = await signMessageFn(mockDeviceId, mockPath, message, "");

      // JSON parsing is handled internally by the function
      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(mockTransactionObject);
      expect(result).toBe("");
    });

    it("should parse valid JSON rawMessage when message is empty", async () => {
      const rawMessage = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      const result = await signMessageFn(mockDeviceId, mockPath, "", rawMessage);

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(mockTransactionObject);
      expect(result).toBe("");
    });

    it("should prefer message over rawMessage when both are provided", async () => {
      const message = JSON.stringify(mockTransactionObject);
      const differentRawMessage = JSON.stringify({ different: "object" });
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, differentRawMessage);

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(mockTransactionObject);
    });

    it("should throw error for invalid JSON message", async () => {
      const invalidMessage = "invalid json {";
      const signMessageFn = signMessage(mockSignerContext);

      await expect(signMessageFn(mockDeviceId, mockPath, invalidMessage, "")).rejects.toThrow(
        "Message is not a valid JSON object",
      );
    });

    it("should throw error for invalid JSON rawMessage", async () => {
      const invalidRawMessage = "invalid json {";
      const signMessageFn = signMessage(mockSignerContext);

      await expect(signMessageFn(mockDeviceId, mockPath, "", invalidRawMessage)).rejects.toThrow(
        "Message is not a valid JSON object",
      );
    });

    it("should throw error when both message and rawMessage are empty", async () => {
      const signMessageFn = signMessage(mockSignerContext);

      await expect(signMessageFn(mockDeviceId, mockPath, "", "")).rejects.toThrow(
        "Message is not a valid JSON object",
      );
    });
  });

  describe("transaction creation", () => {
    it("should create VechainSDKTransaction from parsed object", async () => {
      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(mockTransactionObject);
    });

    it("should handle VechainSDKTransaction creation errors", async () => {
      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      mockedVechainSDKTransaction.of.mockImplementation(() => {
        throw new Error("Invalid transaction");
      });

      await expect(signMessageFn(mockDeviceId, mockPath, message, "")).rejects.toThrow(
        "Message is not a valid JSON object",
      );
    });

    it("should handle different transaction structures", async () => {
      const tokenTransaction = {
        ...mockTransactionObject,
        clauses: [
          {
            to: "0x0000000000000000000000000000456e65726779",
            value: "0",
            data: "0xa9059cbb000000000000000000000000456789012345678901234567890123456789abcd0000000000000000000000000000000000000000000000000de0b6b3a7640000",
          },
        ],
      };

      const message = JSON.stringify(tokenTransaction);
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(tokenTransaction);
    });
  });

  describe("signing process", () => {
    it("should call signer with correct parameters", async () => {
      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(mockSignerContext).toHaveBeenCalledWith(mockDeviceId, expect.any(Function));
      expect(mockSigner.signTransaction).toHaveBeenCalledWith(
        mockPath,
        mockUnsignedTransaction.encoded.toString("hex"),
      );
    });

    it("should convert encoded transaction to hex string", async () => {
      const customEncoded = Buffer.from("customtransaction", "utf8");
      const customUnsigned = { encoded: customEncoded };
      mockedVechainSDKTransaction.of.mockReturnValue(customUnsigned as any);

      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(mockSigner.signTransaction).toHaveBeenCalledWith(
        mockPath,
        customEncoded.toString("hex"),
      );
    });

    it("should return signature as hex string", async () => {
      const signatureBuffer = Buffer.from([0x12, 0x34, 0x56, 0x78]);
      (mockSigner.signTransaction as jest.Mock).mockResolvedValue(signatureBuffer);

      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      const result = await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(result).toBe("12345678");
    });

    it("should handle signer errors", async () => {
      const signerError = new Error("Hardware wallet error");
      (mockSigner.signTransaction as jest.Mock).mockRejectedValue(signerError);

      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      await expect(signMessageFn(mockDeviceId, mockPath, message, "")).rejects.toThrow(
        "Hardware wallet error",
      );
    });

    it("should handle signerContext errors", async () => {
      const contextError = new Error("Signer context failed");
      (mockSignerContext as jest.Mock).mockRejectedValue(contextError);

      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      await expect(signMessageFn(mockDeviceId, mockPath, message, "")).rejects.toThrow(
        "Signer context failed",
      );
    });
  });

  describe("different input scenarios", () => {
    it("should handle different device IDs", async () => {
      const deviceIds = ["device1", "device2", "device3"];
      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      for (const deviceId of deviceIds) {
        await signMessageFn(deviceId, mockPath, message, "");
        expect(mockSignerContext).toHaveBeenCalledWith(deviceId, expect.any(Function));
      }
    });

    it("should handle different derivation paths", async () => {
      const paths = ["44'/818'/0'/0/0", "44'/818'/1'/0/0", "44'/818'/0'/0/1"];
      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      for (const path of paths) {
        await signMessageFn(mockDeviceId, path, message, "");
        expect(mockSigner.signTransaction).toHaveBeenCalledWith(path, expect.any(String));
      }
    });

    it("should handle complex transaction objects", async () => {
      const complexTransaction = {
        ...mockTransactionObject,
        clauses: [
          {
            to: "0x456789012345678901234567890123456789abcd",
            value: "1000000000000000000",
            data: "0x",
          },
          {
            to: "0x0000000000000000000000000000456e65726779",
            value: "0",
            data: "0xa9059cbb",
          },
        ],
        dependsOn: "0xprevious123",
        gas: 50000,
      };

      const message = JSON.stringify(complexTransaction);
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(complexTransaction);
    });

    it("should handle minimal transaction objects", async () => {
      const minimalTransaction = {
        chainTag: 74,
        blockRef: "0x0000000000000000",
        expiration: 18,
        clauses: [],
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
        gas: 0,
        dependsOn: null,
        nonce: "0x00000000",
      };

      const message = JSON.stringify(minimalTransaction);
      const signMessageFn = signMessage(mockSignerContext);

      await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(mockedVechainSDKTransaction.of).toHaveBeenCalledWith(minimalTransaction);
    });
  });

  describe("signature formatting", () => {
    it("should handle different signature lengths", async () => {
      const signatures = [
        Buffer.from("12", "hex"),
        Buffer.from("1234567890abcdef", "hex"),
        Buffer.from("ff".repeat(32), "hex"),
      ];

      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      for (const signature of signatures) {
        (mockSigner.signTransaction as jest.Mock).mockResolvedValueOnce(signature);
        const result = await signMessageFn(mockDeviceId, mockPath, message, "");
        expect(result).toBe(signature.toString("hex"));
      }
    });

    it("should handle empty signature buffer", async () => {
      const emptySignature = Buffer.alloc(0);
      (mockSigner.signTransaction as jest.Mock).mockResolvedValue(emptySignature);

      const message = JSON.stringify(mockTransactionObject);
      const signMessageFn = signMessage(mockSignerContext);

      const result = await signMessageFn(mockDeviceId, mockPath, message, "");

      expect(result).toBe("");
    });
  });
});
