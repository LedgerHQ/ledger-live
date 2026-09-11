/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import hederaCoinConfig from "@ledgerhq/coin-hedera/config";
import { getHederaValidators } from "@ledgerhq/coin-hedera/network/utils";
import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { renderHook, waitFor } from "@testing-library/react";
import { liveConfig } from "../../config/sharedConfig";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createTestStore, createWrapper } from "@tests/test-helpers/testUtils";
import { hederaApi } from "./state-manager/api";
import * as hooks from "./react";
import type { HederaAccount, HederaDelegation, HederaValidator } from "./types";

describe("hedera/react", () => {
  const currency = getCryptoCurrencyById("hedera");
  let store: ReturnType<typeof createTestStore>;
  let wrapper: ReturnType<typeof createWrapper>;

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
    store = createTestStore([hederaApi], { disableSerializableCheck: true });
    wrapper = createWrapper(store);
  });

  describe("useHederaValidators", () => {
    it("should return all validators", async () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency.id), { wrapper });

      await waitFor(() => expect(result.current.validators).toHaveLength(3));
      // sortValidators puts the Ledger node first, then orders by active stake descending
      expect(result.current.validators.map(validator => validator.id)).toEqual(["1", "0", "3"]);
    });

    it("should surface an error when the validators fetch fails", async () => {
      jest.spyOn(apiClient, "getNodes").mockRejectedValueOnce(new Error("network down"));

      const { result } = renderHook(() => hooks.useHederaValidators(currency.id), { wrapper });

      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.validators).toEqual([]);
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

    let validators: HederaValidator[];

    beforeEach(async () => {
      validators = await getHederaValidators({ currencyId: currency.id });
    });

    it("should report loading:true before validators resolve, then loading:false once they do", async () => {
      const delegation: HederaDelegation = {
        nodeId: 999999,
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
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
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
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
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
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
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
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
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
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

      const { result } = renderHook(
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.validator.id).toEqual(validator.id);
      expect(result.current.error).toBeNull();

      jest.spyOn(apiClient, "getNodes").mockRejectedValueOnce(new Error("network down"));
      // without this the query just replays the cached list and the refetch never fails
      getHederaValidators.clear(currency.id);
      await store.dispatch(
        hederaApi.endpoints.getValidators.initiate(currency.id, { forceRefetch: true }),
      );

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
        () => hooks.useHederaEnrichedDelegation(mockAccount, delegation),
        { wrapper },
      );

      await waitFor(() => expect(result.current.pendingReward).toEqual(new BigNumber(1500)));
    });
  });
});
