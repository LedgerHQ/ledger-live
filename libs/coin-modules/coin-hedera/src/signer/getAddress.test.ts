import resolver from "./getAddress";

describe("getAddress resolver", () => {
  it("returns a function that calls signerContext with the path and returns address/publicKey", async () => {
    const publicKey = "somePublicKey";
    const path = "44/3030/0/0/0";
    const deviceId = "device-1";

    const signerContext = jest.fn(
      async (_deviceId: string, fn: (signer: unknown) => Promise<string>) => {
        const signer = { getPublicKey: jest.fn().mockResolvedValue(publicKey) };
        return fn(signer);
      },
    );

    const getAddressFn = resolver(signerContext as never);
    const result = await getAddressFn(deviceId, { path } as never);

    expect(signerContext).toHaveBeenCalledTimes(1);
    expect(signerContext).toHaveBeenCalledWith(deviceId, expect.any(Function));
    expect(result).toEqual({
      path,
      address: publicKey,
      publicKey,
    });
  });

  it("passes the derivation path to signer.getPublicKey", async () => {
    const path = "44/3030/1/0/0";
    const deviceId = "device-2";
    const getPublicKey = jest.fn().mockResolvedValue("anotherKey");

    const signerContext = jest.fn(
      async (_deviceId: string, fn: (signer: unknown) => Promise<string>) => {
        return fn({ getPublicKey });
      },
    );

    const getAddressFn = resolver(signerContext as never);
    await getAddressFn(deviceId, { path } as never);

    expect(getPublicKey).toHaveBeenCalledTimes(1);
    expect(getPublicKey).toHaveBeenCalledWith(path);
  });
});
