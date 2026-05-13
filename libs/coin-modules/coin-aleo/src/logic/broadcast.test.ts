import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { apiClient } from "../network/api";
import { sdkClient } from "../network/sdk";
import {
  getMockedAuthorization,
  getMockedDelegatedProvingResponse,
  getMockedFeeAuthorization,
} from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { broadcast } from "./broadcast";
import { fromHex } from "./utils";

jest.mock("../network/api");
jest.mock("../network/sdk");
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  fromHex: jest.fn(),
}));

const mockFromHex = jest.mocked(fromHex);

describe("broadcast", () => {
  const mockAccount = getMockedAccount();
  const mockSignedTx = "abcdef1234567890";
  const mockAuthorization = getMockedAuthorization();
  const mockFeeAuthorization = getMockedFeeAuthorization();
  const mockResponse = getMockedDelegatedProvingResponse();
  const mockConfig = { ...getMockedConfig("testnet"), useEncryptedProve: false };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFromHex.mockReturnValue({
      authorization: mockAuthorization,
      feeAuthorization: mockFeeAuthorization,
    });
    jest.mocked(apiClient.submitDelegatedProvingRequest).mockResolvedValue(mockResponse);
  });

  it("should broadcast transaction and return the transaction id when useEncryptedProve is false", async () => {
    const result = await broadcast({
      configOrCurrencyId: mockConfig,
      account: mockAccount,
      signedTx: mockSignedTx,
    });

    expect(mockFromHex).toHaveBeenCalledTimes(1);
    expect(mockFromHex).toHaveBeenCalledWith(mockSignedTx);
    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledTimes(1);
    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledWith({
      currency: mockAccount.currency,
      authorization: mockAuthorization,
      feeAuthorization: mockFeeAuthorization,
      broadcast: true,
    });
    expect(result).toBe(mockResponse.transaction.id);
  });

  it("should call API without feeAuthorization when absent in signed transaction payload", async () => {
    mockFromHex.mockReturnValue({
      authorization: mockAuthorization,
    });

    await broadcast({
      configOrCurrencyId: mockConfig,
      account: mockAccount,
      signedTx: mockSignedTx,
    });

    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledTimes(1);
    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledWith({
      currency: mockAccount.currency,
      authorization: mockAuthorization,
      broadcast: true,
    });
  });

  it("should propagate network errors from the API client", async () => {
    jest
      .mocked(apiClient.submitDelegatedProvingRequest)
      .mockRejectedValue(new Error("Network error: Connection refused"));

    await expect(
      broadcast({ configOrCurrencyId: mockConfig, account: mockAccount, signedTx: mockSignedTx }),
    ).rejects.toThrow("Network error: Connection refused");
  });

  describe("when useEncryptedProve is true", () => {
    const encryptedConfig = { ...getMockedConfig("testnet"), useEncryptedProve: true };
    const mockPublicKeyResponse = {
      data: {
        key_id: "mockKeyId",
        public_key: "mockPublicKey",
      },
      stickySessionCookie: null,
    };
    const mockEncryptedData = "mockEncryptedData";

    beforeEach(() => {
      jest.mocked(apiClient.getProvePublicKey).mockResolvedValue(mockPublicKeyResponse);
      jest.mocked(sdkClient.encryptProvingRequest).mockResolvedValue(mockEncryptedData);
      jest.mocked(apiClient.submitEncryptedDelegatedProvingRequest).mockResolvedValue(mockResponse);
    });

    it("should broadcast transaction using encrypted prove and return the transaction id", async () => {
      const result = await broadcast({
        configOrCurrencyId: encryptedConfig,
        account: mockAccount,
        signedTx: mockSignedTx,
      });

      expect(apiClient.getProvePublicKey).toHaveBeenCalledTimes(1);
      expect(apiClient.getProvePublicKey).toHaveBeenCalledWith({
        currency: mockAccount.currency,
      });
      expect(sdkClient.encryptProvingRequest).toHaveBeenCalledTimes(1);
      expect(sdkClient.encryptProvingRequest).toHaveBeenCalledWith({
        publicKey: mockPublicKeyResponse.data.public_key,
        currency: mockAccount.currency,
        authorization: mockAuthorization,
        feeAuthorization: mockFeeAuthorization,
        broadcast: true,
      });
      expect(apiClient.submitEncryptedDelegatedProvingRequest).toHaveBeenCalledTimes(1);
      expect(apiClient.submitEncryptedDelegatedProvingRequest).toHaveBeenCalledWith({
        currency: mockAccount.currency,
        keyId: mockPublicKeyResponse.data.key_id,
        encryptedData: mockEncryptedData,
        stickySessionCookie: mockPublicKeyResponse.stickySessionCookie,
      });
      expect(result).toBe(mockResponse.transaction.id);
    });

    it("should call encryptProvingRequest without feeAuthorization when absent in signed transaction payload", async () => {
      mockFromHex.mockReturnValue({
        authorization: mockAuthorization,
      });

      await broadcast({
        configOrCurrencyId: encryptedConfig,
        account: mockAccount,
        signedTx: mockSignedTx,
      });

      expect(sdkClient.encryptProvingRequest).toHaveBeenCalledWith({
        publicKey: mockPublicKeyResponse.data.public_key,
        currency: mockAccount.currency,
        authorization: mockAuthorization,
        broadcast: true,
      });
    });

    it("should not call submitDelegatedProvingRequest", async () => {
      await broadcast({
        configOrCurrencyId: encryptedConfig,
        account: mockAccount,
        signedTx: mockSignedTx,
      });

      expect(apiClient.submitDelegatedProvingRequest).not.toHaveBeenCalled();
    });

    it("should throw with status and message when broadcast_result is Rejected", async () => {
      jest.mocked(apiClient.submitEncryptedDelegatedProvingRequest).mockResolvedValue({
        ...mockResponse,
        broadcast_result: {
          status: "Rejected",
          status_code: 400,
          message: "Transaction rejected",
        },
      });

      await expect(
        broadcast({
          configOrCurrencyId: encryptedConfig,
          account: mockAccount,
          signedTx: mockSignedTx,
        }),
      ).rejects.toThrow("aleo: broadcast failed with status: Rejected (Transaction rejected)");
    });

    it("should throw with Unknown error when broadcast_result has no message (Skipped)", async () => {
      jest.mocked(apiClient.submitEncryptedDelegatedProvingRequest).mockResolvedValue({
        ...mockResponse,
        broadcast_result: {
          status: "Skipped",
        },
      });

      await expect(
        broadcast({
          configOrCurrencyId: encryptedConfig,
          account: mockAccount,
          signedTx: mockSignedTx,
        }),
      ).rejects.toThrow("aleo: broadcast failed with status: Skipped (Unknown error)");
    });
  });
});
