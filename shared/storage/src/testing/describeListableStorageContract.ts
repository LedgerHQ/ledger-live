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
      await expect(storage.keys("items.entry.")).resolves.toEqual([]);
    });

    it("lists only the keys that start with the prefix", async () => {
      await storage.set("items.entry.a", 1);
      await storage.set("items.entry.b", 2);
      await storage.set("items.order", ["a", "b"]);

      const keys = await storage.keys("items.entry.");

      expect([...keys].sort((a, b) => a.localeCompare(b))).toEqual([
        "items.entry.a",
        "items.entry.b",
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
      await storage.set("items.entry.a", 1);
      await storage.remove("items.entry.a");
      await expect(storage.keys("items.entry.")).resolves.toEqual([]);
    });
  });
}
