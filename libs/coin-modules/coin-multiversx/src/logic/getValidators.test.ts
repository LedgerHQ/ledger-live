import { getValidators } from "./getValidators";

import type { MultiversXProvider } from "../types";

describe("getValidators", () => {
  const createProvider = (overrides: Partial<MultiversXProvider> = {}): MultiversXProvider =>
    ({
      contract: "erd1qqqqqqqqqqqqqpgqp699jngundfqw07d8jzkepucvpzush6k3wvqyc44rx",
      serviceFee: "10",
      totalActiveStake: "1000000000000000000000",
      aprValue: 8.5,
      disabled: false,
      identity: {
        key: "key123",
        name: "Ledger Staking",
        avatar: "https://example.com/logo.png",
        description: "Professional staking provider",
        twitter: "@ledger",
        url: "https://ledger.com",
      },
      ...overrides,
    }) as unknown as MultiversXProvider;

  it("returns empty Page when no providers exist", async () => {
    const mockApiClient = {
      getProviders: jest.fn().mockResolvedValue([]),
    };

    const result = await getValidators(mockApiClient as never);

    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });

  it("filters out disabled providers", async () => {
    const mockApiClient = {
      getProviders: jest
        .fn()
        .mockResolvedValue([
          createProvider({ contract: "active1", disabled: false }),
          createProvider({ contract: "disabled1", disabled: true }),
          createProvider({ contract: "active2", disabled: undefined }),
        ]),
    };

    const result = await getValidators(mockApiClient as never);

    expect(result.items).toHaveLength(2);
    expect(result.items.map(v => v.address)).toEqual(["active1", "active2"]);
    expect(result.next).toBeUndefined();
  });

  it("maps all active providers to Validators", async () => {
    const mockApiClient = {
      getProviders: jest
        .fn()
        .mockResolvedValue([
          createProvider({ contract: "validator1", identity: { name: "V1" } as never }),
          createProvider({ contract: "validator2", identity: { name: "V2" } as never }),
        ]),
    };

    const result = await getValidators(mockApiClient as never);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe("V1");
    expect(result.items[1].name).toBe("V2");
    expect(result.next).toBeUndefined();
  });

  it("returns Page with items array and next undefined", async () => {
    const mockApiClient = {
      getProviders: jest.fn().mockResolvedValue([createProvider()]),
    };

    const result = await getValidators(mockApiClient as never);

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.next).toBeUndefined();
  });

  describe("error handling", () => {
    it("wraps Error instances with context message", async () => {
      const originalError = new Error("Network timeout");
      originalError.stack = "Error: Network timeout\n    at network.js:123";
      const mockApiClient = {
        getProviders: jest.fn().mockRejectedValue(originalError),
      };

      await expect(getValidators(mockApiClient as never)).rejects.toThrow(
        "getValidators failed: Network timeout",
      );

      try {
        await getValidators(mockApiClient as never);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).cause).toBe(originalError);
        expect((error as Error).stack).toBe(originalError.stack);
      }
    });

    it("wraps non-Error values with string representation", async () => {
      const mockApiClient = {
        getProviders: jest.fn().mockRejectedValue("Simple string error"),
      };

      await expect(getValidators(mockApiClient as never)).rejects.toThrow(
        "getValidators failed: Simple string error",
      );
    });

    it("handles null error value", async () => {
      const mockApiClient = {
        getProviders: jest.fn().mockRejectedValue(null),
      };

      await expect(getValidators(mockApiClient as never)).rejects.toThrow(
        "getValidators failed: null",
      );
    });
  });
});
