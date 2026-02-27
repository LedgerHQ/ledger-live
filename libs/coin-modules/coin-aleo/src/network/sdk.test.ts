import network from "@ledgerhq/live-network";
import { getNetworkConfig } from "../logic/utils";
import type {
  AleoEncryptedRegistrationResponse,
  Intent,
  PreparedRequestResponse,
} from "../types/sdk";
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

  describe("decryptCiphertext", () => {
    const mockParams = {
      currency: mockCurrency,
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

    it("should call network with correct method, url, headers and data", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDecryptedData });

      await sdkClient.decryptCiphertext(mockParams);

      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockNetworkConfig.sdkUrl}/symmetric_decrypt`,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          index: mockParams.outputIndex,
          ciphertext: mockParams.ciphertext,
          transition_public_key: mockParams.tpk,
          view_key: mockParams.viewKey,
          program: mockParams.programId,
          function_name: mockParams.functionName,
        },
      });
    });

    it("should return res.data from the network response", async () => {
      jest.mocked(network).mockResolvedValue({ data: mockDecryptedData });

      const result = await sdkClient.decryptCiphertext(mockParams);

      expect(result).toEqual(mockDecryptedData);
    });

    it("should propagate errors thrown by network", async () => {
      const mockError = new Error("Network error");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(sdkClient.decryptCiphertext(mockParams)).rejects.toThrow("Network error");
    });
  });

  describe("createRequestFromIntent", () => {
    const mockIntent: Intent = {
      type: "transfer_public",
      amount: "1000",
      to: "aleo1recipient",
    };
    const mockViewKey = "AViewKey1mock_view_key_data";
    const mockPreparedRequestResponse = {
      is_root: true,
      network_id: 1,
      program_id: "credits.aleo",
      function_name: "transfer_public",
      inputs: ["aleo1toaddress", "1000u64"],
      input_types: ["address", "u64"],
    };

    beforeEach(() => {
      jest.mocked(network).mockResolvedValue({ data: mockPreparedRequestResponse });
    });

    it("should create a transaction request from intent", async () => {
      const result = await sdkClient.createRequestFromIntent({
        currency: mockCurrency,
        intent: mockIntent,
        viewKey: mockViewKey,
      });

      expect(getNetworkConfig).toHaveBeenCalledTimes(1);
      expect(getNetworkConfig).toHaveBeenCalledWith(mockCurrency);
      expect(network).toHaveBeenCalledTimes(1);
      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockNetworkConfig.sdkUrl}/transactions/request`,
        data: {
          intent: mockIntent,
          view_key: mockViewKey,
        },
      });
      expect(result).toEqual(mockPreparedRequestResponse);
    });

    it("should use correct SDK URL from network config", async () => {
      const testnetConfig = {
        nodeUrl: "https://node.testnet.aleo.network",
        sdkUrl: "https://sdk.testnet.aleo.network",
        networkType: "testnet",
      };
      jest.mocked(getNetworkConfig).mockReturnValue(testnetConfig);

      await sdkClient.createRequestFromIntent({
        currency: mockCurrency,
        intent: mockIntent,
        viewKey: mockViewKey,
      });

      expect(network).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `${testnetConfig.sdkUrl}/transactions/request`,
        }),
      );
      expect(network).toHaveBeenCalledTimes(1);
    });

    it("should handle intent with BigInt amount correctly", async () => {
      const largeAmountIntent: Intent = {
        type: "transfer_public",
        amount: "1000000000000000000",
        to: "aleo1toaddress",
      };

      await sdkClient.createRequestFromIntent({
        currency: mockCurrency,
        intent: largeAmountIntent,
        viewKey: mockViewKey,
      });

      expect(network).toHaveBeenCalledWith({
        method: "POST",
        url: `${mockNetworkConfig.sdkUrl}/transactions/request`,
        data: {
          intent: largeAmountIntent,
          view_key: mockViewKey,
        },
      });
      expect(network).toHaveBeenCalledTimes(1);
    });

    it("should propagate network errors", async () => {
      const mockError = new Error("SDK service unavailable");
      jest.mocked(network).mockRejectedValue(mockError);

      await expect(
        sdkClient.createRequestFromIntent({
          currency: mockCurrency,
          intent: mockIntent,
          viewKey: mockViewKey,
        }),
      ).rejects.toThrow("SDK service unavailable");
    });

    it("should handle API error responses", async () => {
      const apiError = new Error("Invalid intent format");
      jest.mocked(network).mockRejectedValue(apiError);

      await expect(
        sdkClient.createRequestFromIntent({
          currency: mockCurrency,
          intent: mockIntent,
          viewKey: mockViewKey,
        }),
      ).rejects.toThrow("Invalid intent format");

      expect(network).toHaveBeenCalledTimes(1);
    });

    it("should return the complete response with data", async () => {
      const responseWithMetadata: PreparedRequestResponse = {
        is_root: true,
        network_id: 1,
        program_id: "credits.aleo",
        function_name: "transfer_public",
        inputs: ["aleo1toaddress", "1000u64"],
        input_types: ["address", "u64"],
      };
      jest.mocked(network).mockResolvedValue({ data: responseWithMetadata });

      const result = await sdkClient.createRequestFromIntent({
        currency: mockCurrency,
        intent: mockIntent,
        viewKey: mockViewKey,
      });

      expect(result).toEqual(responseWithMetadata);
      expect(result).toHaveProperty("is_root");
      expect(result).toHaveProperty("network_id");
      expect(result).toHaveProperty("program_id");
      expect(result).toHaveProperty("function_name");
      expect(result).toHaveProperty("inputs");
      expect(result).toHaveProperty("input_types");
    });
  });
});
