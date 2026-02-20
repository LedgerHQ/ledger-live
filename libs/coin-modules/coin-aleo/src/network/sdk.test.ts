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
    it("should call getNetworkConfig with the provided currency", async () => {
      const mockResponse: AleoEncryptedRegistrationResponse = {
        encrypted_data: "mock_encrypted_data",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
    });

    it("should call network with correct method, url and data", async () => {
      const mockResponse: AleoEncryptedRegistrationResponse = {
        encrypted_data: "mock_encrypted_data",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: "https://sdk.aleo.network/network/mainnet/encrypt_registration",
        data: {
          public_key: "aleo1publickey",
          view_key: "AViewKey1viewkey",
          start: undefined,
        },
      });
    });

    it("should include start in request data when provided", async () => {
      const mockResponse: AleoEncryptedRegistrationResponse = {
        encrypted_data: "mock_encrypted_data",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
        start: 42,
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ start: 42 }),
        }),
      );
    });

    it("should return res.data from the network response", async () => {
      const mockResponse: AleoEncryptedRegistrationResponse = {
        encrypted_data: "mock_encrypted_data",
      };
      jest.mocked(network).mockResolvedValue({ data: mockResponse });

      const result = await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
      });

      expect(result).toEqual(mockResponse);
    });

    it("should construct the URL using sdkUrl and networkType from getNetworkConfig", async () => {
      const testnetConfig = {
        nodeUrl: "https://node.testnet.aleo.network",
        sdkUrl: "https://sdk.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);
      jest.mocked(network).mockResolvedValue({ data: { encrypted_data: "data" } });

      await sdkClient.encryptRegistrationPayload({
        currency: mockCurrency,
        publicKey: "aleo1publickey",
        viewKey: "AViewKey1viewkey",
      });

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://sdk.testnet.aleo.network/network/testnet/encrypt_registration",
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
        }),
      ).rejects.toThrow("Network error");
    });
  });
});
