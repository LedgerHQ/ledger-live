import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import getAddressResolver from "./getAddress";

describe("getAddress", () => {
  const mockCurrency = getMockedCurrency();
  const mockDeviceId = "mock-device-id";
  const mockPath = "44'/683'/0";
  const mockAddress = Buffer.from("aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7p");
  const derivationMode = "aleo";

  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue(mockAddress),
  };

  const mockSignerContext = jest
    .fn()
    .mockImplementation((_deviceId, callback) => callback(mockSigner));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully resolve an address", async () => {
    const getAddress = getAddressResolver(mockSignerContext);

    const result = await getAddress(mockDeviceId, {
      currency: mockCurrency,
      path: mockPath,
      verify: true,
      derivationMode,
    });

    expect(mockSigner.getAddress).toHaveBeenCalledWith(mockPath, true);
    expect(result).toEqual({
      address: mockAddress.toString(),
      publicKey: "",
      path: mockPath,
    });
  });

  it("should pass the verify flag correctly", async () => {
    const getAddress = getAddressResolver(mockSignerContext);

    const result = await getAddress(mockDeviceId, {
      currency: mockCurrency,
      path: mockPath,
      verify: false,
      derivationMode,
    });

    expect(mockSigner.getAddress).toHaveBeenCalledWith(mockPath, false);
    expect(result.address).toBe(mockAddress.toString());
  });

  it("should handle errors from signer", async () => {
    const errorSigner = {
      getAddress: jest.fn().mockRejectedValue(new Error("Device error")),
    };

    const errorSignerContext = jest
      .fn()
      .mockImplementation((_deviceId, callback) => callback(errorSigner));

    const getAddress = getAddressResolver(errorSignerContext);

    await expect(
      getAddress(mockDeviceId, {
        currency: mockCurrency,
        path: mockPath,
        derivationMode,
      }),
    ).rejects.toThrow("Device error");
  });
});
