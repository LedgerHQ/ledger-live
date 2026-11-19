import { StorageLockedError } from "@shared/storage";
import { describeLockedStorageContract, describeStorageContract } from "@shared/storage/testing";
import { createElectronStorage, type ElectronDbBridge } from "../createElectronStorage";

const copy = (value: unknown) =>
  value === undefined ? undefined : JSON.parse(JSON.stringify(value));

function createFakeBridge(): jest.Mocked<ElectronDbBridge> {
  const namespaces = new Map<string, Map<string, unknown>>();
  const namespace = (ns: string) => {
    if (!namespaces.has(ns)) namespaces.set(ns, new Map());
    return namespaces.get(ns)!;
  };
  return {
    getKey: jest.fn(async (ns, keyPath) => copy(namespace(ns).get(keyPath))),
    setKey: jest.fn(async (ns, keyPath, value) => {
      namespace(ns).set(keyPath, copy(value));
    }),
  };
}

describeStorageContract("electron", () => createElectronStorage({ bridge: createFakeBridge() }));

describeLockedStorageContract("electron", () => {
  const bridge = createFakeBridge();
  void bridge.setKey("app", "accounts", "ciphertext");
  void bridge.setKey("app", "history", { lastSeenOperationDate: null });
  return {
    storage: createElectronStorage({ bridge, encryptedKeys: ["accounts"] }),
    encryptedKey: "accounts",
    plainKey: "history",
  };
});

describe("createElectronStorage", () => {
  it("reads and writes in the app namespace", async () => {
    const bridge = createFakeBridge();
    const storage = createElectronStorage({ bridge });

    await storage.set("history", { lastSeenOperationDate: null });
    await storage.get("history");

    expect(bridge.setKey).toHaveBeenCalledWith("app", "history", { lastSeenOperationDate: null });
    expect(bridge.getKey).toHaveBeenCalledWith("app", "history");
  });

  it("rejects an empty key, which the bridge reads as the whole namespace", async () => {
    const bridge = createFakeBridge();
    const storage = createElectronStorage({ bridge });

    await expect(storage.get("")).rejects.toThrow(RangeError);
    expect(bridge.getKey).not.toHaveBeenCalled();
  });

  it("reads a decrypted value of an encrypted key", async () => {
    const bridge = createFakeBridge();
    await bridge.setKey("app", "accounts", [{ data: { id: "a" }, version: 3 }]);
    const storage = createElectronStorage({ bridge, encryptedKeys: ["accounts"] });

    await expect(storage.get("accounts")).resolves.toEqual([{ data: { id: "a" }, version: 3 }]);
  });

  it("reads a string as usual when the key is not encrypted", async () => {
    const bridge = createFakeBridge();
    await bridge.setKey("app", "accounts", "a string");
    const storage = createElectronStorage({ bridge });

    await expect(storage.get("accounts")).resolves.toBe("a string");
  });

  it("resolves set only when the bridge has saved the file", async () => {
    const bridge = createFakeBridge();
    let saved = false;
    bridge.setKey.mockImplementationOnce(async () => {
      await Promise.resolve();
      saved = true;
    });
    const storage = createElectronStorage({ bridge });

    await storage.set("history", { lastSeenOperationDate: null });

    expect(saved).toBe(true);
  });

  it("throws StorageLockedError with the key only", async () => {
    const bridge = createFakeBridge();
    await bridge.setKey("app", "accounts", "ciphertext");
    const storage = createElectronStorage({ bridge, encryptedKeys: ["accounts"] });

    await expect(storage.get("accounts")).rejects.toEqual(new StorageLockedError("accounts"));
  });
});
