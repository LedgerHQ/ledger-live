import resolver from "./getAddress";
import { VechainSigner } from "../types";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import eip55 from "eip55";

// Mock dependencies
jest.mock("eip55");

const mockedEip55 = jest.mocked(eip55);

describe("getAddress resolver", () => {
  const mockDeviceId = "mock-device-id";
  const mockPath = "44'/818'/0'/0/0";

  const mockSigner: VechainSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  };

  const mockSignerContext: SignerContext<VechainSigner> = jest.fn();

  const mockSignerResponse = {
    address: "0x742d35cc6634c0532925a3b8d0b251d8c1743ec4",
    publicKey: Buffer.from(
      "04abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
      "hex",
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSigner.getAddress as jest.Mock).mockResolvedValue(mockSignerResponse);
    (mockSignerContext as jest.Mock).mockImplementation((deviceId, callback) =>
      callback(mockSigner),
    );
    mockedEip55.encode.mockReturnValue("0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4");
  });

  describe("basic functionality", () => {
    it("should get address with verify false", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      const result = await getAddressFn(mockDeviceId, options);

      expect(result).toEqual({
        address: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
        publicKey: mockSignerResponse.publicKey,
        path: mockPath,
      });

      expect(mockSigner.getAddress).toHaveBeenCalledWith(mockPath, false, false);
      expect(mockedEip55.encode).toHaveBeenCalledWith(mockSignerResponse.address);
    });

    it("should get address with verify true", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: true,
        currency: {} as any,
        derivationMode: "" as any,
      };

      const result = await getAddressFn(mockDeviceId, options);

      expect(result).toEqual({
        address: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
        publicKey: mockSignerResponse.publicKey,
        path: mockPath,
      });

      expect(mockSigner.getAddress).toHaveBeenCalledWith(mockPath, true, false);
    });

    it("should always pass false as third parameter (askChainCode)", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: true,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await getAddressFn(mockDeviceId, options);

      expect(mockSigner.getAddress).toHaveBeenCalledWith(mockPath, true, false);
    });
  });

  describe("address encoding", () => {
    it("should encode address using eip55", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await getAddressFn(mockDeviceId, options);

      expect(mockedEip55.encode).toHaveBeenCalledWith(mockSignerResponse.address);
    });

    it("should handle different address formats from signer", async () => {
      const addresses = [
        "0x742d35cc6634c0532925a3b8d0b251d8c1743ec4",
        "0X742D35CC6634C0532925A3B8D0B251D8C1743EC4",
        "742d35cc6634c0532925a3b8d0b251d8c1743ec4",
      ];

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      for (const address of addresses) {
        const customResponse = { ...mockSignerResponse, address };
        (mockSigner.getAddress as jest.Mock).mockResolvedValueOnce(customResponse);
        mockedEip55.encode.mockReturnValueOnce(`0x${address.replace(/^0x/i, "")}`);

        await getAddressFn(mockDeviceId, options);

        expect(mockedEip55.encode).toHaveBeenCalledWith(address);
      }
    });

    it("should return encoded address from eip55", async () => {
      const encodedAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";
      mockedEip55.encode.mockReturnValue(encodedAddress);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      const result = await getAddressFn(mockDeviceId, options);

      expect(result.address).toBe(encodedAddress);
    });
  });

  describe("error handling", () => {
    it("should throw error when address is empty", async () => {
      const invalidResponse = { ...mockSignerResponse, address: "" };
      (mockSigner.getAddress as jest.Mock).mockResolvedValue(invalidResponse);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow(
        "[vechain] Response is empty  ",
      );
    });

    it("should throw error when address is null", async () => {
      const invalidResponse = { ...mockSignerResponse, address: null };
      (mockSigner.getAddress as jest.Mock).mockResolvedValue(invalidResponse);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow(
        "[vechain] Response is empty null ",
      );
    });

    it("should throw error when address is undefined", async () => {
      const invalidResponse = { ...mockSignerResponse, address: undefined };
      (mockSigner.getAddress as jest.Mock).mockResolvedValue(invalidResponse);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow(
        "[vechain] Response is empty undefined ",
      );
    });

    it("should throw error when publicKey is empty", async () => {
      const invalidResponse = { ...mockSignerResponse, publicKey: Buffer.alloc(0) };
      (mockSigner.getAddress as jest.Mock).mockResolvedValue(invalidResponse);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow(
        "[vechain] Response is empty",
      );
    });

    it("should handle signer errors", async () => {
      const signerError = new Error("Hardware wallet error");
      (mockSigner.getAddress as jest.Mock).mockRejectedValue(signerError);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow("Hardware wallet error");
    });

    it("should handle signerContext errors", async () => {
      const contextError = new Error("Signer context failed");
      (mockSignerContext as jest.Mock).mockRejectedValue(contextError);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow("Signer context failed");
    });

    it("should handle eip55 encoding errors", async () => {
      // Reset the mock to not throw an error initially
      (mockSigner.getAddress as jest.Mock).mockResolvedValue(mockSignerResponse);

      const encodingError = new Error("Invalid address format");
      mockedEip55.encode.mockImplementation(() => {
        throw encodingError;
      });

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await expect(getAddressFn(mockDeviceId, options)).rejects.toThrow("Invalid address format");
    });
  });

  describe("different derivation paths", () => {
    it("should handle different derivation paths", async () => {
      const paths = ["44'/818'/0'/0/0", "44'/818'/1'/0/0", "44'/818'/0'/0/1", "44'/818'/2'/0/5"];

      const getAddressFn = resolver(mockSignerContext);

      for (const path of paths) {
        const options: GetAddressOptions = {
          path,
          verify: false,
          currency: {} as any,
          derivationMode: "" as any,
        };
        const result = await getAddressFn(mockDeviceId, options);

        expect(mockSigner.getAddress).toHaveBeenCalledWith(path, false, false);
        expect(result.path).toBe(path);
      }
    });

    it("should handle empty path", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: "",
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      await getAddressFn(mockDeviceId, options);

      expect(mockSigner.getAddress).toHaveBeenCalledWith("", false, false);
    });
  });

  describe("different device IDs", () => {
    it("should handle different device IDs", async () => {
      const deviceIds = ["device1", "device2", "device3"];
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      for (const deviceId of deviceIds) {
        await getAddressFn(deviceId, options);
        expect(mockSignerContext).toHaveBeenCalledWith(deviceId, expect.any(Function));
      }
    });
  });

  describe("publicKey handling", () => {
    it("should return publicKey from signer response", async () => {
      const customPublicKey = Buffer.from("abcdef1234567890", "hex"); // Valid hex with length > 0
      const customResponse = { ...mockSignerResponse, publicKey: customPublicKey };
      (mockSigner.getAddress as jest.Mock).mockResolvedValue(customResponse);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      const result = await getAddressFn(mockDeviceId, options);

      expect(result.publicKey).toBe(customPublicKey);
    });

    it("should handle different publicKey lengths", async () => {
      const publicKeys = [
        Buffer.from("12", "hex"),
        Buffer.from("1234567890abcdef", "hex"),
        Buffer.from("04" + "ab".repeat(32) + "cd".repeat(32), "hex"), // 65 bytes (uncompressed)
      ];

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      for (const publicKey of publicKeys) {
        const customResponse = { ...mockSignerResponse, publicKey };
        (mockSigner.getAddress as jest.Mock).mockResolvedValueOnce(customResponse);

        const result = await getAddressFn(mockDeviceId, options);

        expect(result.publicKey).toBe(publicKey);
      }
    });
  });

  describe("verify parameter behavior", () => {
    it("should pass verify parameter correctly to signer", async () => {
      const getAddressFn = resolver(mockSignerContext);

      // Test verify: true
      await getAddressFn(mockDeviceId, {
        path: mockPath,
        verify: true,
        currency: {} as any,
        derivationMode: "" as any,
      });
      expect(mockSigner.getAddress).toHaveBeenLastCalledWith(mockPath, true, false);

      // Test verify: false
      await getAddressFn(mockDeviceId, {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      });
      expect(mockSigner.getAddress).toHaveBeenLastCalledWith(mockPath, false, false);
    });

    it("should handle undefined verify parameter", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options = { path: mockPath } as GetAddressOptions;

      await getAddressFn(mockDeviceId, options);

      expect(mockSigner.getAddress).toHaveBeenCalledWith(mockPath, undefined, false);
    });
  });

  describe("integration scenarios", () => {
    it("should work with real-like addresses and public keys", async () => {
      const realAddress = "0x742d35cc6634c0532925a3b8d0b251d8c1743ec4";
      const realPublicKey = Buffer.from(
        "04abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
        "hex",
      );
      const realResponse = { address: realAddress, publicKey: realPublicKey };
      const encodedAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

      (mockSigner.getAddress as jest.Mock).mockResolvedValue(realResponse);
      mockedEip55.encode.mockReturnValue(encodedAddress);

      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: "44'/818'/0'/0/0",
        verify: true,
        currency: {} as any,
        derivationMode: "" as any,
      };

      const result = await getAddressFn("real-device", options);

      expect(result).toEqual({
        address: encodedAddress,
        publicKey: realPublicKey,
        path: "44'/818'/0'/0/0",
      });
    });

    it("should maintain result structure consistency", async () => {
      const getAddressFn = resolver(mockSignerContext);
      const options: GetAddressOptions = {
        path: mockPath,
        verify: false,
        currency: {} as any,
        derivationMode: "" as any,
      };

      const result = await getAddressFn(mockDeviceId, options);

      expect(result).toHaveProperty("address");
      expect(result).toHaveProperty("publicKey");
      expect(result).toHaveProperty("path");
      expect(Object.keys(result)).toHaveLength(3);
    });
  });
});
