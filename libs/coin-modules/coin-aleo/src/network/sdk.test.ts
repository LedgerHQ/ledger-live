import network from "@ledgerhq/live-network";
import { getNetworkConfig } from "../logic/utils";
import type { AleoEncryptedRegistrationResponse } from "../types/sdk";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { sdkClient } from "./sdk";

jest.mock("@ledgerhq/live-network");
jest.mock("../logic/utils");

describe("sdkClient", () => {
  const mockCurrency = getMockedCurrency();
  const mockNetworkConfig = {
    nodeUrl: "https://node.aleo.network",
    sdkUrl: "https://sdk.aleo.network",
    networkType: "mainnet",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getNetworkConfig).mockReturnValue(mockNetworkConfig);
  });

  describe("encryptRegistrationPayload", () => {
    const mockResponse: AleoEncryptedRegistrationResponse = {
      encrypted: "mock_encrypted_data",
    };

    it("should call getNetworkConfig with the provided currency", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
        start: 0,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
    });

    it("should call network with correct method, url and data", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
        start: 0,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockNetworkConfig.sdkUrl}/encrypt_registration`,
        data: {
          public_key: "aleo1publickey",
          view_key: "AViewKey1viewkey",
          start: 0,
        },
      });
    });

    it("should return res.data from the network response", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
        start: 0,
      });

      expect(result).toEqual(mockResponse);
    });

    it("should construct the URL using sdkUrl from getNetworkConfig", async () => {
      const testnetConfig = {
        nodeUrl: "https://node.testnet.aleo.network",
        sdkUrl: "https://sdk.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
        start: 0,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${testnetConfig.sdkUrl}/encrypt_registration`,
        }),
      );
    });

    it("should propagate errors thrown by network", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        sdkClient.encryptRegistrationPayload({
          currency: mockCurrency,
          publicKey: "aleo1publickey",
          viewKey: "AViewKey1viewkey",
          start: 0,
        }),
      ).rejects.toThrow("Network error");
    });
  });

  describe("decryptRecord", () => {
    const mockCiphertext = "record1mock_ciphertext_data";
    const mockViewKey = "AViewKey1mock_view_key_data";
    const mockDecryptedData = {
      owner: "aleo1...",
      data: { microcredits: "1000" },
      nonce: "",
      version: 1,
    };

    it("should successfully decrypt a record", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDecryptedData });

      const result = await sdkClient.decryptRecord({
        currency: mockCurrency,
        ciphertext: mockCiphertext,
        viewKey: mockViewKey,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockNetworkConfig.sdkUrl}/decrypt`,
        data: {
          ciphertext: mockCiphertext,
          view_key: mockViewKey,
        },
      });
      expect(result).toEqual(mockDecryptedData);
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        sdkClient.decryptRecord({
          currency: mockCurrency,
          ciphertext: mockCiphertext,
          viewKey: mockViewKey,
        }),
      ).rejects.toThrow("Network error");
    });
  });
});
