import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import getViewKeyResolver from "./getViewKey";

describe("getViewKey", () => {
  const mockCurrency = getMockedCurrency();
  const mockDeviceId = "mock-device-id";
  const mockPath = "44'/683'/0";
  const mockViewKey = Buffer.from("viewkey123");

  const mockSigner = {
    getViewKey: jest.fn().mockResolvedValue(mockViewKey),
  };

  const mockSignerContext = jest
    .fn()
    .mockImplementation((_deviceId, callback) => callback(mockSigner));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully resolve a view key", async () => {
    const getViewKey = getViewKeyResolver(mockSignerContext);

    const result = await getViewKey(mockDeviceId, {
      currency: mockCurrency,
      path: mockPath,
    });

    expect(mockSigner.getViewKey).toHaveBeenCalledWith(mockPath);
    expect(result).toEqual({
      viewKey: mockViewKey.toString(),
      path: mockPath,
    });
  });

  it("should handle errors from signer", async () => {
    const errorSigner = {
      getViewKey: jest.fn().mockRejectedValue(new Error("Device error")),
    };
    const errorSignerContext = jest
      .fn()
      .mockImplementation((_deviceId, callback) => callback(errorSigner));

    const getViewKey = getViewKeyResolver(errorSignerContext);

    await expect(
      getViewKey(mockDeviceId, {
        currency: mockCurrency,
        path: mockPath,
      }),
    ).rejects.toThrow("Device error");
  });
});
