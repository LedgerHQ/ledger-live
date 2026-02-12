import resolver from "./getAddress";

describe("getAddress resolver", () => {
  const mockSignerContext = jest.fn();

  beforeEach(() => {
    mockSignerContext.mockReset();
  });

  it("should return address and public key from device (no verify)", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: any) =>
      fn({
        getAddressAndPubKey: jest.fn().mockResolvedValue({
          address: Buffer.from("addr-bytes"),
          publicKey: Buffer.from("pk-bytes"),
          principalText: "principal-text",
        }),
        showAddressAndPubKey: jest.fn(),
      }),
    );

    const getAddress = resolver(mockSignerContext as any);
    const result = await getAddress("device-1", { path: "44'/223'/0'/0/0", verify: false });

    expect(result.path).toBe("44'/223'/0'/0/0");
    expect(result.address).toBe(Buffer.from("addr-bytes").toString("hex"));
    expect(result.publicKey).toBe(Buffer.from("pk-bytes").toString("hex"));
    expect(result.principalText).toBe("principal-text");
  });

  it("should call showAddressAndPubKey when verify is true", async () => {
    const mockShow = jest.fn().mockResolvedValue({
      address: Buffer.from("addr"),
      publicKey: Buffer.from("pk"),
      principalText: "principal",
    });

    mockSignerContext.mockImplementation((_deviceId: string, fn: any) =>
      fn({
        getAddressAndPubKey: jest.fn(),
        showAddressAndPubKey: mockShow,
      }),
    );

    const getAddress = resolver(mockSignerContext as any);
    await getAddress("device-1", { path: "44'/223'/0'/0/0", verify: true });

    expect(mockShow).toHaveBeenCalledWith("44'/223'/0'/0/0");
  });

  it("should throw when address is missing", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: any) =>
      fn({
        getAddressAndPubKey: jest.fn().mockResolvedValue({
          address: null,
          publicKey: Buffer.from("pk"),
        }),
      }),
    );

    const getAddress = resolver(mockSignerContext as any);
    await expect(
      getAddress("device-1", { path: "44'/223'/0'/0/0", verify: false }),
    ).rejects.toThrow("Failed to get address from device");
  });

  it("should throw when publicKey is missing", async () => {
    mockSignerContext.mockImplementation((_deviceId: string, fn: any) =>
      fn({
        getAddressAndPubKey: jest.fn().mockResolvedValue({
          address: Buffer.from("addr"),
          publicKey: null,
        }),
      }),
    );

    const getAddress = resolver(mockSignerContext as any);
    await expect(
      getAddress("device-1", { path: "44'/223'/0'/0/0", verify: false }),
    ).rejects.toThrow("Failed to get address from device");
  });
});
