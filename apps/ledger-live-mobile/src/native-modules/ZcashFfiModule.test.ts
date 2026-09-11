// `NativeModules` is read once at import time, so each case installs (or
// removes) the native module and re-requires the wrapper. The mock object is
// stable across `resetModules` because the factory closes over it.
const mockNativeModules: Record<string, unknown> = {};

jest.mock("react-native", () => ({ NativeModules: mockNativeModules }));

const UFVK = "uview1zkk7f8hp2m5v09kq7h29vkgngwhhvgy2ey32cy5j0kp69g7ju2vq";
const ADDRESS = "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5";

function load(nativeModule?: unknown) {
  jest.resetModules();
  if (nativeModule === undefined) delete mockNativeModules.ZcashFfiModule;
  else mockNativeModules.ZcashFfiModule = nativeModule;
  return require("./ZcashFfiModule") as typeof import("./ZcashFfiModule");
}

describe("availability", () => {
  it("reports unavailable when the build links no native library", () => {
    expect(load().isZcashFfiAvailable()).toBe(false);
  });

  it("reports available once the native module is present", () => {
    expect(load({ deriveOrchardAddress: jest.fn() }).isZcashFfiAvailable()).toBe(true);
  });
});

describe("deriveOrchardAddress", () => {
  it("returns the address from the native binding", async () => {
    const deriveOrchardAddress = jest.fn().mockResolvedValue(ADDRESS);
    const subject = load({ deriveOrchardAddress });

    await expect(subject.deriveOrchardAddress(UFVK)).resolves.toBe(ADDRESS);
    expect(deriveOrchardAddress).toHaveBeenCalledWith(UFVK);
  });

  it("fails with ZCASH_FFI_UNAVAILABLE rather than a TypeError when unlinked", async () => {
    const subject = load();

    await expect(subject.deriveOrchardAddress(UFVK)).rejects.toMatchObject({
      name: "ZcashFfiError",
      code: "ZCASH_FFI_UNAVAILABLE",
    });
  });

  it.each([
    "ZCASH_FFI_CRYPTO",
    "ZCASH_FFI_INVALID_UTF8",
    "ZCASH_FFI_PANIC",
    "ZCASH_FFI_NULL_ARG",
    "ZCASH_FFI_INTERIOR_NUL",
  ])("preserves the %s status the C ABI reported", async code => {
    const rejection = Object.assign(new Error("native failure"), { code });
    const subject = load({ deriveOrchardAddress: jest.fn().mockRejectedValue(rejection) });

    await expect(subject.deriveOrchardAddress(UFVK)).rejects.toMatchObject({
      code,
      message: "native failure",
    });
  });

  it("falls back to ZCASH_FFI_UNKNOWN for a status it does not recognise", async () => {
    // A newer native library, or a platform error that never crossed the C ABI.
    const rejection = Object.assign(new Error("boom"), { code: "ESOMETHINGELSE" });
    const subject = load({ deriveOrchardAddress: jest.fn().mockRejectedValue(rejection) });

    await expect(subject.deriveOrchardAddress(UFVK)).rejects.toMatchObject({
      code: "ZCASH_FFI_UNKNOWN",
      message: "boom",
    });
  });

  it("survives a rejection that is not an Error at all", async () => {
    const subject = load({ deriveOrchardAddress: jest.fn().mockRejectedValue("just a string") });

    await expect(subject.deriveOrchardAddress(UFVK)).rejects.toMatchObject({
      code: "ZCASH_FFI_UNKNOWN",
      message: "Zcash FFI call failed",
    });
  });

  it("never puts viewing-key material in the error it raises", async () => {
    // A UFVK exposes the account's whole history: it must not reach a log or a
    // crash report through an error message.
    const rejection = Object.assign(new Error("invalid UFVK"), { code: "ZCASH_FFI_CRYPTO" });
    const subject = load({ deriveOrchardAddress: jest.fn().mockRejectedValue(rejection) });

    const error = await subject.deriveOrchardAddress(UFVK).then(
      () => new Error("the call unexpectedly succeeded"),
      (raised: Error) => raised,
    );

    // Assert we are inspecting a real rejection: without this the test would
    // pass vacuously if the call ever started succeeding.
    expect(error).toMatchObject({ code: "ZCASH_FFI_CRYPTO" });
    expect(JSON.stringify({ message: error.message, stack: error.stack })).not.toContain(
      UFVK.slice(10, 40),
    );
  });
});
