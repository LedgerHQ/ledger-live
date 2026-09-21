import {
  buildStorageProbeReading,
  formatStorageProbeReading,
  utf8ByteLength,
} from "../storageProbeReading";

describe("storageProbeReading", () => {
  describe("buildStorageProbeReading", () => {
    it("counts keys and is stable across input order", () => {
      const a = buildStorageProbeReading([
        ["user", "1"],
        ["settings", "2"],
      ]);
      const b = buildStorageProbeReading([
        ["settings", "2"],
        ["user", "1"],
      ]);

      expect(a.totalKeys).toBe(2);
      expect(a.totalHash).toBe(b.totalHash);
    });

    it("detects a single changed value in the total hash", () => {
      const before = buildStorageProbeReading([
        ["user", "1"],
        ["settings", "2"],
      ]);
      const after = buildStorageProbeReading([
        ["user", "1"],
        ["settings", "3"],
      ]);

      expect(before.totalHash).not.toBe(after.totalHash);
    });

    it("detects a missing key even when total count coincidentally matches another namespace", () => {
      const before = buildStorageProbeReading([
        ["wallet", "a"],
        ["market", "b"],
      ]);
      // wallet namespace silently dropped, market namespace duplicated - same total count
      const after = buildStorageProbeReading([
        ["market", "b"],
        ["market2", "b"],
      ]);

      expect(before.totalKeys).toBe(after.totalKeys);
      expect(before.totalHash).not.toBe(after.totalHash);

      const beforeWallet = before.groups.find(g => g.prefix === "wallet");
      const afterWallet = after.groups.find(g => g.prefix === "wallet");
      expect(beforeWallet).toBeDefined();
      expect(afterWallet).toBeUndefined();
    });

    it("groups by first path segment and hashes each group independently", () => {
      const reading = buildStorageProbeReading([
        ["ns/a", "1"],
        ["ns/b", "2"],
        ["other", "3"],
      ]);

      const nsGroup = reading.groups.find(g => g.prefix === "ns");
      const otherGroup = reading.groups.find(g => g.prefix === "other");

      expect(nsGroup?.count).toBe(2);
      expect(otherGroup?.count).toBe(1);
      expect(nsGroup?.hash).not.toBe(otherGroup?.hash);
    });

    it("treats a flat, unprefixed key as its own single-member group", () => {
      const reading = buildStorageProbeReading([["wallet", "1"]]);
      expect(reading.groups).toEqual([{ prefix: "wallet", count: 1, hash: expect.any(String) }]);
    });

    it("returns at most the 20 largest keys by byte size, largest first", () => {
      const entries: [string, string][] = Array.from({ length: 25 }, (_, i) => [
        `key${i}`,
        "x".repeat(i),
      ]);
      const reading = buildStorageProbeReading(entries);

      expect(reading.largestKeys).toHaveLength(20);
      expect(reading.largestKeys[0].key).toBe("key24");
      expect(reading.largestKeys[0].sizeBytes).toBe(24);
      const sizes = reading.largestKeys.map(k => k.sizeBytes);
      expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    });

    it("treats a null value like an empty string without throwing", () => {
      const reading = buildStorageProbeReading([["user", null]]);
      expect(reading.totalKeys).toBe(1);
      expect(reading.largestKeys[0].sizeBytes).toBe(0);
    });
  });

  describe("utf8ByteLength", () => {
    it("counts ASCII as 1 byte per char", () => {
      expect(utf8ByteLength("abc")).toBe(3);
    });

    it("counts multi-byte characters correctly", () => {
      expect(utf8ByteLength("é")).toBe(2);
      expect(utf8ByteLength("€")).toBe(3);
      expect(utf8ByteLength("😀")).toBe(4);
    });
  });

  describe("formatStorageProbeReading", () => {
    it("never includes raw values, only keys/sizes/hashes/counts", () => {
      const secretValue = "super-secret-seed-phrase-value";
      const reading = buildStorageProbeReading([["wallet", secretValue]]);
      const text = formatStorageProbeReading(reading);

      expect(text).not.toContain(secretValue);
      expect(text).toContain("Total keys: 1");
      expect(text).toContain("wallet");
    });
  });
});
