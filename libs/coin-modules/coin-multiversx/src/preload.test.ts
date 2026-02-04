import {
  getCurrentMultiversXPreloadData,
  setMultiversXPreloadData,
  getMultiversXPreloadDataUpdates,
  getPreloadStrategy,
  preload,
  hydrate,
} from "./preload";
import type { MultiversXPreloadData, MultiversXProvider } from "./types";

// Mock the API module
jest.mock("./api", () => ({
  getProviders: jest.fn(),
}));

// Mock the logs module
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

import { getProviders } from "./api";

const mockGetProviders = getProviders as jest.MockedFunction<typeof getProviders>;

describe("preload", () => {
  const createMockProvider = (contract: string): MultiversXProvider =>
    ({
      contract,
      serviceFee: "10",
      totalActiveStake: "1000000000000000000000",
      aprValue: 8.5,
      disabled: false,
      identity: {
        name: `Provider ${contract}`,
        key: "key123",
        avatar: "https://example.com/avatar.png",
        description: "Test provider",
        location: "US",
        twitter: "@provider",
        url: "https://provider.com",
      },
    }) as MultiversXProvider;

  beforeEach(() => {
    // Reset to initial state
    setMultiversXPreloadData({ validators: [] });
    mockGetProviders.mockReset();
  });

  describe("getCurrentMultiversXPreloadData", () => {
    it("returns empty validators array initially", () => {
      const data = getCurrentMultiversXPreloadData();

      expect(data).toEqual({ validators: [] });
    });

    it("returns current preloaded data after set", () => {
      const newData: MultiversXPreloadData = {
        validators: [createMockProvider("provider1")],
      };

      // Subscribe to handle the observable emission
      const subscription = getMultiversXPreloadDataUpdates().subscribe(() => {});
      setMultiversXPreloadData(newData);
      subscription.unsubscribe();

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toHaveLength(1);
      expect(result.validators[0].contract).toBe("provider1");
    });
  });

  describe("setMultiversXPreloadData", () => {
    it("updates the preloaded data", () => {
      const newData: MultiversXPreloadData = {
        validators: [createMockProvider("provider1"), createMockProvider("provider2")],
      };

      // Subscribe to handle the observable emission
      const subscription = getMultiversXPreloadDataUpdates().subscribe(() => {});
      setMultiversXPreloadData(newData);
      subscription.unsubscribe();

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toHaveLength(2);
    });

    it("does not trigger update when setting same data", () => {
      const data: MultiversXPreloadData = { validators: [] };
      
      // First set to establish current data
      let updateCount = 0;
      const subscription = getMultiversXPreloadDataUpdates().subscribe(() => {
        updateCount++;
      });
      
      setMultiversXPreloadData(data);
      const countAfterFirstSet = updateCount;
      
      setMultiversXPreloadData(data); // Same reference - should not trigger

      subscription.unsubscribe();
      // Only first call should trigger, second should not
      expect(updateCount).toBe(countAfterFirstSet);
    });
  });

  describe("getMultiversXPreloadDataUpdates", () => {
    it("returns an observable", () => {
      const updates = getMultiversXPreloadDataUpdates();

      expect(updates).toBeDefined();
      expect(typeof updates.subscribe).toBe("function");
    });

    it("emits when data changes", done => {
      const newData: MultiversXPreloadData = {
        validators: [createMockProvider("provider1")],
      };

      const subscription = getMultiversXPreloadDataUpdates().subscribe(data => {
        expect(data.validators).toHaveLength(1);
        expect(data.validators[0].contract).toBe("provider1");
        subscription.unsubscribe();
        done();
      });

      setMultiversXPreloadData(newData);
    });
  });

  describe("getPreloadStrategy", () => {
    it("returns preload max age of 30 minutes", () => {
      const strategy = getPreloadStrategy();

      expect(strategy.preloadMaxAge).toBe(30 * 60 * 1000); // 30 minutes in ms
    });
  });

  describe("preload", () => {
    it("fetches providers and returns them", async () => {
      const providers = [createMockProvider("provider1"), createMockProvider("provider2")];
      mockGetProviders.mockResolvedValue(providers);

      const result = await preload();

      expect(mockGetProviders).toHaveBeenCalled();
      expect(result.validators).toEqual(providers);
    });

    it("returns empty validators when getProviders returns undefined", async () => {
      mockGetProviders.mockResolvedValue(undefined as any);

      const result = await preload();

      expect(result.validators).toEqual([]);
    });

    it("returns empty validators when getProviders returns null", async () => {
      mockGetProviders.mockResolvedValue(null as any);

      const result = await preload();

      expect(result.validators).toEqual([]);
    });
  });

  describe("hydrate", () => {
    it("hydrates validators from raw data", () => {
      const rawData = {
        validators: [
          {
            contract: "erd1...",
            serviceFee: "10",
            aprValue: "8.5",
            automaticActivation: true,
            numNodes: "5",
            identity: {
              key: "key1",
              name: "Validator 1",
              avatar: null,
              description: "Test",
              location: null,
              twitter: "@test",
              url: "https://test.com",
            },
          },
        ],
      };

      hydrate(rawData);

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toHaveLength(1);
      expect(result.validators[0].contract).toBe("erd1...");
      expect(result.validators[0].aprValue).toBe(8.5);
      expect(result.validators[0].automaticActivation).toBe(true);
    });

    it("handles empty data", () => {
      hydrate({});

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toEqual([]);
    });

    it("handles null data", () => {
      hydrate(null);

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toEqual([]);
    });

    it("handles undefined data", () => {
      hydrate(undefined);

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toEqual([]);
    });

    it("handles data without validators array", () => {
      hydrate({ someOtherField: "value" });

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators).toEqual([]);
    });

    it("converts boolean fields correctly", () => {
      const rawData = {
        validators: [
          {
            contract: "erd1...",
            automaticActivation: 1,
            changeableServiceFee: "true",
            checkCapOnRedelegate: false,
            featured: null,
            disabled: undefined,
            identity: {
              key: "key1",
              name: "Validator",
            },
          },
        ],
      };

      hydrate(rawData);

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators[0].automaticActivation).toBe(true);
      expect(result.validators[0].changeableServiceFee).toBe(true);
      expect(result.validators[0].checkCapOnRedelegate).toBe(false);
      expect(result.validators[0].featured).toBe(false);
      expect(result.validators[0].disabled).toBe(false);
    });

    it("converts number fields correctly", () => {
      const rawData = {
        validators: [
          {
            contract: "erd1...",
            aprValue: "12.5",
            createdNonce: "100",
            numNodes: "10",
            numUsers: "500",
            unBondPeriod: "7",
            identity: {
              key: "key1",
              name: "Validator",
            },
          },
        ],
      };

      hydrate(rawData);

      const result = getCurrentMultiversXPreloadData();
      expect(result.validators[0].aprValue).toBe(12.5);
      expect(result.validators[0].createdNonce).toBe(100);
      expect(result.validators[0].numNodes).toBe(10);
      expect(result.validators[0].numUsers).toBe(500);
      expect(result.validators[0].unBondPeriod).toBe(7);
    });
  });
});
