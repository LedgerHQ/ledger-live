import resolver from "./getAddress";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { ICPSigner } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
import { DerivationMode } from "@ledgerhq/types-live";
import { ICPGetAddrResponse } from "../types/signer";

describe("ICP getAddress resolver", () => {
  const mockSigner: jest.Mocked<ICPSigner> = {
    getAddressAndPubKey: jest.fn(),
    showAddressAndPubKey: jest.fn(),
    sign: jest.fn(),
    signUpdateCall: jest.fn(),
  };

  const commonOptions = {
    currency: getCryptoCurrencyById("internet_computer"),
    derivationMode: "icp" as DerivationMode,
  };

  const mockSignerContext: SignerContext<ICPSigner> = jest.fn(async (deviceId, callback) => {
    return callback(mockSigner);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call signer.getAddressAndPubKey when verify is false", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/223'/0'/0/0",
      verify: false,
    };

    const mockResponse: ICPGetAddrResponse = {
      returnCode: 0x9000,
      errorMessage: "No errors",
      address: Buffer.from("address"),
      publicKey: Buffer.from("publicKey"),
      principalText: "principal",
    };
    mockSigner.getAddressAndPubKey.mockResolvedValue(mockResponse);

    const getAddress = resolver(mockSignerContext);
    await getAddress("device1", options);

    expect(mockSigner.getAddressAndPubKey).toHaveBeenCalledWith(options.path);
    expect(mockSigner.showAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("should call signer.showAddressAndPubKey when verify is true", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/223'/0'/0/0",
      verify: true,
    };

    const mockResponse: ICPGetAddrResponse = {
      returnCode: 0x9000,
      errorMessage: "No errors",
      address: Buffer.from("address"),
      publicKey: Buffer.from("publicKey"),
      principalText: "principal",
    };
    mockSigner.showAddressAndPubKey.mockResolvedValue(mockResponse);

    const getAddress = resolver(mockSignerContext);
    await getAddress("device1", options);

    expect(mockSigner.showAddressAndPubKey).toHaveBeenCalledWith(options.path);
    expect(mockSigner.getAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("should default to verify=false when not provided", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/223'/0'/0/0",
    };

    const mockResponse: ICPGetAddrResponse = {
      returnCode: 0x9000,
      errorMessage: "No errors",
      address: Buffer.from("address"),
      publicKey: Buffer.from("publicKey"),
      principalText: "principal",
    };
    mockSigner.getAddressAndPubKey.mockResolvedValue(mockResponse);

    const getAddress = resolver(mockSignerContext);
    await getAddress("device1", options);

    expect(mockSigner.getAddressAndPubKey).toHaveBeenCalledWith(options.path);
    expect(mockSigner.showAddressAndPubKey).not.toHaveBeenCalled();
  });

  it("should return the correct address format", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/223'/0'/0/0",
    };

    const mockResponse: ICPGetAddrResponse = {
      returnCode: 0x9000,
      errorMessage: "No errors",
      address: Buffer.from("testAddress"),
      publicKey: Buffer.from("testPublicKey"),
      principalText: "testPrincipal",
    };

    mockSigner.getAddressAndPubKey.mockResolvedValue(mockResponse);

    const getAddress = resolver(mockSignerContext);
    const result = await getAddress("device1", options);

    expect(result).toEqual({
      path: options.path,
      address: mockResponse.address!.toString("hex"),
      publicKey: mockResponse.publicKey!.toString("hex"),
      principalText: mockResponse.principalText,
    });
  });

  it("should throw an error when address is undefined", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/223'/0'/0/0",
    };

    mockSigner.getAddressAndPubKey.mockResolvedValue({
      returnCode: 0x6a80,
      errorMessage: "Error",
      // address is missing
      publicKey: Buffer.from("publicKey"),
      principalText: "principal",
      address: undefined,
    });

    const getAddress = resolver(mockSignerContext);
    await expect(getAddress("device1", options)).rejects.toThrow(
      "Failed to get address from device",
    );
  });

  it("should throw an error when publicKey is undefined", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/223'/0'/0/0",
    };

    mockSigner.getAddressAndPubKey.mockResolvedValue({
      returnCode: 0x6a80,
      errorMessage: "Error",
      address: Buffer.from("address"),
      principalText: "principal",
      // publicKey is missing
      publicKey: undefined,
    });

    const getAddress = resolver(mockSignerContext);
    await expect(getAddress("device1", options)).rejects.toThrow(
      "Failed to get address from device",
    );
  });
});
