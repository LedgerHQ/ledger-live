import type { StoragePort } from "../StoragePort";

const ROUND_TRIP_VALUES: Array<[string, unknown]> = [
  ["an object", { lastSeenOperationDate: "2024-01-02T03:04:05.000Z" }],
  ["an object with a null field", { lastSeenOperationDate: null }],
  ["a string", "a value"],
  ["a number", 42],
  ["a boolean", false],
  ["an array", [1, "two", { three: 3 }]],
];

export function describeStorageContract(name: string, createAdapter: () => StoragePort): void {
  describe(`${name} storage contract`, () => {
    let storage: StoragePort;

    beforeEach(() => {
      storage = createAdapter();
    });

    it("returns undefined for a missing key", async () => {
      await expect(storage.get("missing")).resolves.toBeUndefined();
    });

    it.each(ROUND_TRIP_VALUES)("returns %s after set", async (_label, value) => {
      await storage.set("key", value);
      await expect(storage.get("key")).resolves.toEqual(value);
    });

    it("returns the last value after an overwrite", async () => {
      await storage.set("key", { a: 1 });
      await storage.set("key", { a: 2 });
      await expect(storage.get("key")).resolves.toEqual({ a: 2 });
    });

    it("keeps keys apart", async () => {
      await storage.set("first", 1);
      await storage.set("second", 2);
      await expect(storage.get("first")).resolves.toBe(1);
    });
  });
}
