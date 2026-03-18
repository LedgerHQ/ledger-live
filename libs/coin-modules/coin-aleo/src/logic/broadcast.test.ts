import { getMockedAccount, mockAleoResources } from "../__tests__/fixtures/account.fixture";
import { apiClient } from "../network/api";
import {
  getMockedAuthorization,
  getMockedDelegatedProvingResponse,
  getMockedFeeAuthorization,
} from "../__tests__/fixtures/api.fixture";
import { broadcast } from "./broadcast";
import { fromHex } from "./utils";

jest.mock("../network/api");
jest.mock("./utils");

const mockFromHex = jest.mocked(fromHex);

describe("broadcast", () => {
  const mockAccount = getMockedAccount();
  const mockSignedTx = "abcdef1234567890";
  const mockAuthorization = getMockedAuthorization();
  const mockFeeAuthorization = getMockedFeeAuthorization();
  const mockResponse = getMockedDelegatedProvingResponse();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFromHex.mockReturnValue({
      authorization: mockAuthorization,
      feeAuthorization: mockFeeAuthorization,
    });
    jest.mocked(apiClient.submitDelegatedProvingRequest).mockResolvedValue(mockResponse);
  });

  it("should broadcast transaction and return the transaction id", async () => {
    const result = await broadcast({ account: mockAccount, signedTx: mockSignedTx });

    expect(mockFromHex).toHaveBeenCalledTimes(1);
    expect(mockFromHex).toHaveBeenCalledWith(mockSignedTx);
    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledTimes(1);
    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledWith({
      currency: mockAccount.currency,
      authorization: mockAuthorization,
      feeAuthorization: mockFeeAuthorization,
      jwt: mockAleoResources.provableApi?.jwt?.token,
      broadcast: true,
    });
    expect(result).toBe(mockResponse.transaction.id);
  });

  it("should call API without feeAuthorization when absent in signed transaction payload", async () => {
    mockFromHex.mockReturnValue({
      authorization: mockAuthorization,
    });

    await broadcast({ account: mockAccount, signedTx: mockSignedTx });

    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledTimes(1);
    expect(apiClient.submitDelegatedProvingRequest).toHaveBeenCalledWith({
      currency: mockAccount.currency,
      authorization: mockAuthorization,
      jwt: mockAleoResources.provableApi?.jwt?.token,
      broadcast: true,
    });
  });

  it("should throw when JWT is missing", async () => {
    const accountWithoutJwt = getMockedAccount({
      aleoResources: { ...mockAleoResources, provableApi: {} },
    });

    await expect(broadcast({ account: accountWithoutJwt, signedTx: mockSignedTx })).rejects.toThrow(
      /aleo: jwt token is missing/,
    );
  });

  it("should propagate network errors from the API client", async () => {
    jest
      .mocked(apiClient.submitDelegatedProvingRequest)
      .mockRejectedValue(new Error("Network error: Connection refused"));

    await expect(broadcast({ account: mockAccount, signedTx: mockSignedTx })).rejects.toThrow(
      "Network error: Connection refused",
    );
  });
});
