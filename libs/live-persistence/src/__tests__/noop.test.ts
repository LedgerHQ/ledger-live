import { createNoopCacheAdapter } from "../implementations/noop";

describe("No-op Cache Adapter", () => {
  const adapter = createNoopCacheAdapter({
    ttl: 3600,
    refreshTtl: 14400,
    version: 1,
  });

  it("should always return null for get operations", async () => {
    await adapter.set("key", "value" as any);
    expect(await adapter.get("key")).toBeNull();
  });

  it("should not persist data", async () => {
    await adapter.set("key1", "value1" as any);
    await adapter.set("key2", "value2" as any);

    expect(await adapter.get("key1")).toBeNull();
    expect(await adapter.get("key2")).toBeNull();
  });

  it("should always return 0 for cleanup", async () => {
    await adapter.set("key", "value" as any);
    const cleaned = await adapter.cleanupExpired();
    expect(cleaned).toBe(0);
  });

  it("should have correct readonly properties", () => {
    expect(adapter.ttl).toBe(3600);
    expect(adapter.refreshTtl).toBe(14400);
    expect(adapter.version).toBe(1);
  });

  it("should handle all operations without errors", async () => {
    // These should not throw
    await adapter.set("key", "value" as any);
    await adapter.get("key");
    await adapter.delete("key");
    await adapter.clear();
    await adapter.cleanupExpired();
  });
});
