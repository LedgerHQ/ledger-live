import { randomizeProviders, SortedValidatorType } from "./randomizeProviders";
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
    // All original providers should be present
    providers.forEach(provider => {
      expect(result).toContain(provider);
    });
  });

  it("randomizes the order of providers", () => {
    // Create many providers to increase chance of randomization being visible
    const providers = Array.from({ length: 20 }, (_, i) => createMockProvider(`provider${i}`));

    // Run multiple times and check if order changes at least once
    const originalOrder = providers.map(p => p.contract);
    let orderChanged = false;

    for (let i = 0; i < 10; i++) {
      const result = randomizeProviders([...providers]);
      const resultOrder = result.map(p => p.contract);

      if (JSON.stringify(originalOrder) !== JSON.stringify(resultOrder)) {
        orderChanged = true;
        break;
      }
    }

    // With 20 providers and 10 attempts, it's statistically near-certain to get a different order
    expect(orderChanged).toBe(true);
  });

  it("does not modify the original array", () => {
    const providers = [
      createMockProvider("provider1"),
      createMockProvider("provider2"),
      createMockProvider("provider3"),
    ];
    const originalContracts = providers.map(p => p.contract);

    randomizeProviders(providers);

    // Original array should be unchanged
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
