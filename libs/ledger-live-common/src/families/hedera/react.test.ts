/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import React from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import hederaCoinConfig from "@ledgerhq/coin-hedera/config";
import { getCurrentHederaPreloadData } from "@ledgerhq/coin-hedera/preload-data";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { makeBridgeCacheSystem } from "../../bridge/cache";
import { liveConfig } from "../../config/sharedConfig";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import * as hooks from "./react";
import type { HederaAccount, HederaDelegation, HederaValidator } from "./types";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("hedera/react", () => {
  const currency = getCryptoCurrencyById("hedera");

  beforeAll(() => {
    LiveConfig.setConfig(liveConfig);
    hederaCoinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      useNetworkTimestamp: false,
      networkType: "mainnet",
      claimRewardsRecipient: "0.0.163372",
      ledgerNodeId: -1,
      tokenAssociationMinUsd: 0.05,
      apiUrls: {
        hgraph: "https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql",
        mirrorNode: "https://hedera.coin.ledger.com",
      },
    }));
  });

  beforeEach(() => {
    getHederaValidators.reset();
    jest.spyOn(apiClient, "getNodes").mockResolvedValue({
      nodes: [
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
      ],
      nextCursor: null,
    });
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
        const { result } = renderHook(() => hooks.useHederaValidators(currency, firstValidator.id));

        expect(result.current.length).toBeGreaterThan(0);
        expect(result.current.some(v => v.id === firstValidator.id)).toBe(true);
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
    } as unknown as HederaAccount;

    beforeEach(async () => {
      const { prepare } = setup();
      await prepare();
    });

    it("should enrich delegation with validator data", () => {
      const data = getCurrentHederaPreloadData(currency);
      const validator = data.validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
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
        status: "overstaked",
        validator: {
          name: validator.name,
          address: validator.address,
          addressChecksum: validator.addressChecksum,
          id: validator.id,
          minStake: validator.minStake,
          maxStake: validator.maxStake,
          activeStake: validator.activeStake,
          activeStakePercentage: validator.activeStakePercentage,
          overstaked: validator.overstaked,
          isLedgerNode: validator.isLedgerNode,
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
          id: String(delegation.nodeId),
          minStake: new BigNumber(0),
          maxStake: new BigNumber(0),
          activeStake: new BigNumber(0),
          activeStakePercentage: new BigNumber(0),
          overstaked: false,
          isLedgerNode: false,
        },
      });
    });

    it("should handle delegation with zero staked amount", () => {
      const data = getCurrentHederaPreloadData(currency);
      const validator = data.validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(0),
        pendingReward: new BigNumber(0),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      expect(result.current.delegated).toEqual(new BigNumber(0));
      expect(result.current.validator.id).toEqual(validator.id);
    });

    it("should handle delegation with pending rewards", () => {
      const data = getCurrentHederaPreloadData(currency);
      const validator = data.validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(1500),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      expect(result.current.pendingReward).toEqual(new BigNumber(1500));
    });
  });
  describe("hederaQueries.validatorsList", () => {
    it("should return all validators", async () => {
      const { result } = renderHook(
        () => useQuery(hooks.hederaQueries.validatorsList(currency.id)),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => expect(result.current.data).toHaveLength(3));
      // sortValidators puts the Ledger node first, then orders by active stake descending
      expect(result.current.data?.map(validator => validator.id)).toEqual(["1", "0", "3"]);
    });

    it("should surface an error when the validators fetch fails", async () => {
      jest.spyOn(apiClient, "getNodes").mockRejectedValueOnce(new Error("network down"));

      const { result } = renderHook(
        () => useQuery(hooks.hederaQueries.validatorsList(currency.id)),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("useHederaEnrichedDelegationV2", () => {
    const mockAccount = {
      type: "Account",
      id: "mock-account-id",
      currency,
      balance: new BigNumber(1000000),
      spendableBalance: new BigNumber(1000000),
      hederaResources: {
        delegation: null,
      },
    } as unknown as HederaAccount;

    let validators: HederaValidator[];

    beforeEach(async () => {
      validators = await getHederaValidators(currency.id);
    });

    it("should report loading:true before validators resolve, then loading:false once they do", async () => {
      const delegation: HederaDelegation = {
        nodeId: 999999,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it("should enrich delegation with validator data", async () => {
      const validator = validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() =>
        expect(result.current).toEqual({
          nodeId: delegation.nodeId,
          delegated: delegation.delegated,
          pendingReward: delegation.pendingReward,
          loading: false,
          error: null,
          status: "overstaked",
          validator: {
            name: validator.name,
            address: validator.address,
            addressChecksum: validator.addressChecksum,
            id: validator.id,
            minStake: validator.minStake,
            maxStake: validator.maxStake,
            activeStake: validator.activeStake,
            activeStakePercentage: validator.activeStakePercentage,
            overstaked: validator.overstaked,
            isLedgerNode: validator.isLedgerNode,
          },
        }),
      );
    });

    it("should handle delegation with non-existent validator", async () => {
      const delegation: HederaDelegation = {
        nodeId: 999999,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() =>
        expect(result.current).toEqual({
          nodeId: delegation.nodeId,
          delegated: delegation.delegated,
          pendingReward: delegation.pendingReward,
          loading: false,
          error: null,
          status: "inactive",
          validator: {
            name: "",
            address: "",
            addressChecksum: null,
            id: String(delegation.nodeId),
            minStake: new BigNumber(0),
            maxStake: new BigNumber(0),
            activeStake: new BigNumber(0),
            activeStakePercentage: new BigNumber(0),
            overstaked: false,
            isLedgerNode: false,
          },
        }),
      );
    });

    it("should handle delegation with zero staked amount", async () => {
      const validator = validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(0),
        pendingReward: new BigNumber(0),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => expect(result.current.validator.id).toEqual(validator.id));
      expect(result.current.delegated).toEqual(new BigNumber(0));
    });

    it("surfaces the error when the fetch fails before anything is cached", async () => {
      jest.spyOn(apiClient, "getNodes").mockRejectedValue(new Error("network down"));
      // the beforeEach above warms the LRU, so drop it or the hook just reads the cached list
      getHederaValidators.clear(currency.id);

      const delegation: HederaDelegation = {
        nodeId: 0,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.status).toBe("inactive");
      expect(result.current.validator.name).toBe("");
    });

    it("does not surface a refetch error when previously fetched validators are still cached", async () => {
      const validator = validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        { wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.validator.id).toEqual(validator.id);
      expect(result.current.error).toBeNull();

      jest.spyOn(apiClient, "getNodes").mockRejectedValueOnce(new Error("network down"));
      // without this the queryFn just replays the cached promise and the refetch never fails
      getHederaValidators.clear(currency.id);
      await queryClient.refetchQueries({
        queryKey: [...hooks.hederaQueries.all(), "validators", currency.id],
      });

      await waitFor(() => expect(result.current.error).toBeNull());
      expect(result.current.validator.id).toEqual(validator.id);
    });

    it("should handle delegation with pending rewards", async () => {
      const validator = validators[0];
      invariant(validator, "No validators available for test");

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(1500),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegationV2(mockAccount, delegation),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => expect(result.current.pendingReward).toEqual(new BigNumber(1500)));
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
