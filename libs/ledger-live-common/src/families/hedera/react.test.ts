/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getCurrentHederaPreloadData } from "@ledgerhq/coin-hedera/preload-data";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { renderHook } from "@testing-library/react";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { liveConfig } from "../../config/sharedConfig";
import { getCryptoCurrencyById } from "../../currencies";
import * as hooks from "./react";
import type { HederaAccount, HederaDelegation } from "./types";

const localCache: Record<string, unknown> = {};
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },
  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});

describe("hedera/react", () => {
  const currency = getCryptoCurrencyById("hedera");

  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
    jest.spyOn(apiClient, "getNodes").mockResolvedValue([
      {
        description: "Hosted by LG | Seoul, South Korea",
        node_id: 0,
        node_account_id: "0.0.3",
        stake: 45000000000000000,
        stake_rewarded: 86596417100000000,
        min_stake: 0,
        max_stake: 45000000000000000,
        reward_rate_start: 3500,
      },
      {
        description: "Hosted by Swirlds | Iowa, USA",
        node_id: 1,
        node_account_id: "0.0.4",
        stake: 45000000000000000,
        stake_rewarded: 88990261300000000,
        min_stake: 0,
        max_stake: 45000000000000000,
        reward_rate_start: 4000,
      },
      {
        description: "Hosted for Wipro | Amsterdam, Netherlands",
        node_id: 3,
        node_account_id: "0.0.6",
        stake: 45000000000000000,
        stake_rewarded: 21477855400000000,
        min_stake: 0,
        max_stake: 45000000000000000,
        reward_rate_start: 5000,
      },
    ]);
  });

  describe("useHederaPreloadData", () => {
    beforeEach(async () => {
      const { prepare } = setup();
      await prepare();
    });

    it("should return preloaded data", async () => {
      const { result } = renderHook(() => hooks.useHederaPreloadData(currency));
      const data = getCurrentHederaPreloadData(currency);

      expect(result.current).toStrictEqual(data);
    });
  });

  describe("useHederaValidators", () => {
    beforeEach(async () => {
      const { prepare } = setup();
      await prepare();
    });

    it("should return all validators when no search query", () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency));
      const data = getCurrentHederaPreloadData(currency);

      expect(result.current).toEqual(data.validators);
    });

    it("should return all validators when search query is empty string", () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency, ""));
      const data = getCurrentHederaPreloadData(currency);

      expect(result.current).toEqual(data.validators);
    });

    it("should filter validators by name", () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency, "Swirlds"));

      expect(result.current.length).toBeGreaterThan(0);
      result.current.forEach(validator => {
        expect(validator.name.toLowerCase()).toContain("swirlds");
      });
    });

    it("should filter validators by node ID", () => {
      const data = getCurrentHederaPreloadData(currency);
      const firstValidator = data.validators[0];

      if (firstValidator) {
        const { result } = renderHook(() =>
          hooks.useHederaValidators(currency, firstValidator.nodeId.toString()),
        );

        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current.some(v => v.nodeId === firstValidator.nodeId)).toBe(true);
      }
    });

    it("should return empty array when no validators match search", () => {
      const { result } = renderHook(() =>
        hooks.useHederaValidators(currency, "nonexistingvalidator"),
      );

      expect(result.current).toEqual([]);
    });

    it("should be case insensitive when filtering", () => {
      const { result: upperResult } = renderHook(() =>
        hooks.useHederaValidators(currency, "SWIRLDS"),
      );
      const { result: lowerResult } = renderHook(() =>
        hooks.useHederaValidators(currency, "swirlds"),
      );

      expect(upperResult.current.length).toEqual(lowerResult.current.length);
    });
  });

  describe("useHederaEnrichedDelegation", () => {
    const mockAccount = {
      type: "Account",
      id: "mock-account-id",
      currency,
      balance: new BigNumber(1000000),
      spendableBalance: new BigNumber(1000000),
      hederaResources: {
        delegation: null,
      },
    } as HederaAccount;

    beforeEach(async () => {
      const { prepare } = setup();
      await prepare();
    });

    it("should enrich delegation with validator data", () => {
      const data = getCurrentHederaPreloadData(currency);
      const validator = data.validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: validator.nodeId,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      expect(result.current).toEqual({
        nodeId: validator.nodeId,
        delegated: delegation.delegated,
        pendingReward: delegation.pendingReward,
        status: "active",
        validator: {
          name: validator.name,
          address: validator.address,
          addressChecksum: validator.addressChecksum,
          nodeId: validator.nodeId,
          minStake: validator.minStake,
          maxStake: validator.maxStake,
          activeStake: validator.activeStake,
          activeStakePercentage: validator.activeStakePercentage,
          overstaked: validator.overstaked,
        },
      });
    });

    it("should handle delegation with non-existent validator", () => {
      const delegation: HederaDelegation = {
        nodeId: 999999,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      expect(result.current).toEqual({
        nodeId: delegation.nodeId,
        delegated: delegation.delegated,
        pendingReward: delegation.pendingReward,
        status: "inactive",
        validator: {
          name: "",
          address: "",
          addressChecksum: null,
          nodeId: delegation.nodeId,
          minStake: new BigNumber(0),
          maxStake: new BigNumber(0),
          activeStake: new BigNumber(0),
          activeStakePercentage: new BigNumber(0),
          overstaked: false,
        },
      });
    });

    it("should handle delegation with zero staked amount", () => {
      const data = getCurrentHederaPreloadData(currency);
      const validator = data.validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: validator.nodeId,
        delegated: new BigNumber(0),
        pendingReward: new BigNumber(0),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      expect(result.current.delegated).toEqual(new BigNumber(0));
      expect(result.current.validator.nodeId).toEqual(validator.nodeId);
    });

    it("should handle delegation with pending rewards", () => {
      const data = getCurrentHederaPreloadData(currency);
      const validator = data.validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: validator.nodeId,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(1500),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      expect(result.current.pendingReward).toEqual(new BigNumber(1500));
    });
  });
});

function setup(): {
  prepare: () => Promise<unknown>;
} {
  const currency = getCryptoCurrencyById("hedera");

  return {
    prepare: async () => cache.prepareCurrency(currency),
  };
}
