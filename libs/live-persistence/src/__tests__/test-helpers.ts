import type { CacheAdapter, CacheConfig } from "../types";

export interface CacheAdapterTestConfig<T = unknown> {
  name: string;
  createAdapter: (config: CacheConfig) => CacheAdapter<T>;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  useFakeTimers?: boolean;
  skipCleanupTests?: boolean;
}

export async function runCacheAdapterTests<T = unknown>(
  config: CacheAdapterTestConfig<T>,
): Promise<void> {
  const {
    name,
    createAdapter,
    setup,
    teardown,
    useFakeTimers = true,
    skipCleanupTests = false,
  } = config;

  describe(`${name} Cache Adapter`, () => {
    let adapter: CacheAdapter<T>;

    beforeAll(async () => {
      if (setup) await setup();
    });

    afterAll(async () => {
      if (teardown) await teardown();
    });

    beforeEach(() => {
      const testConfig: CacheConfig = {
        ttl: 3600, // 1 hour
        refreshTtl: 900, // 15 minutes
        version: 1,
      };
      adapter = createAdapter(testConfig);
      if (useFakeTimers) {
        jest.useFakeTimers();
      } else {
        // Increase timeout for tests that use real timers
        jest.setTimeout(10000); // 10 seconds
      }
    });

    afterEach(() => {
      if (useFakeTimers) {
        jest.useRealTimers();
      }
      // Clear any pending timeouts to prevent memory leaks
      jest.clearAllTimers();
    });

    describe("basic operations", () => {
      it("should return null for non-existent keys", async () => {
        const result = await adapter.get("non-existent-key");
        expect(result).toBeNull();
      });

      it("should store and retrieve data", async () => {
        const key = "test-key";
        const value = { test: "data" } as T;

        await adapter.set(key, value);
        const result = await adapter.get(key);

        expect(result).not.toBeNull();
        expect(result?.data).toEqual(value);
        expect(result?.version).toBe(1);
        expect(result?.ttl).toBe(3600000); // 3600 * 1000
      });

      it("should delete keys", async () => {
        const key = "delete-key";
        const value = { test: "data" } as T;

        await adapter.set(key, value);
        expect((await adapter.get(key))?.data).toEqual(value);

        await adapter.delete(key);
        expect(await adapter.get(key)).toBeNull();
      });

      it("should clear all data", async () => {
        await adapter.set("key1", "value1" as T);
        await adapter.set("key2", "value2" as T);

        expect((await adapter.get("key1"))?.data).toBe("value1");
        expect((await adapter.get("key2"))?.data).toBe("value2");

        await adapter.clear();

        expect(await adapter.get("key1")).toBeNull();
        expect(await adapter.get("key2")).toBeNull();
      });
    });

    describe("TTL functionality", () => {
      it("should expire data after TTL", async () => {
        const key = "expire-key";
        const value = { test: "data" } as T;

        // Create a new adapter with short TTL
        const shortTtlAdapter = createAdapter({
          ttl: 0.1, // 100ms TTL
          refreshTtl: 0.4,
          version: 1,
        });
        await shortTtlAdapter.set(key, value);
        expect((await shortTtlAdapter.get(key))?.data).toEqual(value);

        if (useFakeTimers) {
          jest.advanceTimersByTime(110); // Wait for expiration
        } else {
          await new Promise(resolve => setTimeout(resolve, 110)); // Wait for expiration
        }

        const result = await shortTtlAdapter.get(key);
        expect(result).toBeNull();
      });

      it("should not expire data before TTL", async () => {
        const key = "ttl-key";
        const value = { test: "data" } as T;

        await adapter.set(key, value);

        // Advance time by 30 minutes (less than TTL)
        if (useFakeTimers) {
          jest.advanceTimersByTime(30 * 60 * 1000);
        } else {
          await new Promise(resolve => setTimeout(resolve, 100)); // Just a small delay
        }

        const result = await adapter.get(key);
        expect(result?.data).toEqual(value);
      });

      it("should handle zero or negative TTL", async () => {
        const key = "zero-ttl-key";
        const value = { test: "data" } as T;

        // Create a new adapter with zero TTL
        const zeroTtlAdapter = createAdapter({
          ttl: 0,
          refreshTtl: 0,
          version: 1,
        });
        await zeroTtlAdapter.set(key, value);
        expect(await zeroTtlAdapter.get(key)).toBeNull();

        // Create a new adapter with negative TTL
        const negativeTtlAdapter = createAdapter({
          ttl: -1,
          refreshTtl: 0,
          version: 1,
        });
        await negativeTtlAdapter.set(key, value);
        expect(await negativeTtlAdapter.get(key)).toBeNull();
      });

      it("should respect refresh TTL", async () => {
        const key = "refresh-key";
        const value = { test: "data" } as T;

        await adapter.set(key, value);
        const result = await adapter.get(key);

        expect(result).not.toBeNull();
        expect(result?.refreshAt).toBeGreaterThan(result?.timestamp || 0);
        expect(result?.refreshAt).toBeLessThan(result?.expiresAt || Infinity);
      });
    });

    describe("version handling", () => {
      it("should store and retrieve version", async () => {
        const key = "version-key";
        const value = { test: "data" } as T;
        const version = 42;

        // Create a new adapter with specific version
        const versionAdapter = createAdapter({
          ttl: 3600,
          refreshTtl: 900,
          version: version,
        });
        await versionAdapter.set(key, value);
        const result = await versionAdapter.get(key);

        expect(result).not.toBeNull();
        expect(result?.version).toBe(version);
      });
    });

    describe("data types", () => {
      it("should handle different data types", async () => {
        const testData = [
          { key: "string-key", value: "hello" as T },
          { key: "number-key", value: 123 as T },
          { key: "boolean-key", value: true as T },
          { key: "object-key", value: { nested: "data" } as T },
          { key: "array-key", value: [1, 2, 3] as T },
          { key: "null-key", value: null as T },
        ];

        for (const { key, value } of testData) {
          await adapter.set(key, value);
          const result = await adapter.get(key);
          expect(result?.data).toEqual(value);
        }
      });
    });

    describe("cleanup functionality", () => {
      it("should cleanup expired entries", async () => {
        if (skipCleanupTests) {
          return;
        }
        // Create a new adapter with very short TTL for testing cleanup
        const shortTtlAdapter = createAdapter({
          ttl: 0.1, // Very short TTL
          refreshTtl: 0.4,
          version: 1,
        });

        await shortTtlAdapter.set("key1", "value1" as T);
        await shortTtlAdapter.set("key2", "value2" as T);
        await shortTtlAdapter.set("expire-key", "expired-value" as T);

        // Advance time past expiration
        if (useFakeTimers) {
          jest.advanceTimersByTime(200);
        } else {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const cleanedCount = await shortTtlAdapter.cleanupExpired();
        expect(typeof cleanedCount).toBe("number");
        expect(cleanedCount).toBeGreaterThanOrEqual(3); // All entries should be expired

        // All entries should be gone since they all expired
        expect(await shortTtlAdapter.get("expire-key")).toBeNull();
        expect(await shortTtlAdapter.get("key1")).toBeNull();
        expect(await shortTtlAdapter.get("key2")).toBeNull();
      });

      it("should return 0 when no expired entries", async () => {
        if (skipCleanupTests) {
          return;
        }
        await adapter.set("key1", "value1" as T);
        await adapter.set("key2", "value2" as T);

        const cleanedCount = await adapter.cleanupExpired();
        expect(cleanedCount).toBe(0);
      });
    });

    describe("eviction functionality", () => {
      it("should evict expired entries on access", async () => {
        // Create a new adapter with very short TTL (100ms)
        const shortTtlAdapter = createAdapter({
          ttl: 0.1,
          refreshTtl: 0.4,
          version: 1,
        });
        await shortTtlAdapter.set("expire-key", "expired-value" as T);

        // Advance time past expiration
        if (useFakeTimers) {
          jest.advanceTimersByTime(200);
        } else {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Access should trigger eviction
        const result = await shortTtlAdapter.get("expire-key");
        expect(result).toBeNull();
      });

      it("should evict multiple expired entries", async () => {
        // Create a new adapter with very short TTL for expired entries
        const shortTtlAdapter = createAdapter({
          ttl: 0.1,
          refreshTtl: 0.4,
          version: 1,
        });

        // Set multiple entries that will expire
        await shortTtlAdapter.set("expire1", "value1" as T);
        await shortTtlAdapter.set("expire2", "value2" as T);
        await shortTtlAdapter.set("expire3", "value3" as T);
        await adapter.set("keep", "value4" as T); // Long TTL

        // Advance time past expiration
        if (useFakeTimers) {
          jest.advanceTimersByTime(200);
        } else {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Access should trigger eviction
        expect(await shortTtlAdapter.get("expire1")).toBeNull();
        expect(await shortTtlAdapter.get("expire2")).toBeNull();
        expect(await shortTtlAdapter.get("expire3")).toBeNull();

        // Non-expired entry should remain
        expect((await adapter.get("keep"))?.data).toBe("value4");
      });
    });

    describe("interface compliance", () => {
      it("should return promises for all async methods", () => {
        expect(adapter.get("test")).toBeInstanceOf(Promise);
        expect(adapter.set("test", "value" as T)).toBeInstanceOf(Promise);
        expect(adapter.delete("test")).toBeInstanceOf(Promise);
        expect(adapter.clear()).toBeInstanceOf(Promise);
        expect(adapter.cleanupExpired()).toBeInstanceOf(Promise);
      });

      it("should handle concurrent operations", async () => {
        const promises: Promise<void>[] = [];
        for (let i = 0; i < 10; i++) {
          promises.push(adapter.set(`key${i}`, `value${i}` as T));
        }
        await Promise.all(promises);

        for (let i = 0; i < 10; i++) {
          const result = await adapter.get(`key${i}`);
          expect(result).not.toBeNull();
          expect(result?.data).toBe(`value${i}`);
        }
      });
    });
  });
}
