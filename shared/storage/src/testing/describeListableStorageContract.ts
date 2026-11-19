import type { ListableStoragePort } from "../StoragePort";

export function describeListableStorageContract(
  name: string,
  createAdapter: () => ListableStoragePort,
): void {
  describe(`${name} listable storage contract`, () => {
    let storage: ListableStoragePort;

    beforeEach(() => {
      storage = createAdapter();
    });

    it("lists no key when nothing matches the prefix", async () => {
      await storage.set("other", 1);
      await expect(storage.keys("accounts.active.")).resolves.toEqual([]);
    });

    it("lists only the keys that start with the prefix", async () => {
      await storage.set("accounts.active.a", 1);
      await storage.set("accounts.active.b", 2);
      await storage.set("accounts.sort", ["a", "b"]);

      const keys = await storage.keys("accounts.active.");

      expect([...keys].sort((a, b) => a.localeCompare(b))).toEqual([
        "accounts.active.a",
        "accounts.active.b",
      ]);
    });

    it("returns undefined after remove", async () => {
      await storage.set("key", "value");
      await storage.remove("key");
      await expect(storage.get("key")).resolves.toBeUndefined();
    });

    it("does nothing when it removes a missing key", async () => {
      await expect(storage.remove("missing")).resolves.toBeUndefined();
    });

    it("does not list a removed key", async () => {
      await storage.set("accounts.active.a", 1);
      await storage.remove("accounts.active.a");
      await expect(storage.keys("accounts.active.")).resolves.toEqual([]);
    });
  });
}
