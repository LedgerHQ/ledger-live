import { getAddress as getAddressResolver } from "./";

describe("getAddress resolver", () => {
  const mockDeviceId = "mock-device-id";
  const mockPath = "44'/784'/0'/0'/0'";

  it("should successfully resolve an address", async () => {
    // Mock address and public key data
    const mockAddress = Buffer.from("0x123abc");
    const mockPublicKey = Buffer.from("deadbeef");

    const mockSigner = {
      getPublicKey: jest.fn().mockResolvedValue({
        address: mockAddress,
        publicKey: mockPublicKey,
      }),
    };

    const mockSignerContext = jest
      .fn()
      .mockImplementation((deviceId, callback) => callback(mockSigner));

    const getAddress = getAddressResolver(mockSignerContext);

    const result = await getAddress(mockDeviceId, {
      currency: {
        type: "CryptoCurrency",
        id: "sui",
        coinType: 784,
        name: "Sui",
        managerAppName: "Sui",
        ticker: "SUI",
        scheme: "sui",
        color: "#000",
        family: "sui",
        units: [{ name: "Sui", code: "SUI", magnitude: 9 }],
        explorerViews: [],
      },
      path: "44'/784'/0'/0'/0'",
      derivationMode: "sui",
    });

    expect(result).toEqual({
      address: "0x" + mockAddress.toString("hex"),
      publicKey: mockPublicKey.toString("hex"),
      path: mockPath,
    });
  });

  it("should throw error when address is missing", async () => {
    const mockSigner = {
      getPublicKey: jest.fn().mockResolvedValue({
        address: null,
        publicKey: Buffer.from("deadbeef"),
      }),
    };

    const mockSignerContext = jest
      .fn()
      .mockImplementation((deviceId, callback) => callback(mockSigner));

    const getAddress = getAddressResolver(mockSignerContext);

    await expect(
      getAddress(mockDeviceId, {
        currency: {
          type: "CryptoCurrency",
          id: "sui",
          coinType: 784,
          name: "Sui",
          managerAppName: "Sui",
          ticker: "SUI",
          scheme: "sui",
          color: "#000",
          family: "sui",
          units: [{ name: "Sui", code: "SUI", magnitude: 9 }],
          explorerViews: [],
        },
        path: "44'/784'/0'/0'/0'",
        derivationMode: "sui",
      }),
    ).rejects.toThrow("Failed to get address from device");
  });

  it("should throw error when publicKey is missing", async () => {
    const mockSigner = {
      getPublicKey: jest.fn().mockResolvedValue({
        address: Buffer.from("0x123abc"),
        publicKey: null,
      }),
    };

    const mockSignerContext = jest
      .fn()
      .mockImplementation((deviceId, callback) => callback(mockSigner));

    const getAddress = getAddressResolver(mockSignerContext);

    await expect(
      getAddress(mockDeviceId, {
        currency: {
          type: "CryptoCurrency",
          id: "sui",
          coinType: 784,
          name: "Sui",
          managerAppName: "Sui",
          ticker: "SUI",
          scheme: "sui",
          color: "#000",
          family: "sui",
          units: [{ name: "Sui", code: "SUI", magnitude: 9 }],
          explorerViews: [],
        },
        path: "44'/784'/0'/0'/0'",
        derivationMode: "sui",
      }),
    ).rejects.toThrow("Failed to get address from device");
  });
});
