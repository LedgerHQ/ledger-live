import { randomizeProviders } from "./randomizeProviders";
import type { MultiversXProvider } from "../types";

describe("randomizeProviders", () => {
  const createMockProvider = (contract: string): MultiversXProvider =>
    ({
      contract,
      serviceFee: "10",
      totalActiveStake: "1000000000000000000000",
      aprValue: 8.5,
      disabled: false,
      identity: {
        name: `Provider ${contract}`,
      },
    }) as MultiversXProvider;

  it("returns empty array when input is empty", () => {
    const result = randomizeProviders([]);

    expect(result).toEqual([]);
  });

  it("returns single provider unchanged", () => {
    const provider = createMockProvider("provider1");
    const result = randomizeProviders([provider]);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(provider);
  });

  it("returns all providers (same length)", () => {
    const providers = [
      createMockProvider("provider1"),
      createMockProvider("provider2"),
      createMockProvider("provider3"),
    ];

    const result = randomizeProviders(providers);

    expect(result).toHaveLength(3);
    providers.forEach(provider => {
      expect(result).toContain(provider);
    });
  });

  it("reorders providers by their assigned random sort key", () => {
    const providers = [
      createMockProvider("provider0"),
      createMockProvider("provider1"),
      createMockProvider("provider2"),
    ];

    const randomSpy = jest
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.5);

    try {
      const result = randomizeProviders(providers);

      expect(result.map(p => p.contract)).toEqual(["provider1", "provider2", "provider0"]);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("does not modify the original array", () => {
    const providers = [
      createMockProvider("provider1"),
      createMockProvider("provider2"),
      createMockProvider("provider3"),
    ];
    const originalContracts = providers.map(p => p.contract);

    randomizeProviders(providers);

    expect(providers.map(p => p.contract)).toEqual(originalContracts);
  });

  it("preserves all provider properties", () => {
    const provider = createMockProvider("provider1");
    provider.serviceFee = "15";
    provider.aprValue = 12.5;

    const result = randomizeProviders([provider]);

    expect(result[0].serviceFee).toBe("15");
    expect(result[0].aprValue).toBe(12.5);
    expect(result[0].identity?.name).toBe("Provider provider1");
  });
});
