import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { ICPSigner } from "../types";
import resolver from "./getAddress";

describe("getAddress resolver", () => {
  const mockSignerContext = jest.fn();
  const icpCurrency = getCryptoCurrencyById("internet_computer");
  const derivationPath = "44'/223'/0'/0/0";
  const derivationMode = "internet_computer";

  beforeEach(() => {
    mockSignerContext.mockReset();
  });

  const makeSignerContext = (): SignerContext<ICPSigner> => mockSignerContext as any;

  it("should return address and public key from device (no verify)", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: (signer: ICPSigner) => unknown) =>
      fn({
        getAddressAndPubKey: jest.fn().mockResolvedValue({
          address: Buffer.from("addr-bytes"),
          publicKey: Buffer.from("pk-bytes"),
          principalText: "principal-text",
        }),
        showAddressAndPubKey: jest.fn(),
      } as any),
    );

    const getAddress = resolver(makeSignerContext());
    const result = await getAddress("device-1", {
      path: derivationPath,
      verify: false,
      currency: icpCurrency,
      derivationMode,
    });

    expect(result.path).toBe(derivationPath);
    expect(result.address).toBe(Buffer.from("addr-bytes").toString("hex"));
    expect(result.publicKey).toBe(Buffer.from("pk-bytes").toString("hex"));
    // principalText is not part of the Result type but is returned by the resolver
    expect(result).toHaveProperty("principalText", "principal-text");
  });

  it("should call showAddressAndPubKey when verify is true", async () => {
    const mockShow = jest.fn().mockResolvedValue({
      address: Buffer.from("addr"),
      publicKey: Buffer.from("pk"),
      principalText: "principal",
    });

    mockSignerContext.mockImplementation((_deviceId: string, fn: (signer: ICPSigner) => unknown) =>
      fn({
        getAddressAndPubKey: jest.fn(),
        showAddressAndPubKey: mockShow,
      } as any),
    );

    const getAddress = resolver(makeSignerContext());
    await getAddress("device-1", {
      path: derivationPath,
      verify: true,
      currency: icpCurrency,
      derivationMode,
    });

    expect(mockShow).toHaveBeenCalledWith("44'/223'/0'/0/0");
  });

  it("should throw when address is missing", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: (signer: ICPSigner) => unknown) =>
      fn({
        getAddressAndPubKey: jest.fn().mockResolvedValue({
          address: null,
          publicKey: Buffer.from("pk"),
        }),
      } as any),
    );

    const getAddress = resolver(makeSignerContext());
    await expect(
      getAddress("device-1", {
        path: derivationPath,
        currency: icpCurrency,
        derivationMode,
        verify: false,
      }),
    ).rejects.toThrow("Failed to get address from device");
  });

  it("should throw when publicKey is missing", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: (signer: ICPSigner) => unknown) =>
      fn({
        getAddressAndPubKey: jest.fn().mockResolvedValue({
          address: Buffer.from("addr"),
          publicKey: null,
        }),
      } as any),
    );

    const getAddress = resolver(makeSignerContext());
    await expect(
      getAddress("device-1", {
        path: derivationPath,
        verify: false,
        currency: icpCurrency,
        derivationMode,
      }),
    ).rejects.toThrow("Failed to get address from device");
  });
});
