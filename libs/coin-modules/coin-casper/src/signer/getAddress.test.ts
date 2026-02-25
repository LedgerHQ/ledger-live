import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { KeyAlgorithm } from "casper-js-sdk";
import getAddressResolver from "./getAddress";
import { CasperSigner, CasperGetAddrResponse } from "../types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

jest.mock("../bridge/bridgeHelpers/addresses", () => ({
  ...jest.requireActual("../bridge/bridgeHelpers/addresses"),
  casperAddressFromPubKey: jest.fn(),
}));

import * as addressHelpers from "../bridge/bridgeHelpers/addresses";
const mockCasperAddressFromPubKey = addressHelpers.casperAddressFromPubKey as jest.Mock;

describe("getAddress resolver", () => {
  // Test fixtures
  const mockDeviceId = "device_123";
  const mockPath = "44'/506'/0'/0/0";
  const mockCurrency = getCryptoCurrencyById("casper");
  const mockDerivationMode = "casper_wallet";
  const mockPubKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const mockDerivedAddress = "02cafe0123456789abcdef";

  let mockSigner: CasperSigner;
  let mockSignerContext: SignerContext<CasperSigner>;

  // Mock responses
  const createAddressResponse = (includeAddress: boolean): CasperGetAddrResponse => ({
    errorMessage: "",
    returnCode: 0x9000,
    publicKey: Buffer.from(mockPubKey, "hex"),
    Address: {
      toString: jest.fn().mockReturnValue(includeAddress ? "02CAFE0123456789ABCDEF" : ""),
      length: includeAddress ? 1 : 0,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mocks
    mockSigner = {
      showAddressAndPubKey: jest.fn(),
      getAddressAndPubKey: jest.fn(),
      sign: jest.fn(),
    };

    mockSignerContext = jest.fn((deviceId, callback) => callback(mockSigner));

    // Mock address derivation function
    mockCasperAddressFromPubKey.mockReturnValue(mockDerivedAddress);
  });

  const setupTest = (verify: boolean, includeAddress: boolean) => {
    const response = createAddressResponse(includeAddress);

    if (verify) {
      mockSigner.showAddressAndPubKey = jest.fn().mockResolvedValue(response);
    } else {
      mockSigner.getAddressAndPubKey = jest.fn().mockResolvedValue(response);
    }

    return getAddressResolver(mockSignerContext);
  };

  test("should return address from device when verify=false", async () => {
    const getAddressFn = setupTest(false, true);

    const result = await getAddressFn(mockDeviceId, {
      path: mockPath,
      verify: false,
      currency: mockCurrency,
      derivationMode: mockDerivationMode,
    });

    expect(mockSigner.getAddressAndPubKey).toHaveBeenCalledWith(mockPath);
    expect(mockSigner.showAddressAndPubKey).not.toHaveBeenCalled();

    expect(result).toEqual({
      path: mockPath,
      address: mockDerivedAddress,
      publicKey: mockPubKey,
    });
  });

  test("should return address from device when verify=true", async () => {
    const getAddressFn = setupTest(true, true);

    const result = await getAddressFn(mockDeviceId, {
      path: mockPath,
      verify: true,
      currency: mockCurrency,
      derivationMode: mockDerivationMode,
    });

    expect(mockSigner.showAddressAndPubKey).toHaveBeenCalledWith(mockPath);
    expect(mockSigner.getAddressAndPubKey).not.toHaveBeenCalled();

    expect(result).toEqual({
      path: mockPath,
      address: mockDerivedAddress,
      publicKey: mockPubKey,
    });
  });

  test("should derive address when not provided by device", async () => {
    const getAddressFn = setupTest(false, false);

    const result = await getAddressFn(mockDeviceId, {
      path: mockPath,
      verify: false,
      currency: mockCurrency,
      derivationMode: mockDerivationMode,
    });

    expect(addressHelpers.casperAddressFromPubKey).toHaveBeenCalledWith(
      expect.any(Buffer),
      KeyAlgorithm.SECP256K1,
    );

    expect(result).toEqual({
      path: mockPath,
      address: mockDerivedAddress,
      publicKey: mockPubKey,
    });
  });

  test("should propagate errors from the signer", async () => {
    mockSigner.getAddressAndPubKey = jest.fn().mockRejectedValue(new Error("Device disconnected"));
    const getAddressFn = getAddressResolver(mockSignerContext);

    await expect(
      getAddressFn(mockDeviceId, {
        path: mockPath,
        verify: false,
        currency: mockCurrency,
        derivationMode: mockDerivationMode,
      }),
    ).rejects.toThrow("Device disconnected");
  });
});
