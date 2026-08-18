import { UpdateYourApp } from "@ledgerhq/ledger-wallet-framework/errors";
import { buildResilientIterateResult, isUpdateYourAppError } from "../../bridge/scanResilience";

describe("isUpdateYourAppError", () => {
  it("is true for an UpdateYourApp instance", () => {
    expect(isUpdateYourAppError(new UpdateYourApp(undefined, { managerAppName: "Celo" }))).toBe(
      true,
    );
  });

  it("is true for a plain object with name UpdateYourApp (post-serialization)", () => {
    expect(isUpdateYourAppError({ name: "UpdateYourApp" })).toBe(true);
  });

  it("is false for a different error", () => {
    expect(isUpdateYourAppError({ name: "TransportStatusError", statusCode: 0x6a80 })).toBe(false);
    expect(isUpdateYourAppError(new Error("boom"))).toBe(false);
    expect(isUpdateYourAppError(null)).toBe(false);
    expect(isUpdateYourAppError(undefined)).toBe(false);
  });
});

describe("buildResilientIterateResult", () => {
  const currency = { id: "celo" } as any;
  const scheme = "44'/60'/<account>'/0'/0'";
  const baseArgs = (index: number) => ({
    index,
    derivationsCache: {} as Record<string, any>,
    derivationScheme: scheme,
    derivationMode: "celoEvm" as any,
    currency,
    deviceId: "device-1",
  });
  const okResult = { address: "0xabc", publicKey: "pk", path: "p" };

  const makeIterate = (getAddressFn: any) => buildResilientIterateResult(getAddressFn)({} as any);

  it("passes a normal getAddress result through", async () => {
    const getAddressFn = jest.fn().mockResolvedValue(okResult);
    const iterate = await makeIterate(getAddressFn);
    await expect(iterate(baseArgs(0))).resolves.toEqual(okResult);
  });

  it("returns null when the signer reports UpdateYourApp (breaks the loop)", async () => {
    const getAddressFn = jest
      .fn()
      .mockRejectedValue(new UpdateYourApp(undefined, { managerAppName: "Celo" }));
    const iterate = await makeIterate(getAddressFn);
    await expect(iterate(baseArgs(1))).resolves.toBeNull();
  });

  it("rethrows any other error unchanged (skip is targeted)", async () => {
    const other = { name: "TransportStatusError", statusCode: 0x6a80 };
    const getAddressFn = jest.fn().mockRejectedValue(other);
    const iterate = await makeIterate(getAddressFn);
    await expect(iterate(baseArgs(1))).rejects.toEqual(other);
  });

  it("reuses a cached derivation instead of calling getAddress again", async () => {
    const getAddressFn = jest.fn().mockResolvedValue(okResult);
    const iterate = await makeIterate(getAddressFn);
    const args = baseArgs(0);
    args.derivationsCache["44'/60'/0'/0'/0':celoEvm"] = okResult;
    await expect(iterate(args)).resolves.toEqual(okResult);
    expect(getAddressFn).not.toHaveBeenCalled();
  });
});
