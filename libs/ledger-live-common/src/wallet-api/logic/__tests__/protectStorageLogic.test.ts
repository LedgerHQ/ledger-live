import { protectStorageLogic } from "../storage";
import { AppManifest } from "../../types";

describe("protectStorageLogic", () => {
  const manifestBase = {
    id: "my-live-app",
    name: "Test App",
  } as AppManifest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows access when storeId === manifest.id", () => {
    const manifest = { ...manifestBase };
    const handler = jest.fn().mockReturnValue("ok");
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "my-live-app" };

    const result = wrapped(args);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(args);
    expect(result).toBe("ok");
  });

  it("allows access when storeId is in manifest.storage", () => {
    const manifest = { ...manifestBase, storage: ["allowed-store"] };
    const handler = jest.fn().mockReturnValue("done");
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "allowed-store" };

    const result = wrapped(args);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(args);
    expect(result).toBe("done");
  });

  it("throws when storeId is not permitted", () => {
    const manifest = { ...manifestBase, storage: ["allowed-store"] };
    const handler = jest.fn();
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "forbidden-store" };

    expect(() => wrapped(args)).toThrow(
      `Live App "my-live-app" is not permitted to access storage "forbidden-store".`,
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("throws when storeId is not permitted and manifest.storage is missing", () => {
    const manifest = { ...manifestBase, storage: undefined };
    const handler = jest.fn();
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "another-store" };

    expect(() => wrapped(args)).toThrow(
      `Live App "my-live-app" is not permitted to access storage "another-store".`,
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by the handler", () => {
    const manifest = { ...manifestBase, storage: ["allowed-store"] };
    const handler = jest.fn(() => {
      throw new Error("Handler failed");
    });
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "allowed-store" };

    expect(() => wrapped(args)).toThrow("Handler failed");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports async handler returning Promise", async () => {
    const manifest = { ...manifestBase, storage: ["allowed-store"] };
    const handler = jest.fn(async () => "async-ok");
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "allowed-store" };

    const result = await wrapped(args);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result).toBe("async-ok");
  });

  it("rejects Promise when async handler throws", async () => {
    const manifest = { ...manifestBase, storage: ["allowed-store"] };
    const handler = jest.fn(async () => {
      throw new Error("Async boom");
    });
    const wrapped = protectStorageLogic(manifest, handler);

    const args = { key: "k", storeId: "allowed-store" };

    await expect(wrapped(args)).rejects.toThrow("Async boom");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
