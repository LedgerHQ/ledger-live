import { GetAddressOptions } from "@ledgerhq/coin-framework/derivation";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib/currencies";
import { DerivationMode } from "@ledgerhq/types-live";
import { MinaSigner } from "../types/signer";
import resolver from "./getAddress";

describe("Mina getAddress resolver", () => {
  // Mock the signer context
  const mockSigner: MinaSigner = {
    getAddress: jest.fn(),
    signTransaction: jest.fn(),
  };
  const commonOptions = {
    currency: getCryptoCurrencyById("mina"),
    derivationMode: "minabip44" as DerivationMode,
  };

  const mockSignerContext: SignerContext<MinaSigner> = jest.fn(async (deviceId, callback) => {
    return callback(mockSigner);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call the signer with the correct account number", async () => {
    const options: GetAddressOptions = {
      ...commonOptions,
      path: "44'/12586'/0'/0/0",
      verify: false,
    };

    // Mock response from signer
    (mockSigner.getAddress as jest.Mock).mockResolvedValue({
      publicKey: "testPublicKey123",
    });

    const getAddress = resolver(mockSignerContext);
    await getAddress("device1", options);

    expect(mockSigner.getAddress).toHaveBeenCalledWith(0, false);
  });

  it("should pass the verify flag correctly", async () => {
    const options: GetAddressOptions = {
      path: "44'/12586'/2'/0/0",
      verify: true,
      ...commonOptions,
    };

    // Mock response from signer
    (mockSigner.getAddress as jest.Mock).mockResolvedValue({
      publicKey: "testPublicKey456",
    });

    const getAddress = resolver(mockSignerContext);
    await getAddress("device1", options);

    expect(mockSigner.getAddress).toHaveBeenCalledWith(2, true);
  });

  it("should default to verify=false when not provided", async () => {
    const options: GetAddressOptions = {
      path: "44'/12586'/1'/0/0",
      ...commonOptions,
    };

    // Mock response from signer
    (mockSigner.getAddress as jest.Mock).mockResolvedValue({
      publicKey: "testPublicKey789",
    });

    const getAddress = resolver(mockSignerContext);
    await getAddress("device1", options);

    expect(mockSigner.getAddress).toHaveBeenCalledWith(1, false);
  });

  it("should return the correct address format", async () => {
    const options: GetAddressOptions = {
      path: "44'/12586'/3'/0/0",
      ...commonOptions,
    };

    const expectedPublicKey = "minaPublicKeyABC123";

    // Mock response from signer
    (mockSigner.getAddress as jest.Mock).mockResolvedValue({
      publicKey: expectedPublicKey,
    });

    const getAddress = resolver(mockSignerContext);
    const result = await getAddress("device1", options);

    expect(result).toEqual({
      address: expectedPublicKey,
      publicKey: expectedPublicKey,
      path: options.path,
    });
  });

  it("should throw an error for invalid path", async () => {
    const options: GetAddressOptions = {
      path: "44'/789'/0'/0/0", // Invalid coin type for Mina
      verify: false,
      ...commonOptions,
    };

    const getAddress = resolver(mockSignerContext);
    await expect(getAddress("device1", options)).rejects.toThrow();
  });

  it("should throw an error when publicKey is undefined", async () => {
    const options: GetAddressOptions = {
      path: "44'/12586'/0'/0/0",
      verify: false,
      ...commonOptions,
    };

    // Mock response from signer with undefined publicKey
    (mockSigner.getAddress as jest.Mock).mockResolvedValue({
      publicKey: undefined,
    });

    const getAddress = resolver(mockSignerContext);
    await expect(getAddress("device1", options)).rejects.toThrow(
      "[mina] getAddress: expected publicKey to be defined",
    );
  });
});
