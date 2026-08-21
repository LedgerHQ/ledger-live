/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import BigNumber from "bignumber.js";

// useHederaAllValidators resolves config via getCurrencyConfiguration("hedera") before delegating
// to the (mocked) apiClient; stub it so the hook doesn't hit an unseeded LiveConfig (mirrors
// families/tezos/react.test.ts's identical stub for useBaker).
jest.mock("../../config", () => ({
  ...jest.requireActual("../../config"),
  getCurrencyConfiguration: jest.fn(() => ({ status: { type: "active" } })),
}));

import { apiClient } from "@ledgerhq/coin-hedera/network/api";
import { mapMirrorNodesToValidators } from "@ledgerhq/coin-hedera/logic/utils";
import type { HederaMirrorNode } from "@ledgerhq/coin-hedera/types";
import { renderHook, waitFor } from "@testing-library/react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import * as hooks from "./react";
import type { HederaAccount, HederaDelegation } from "./types";

const mockNodes: HederaMirrorNode[] = [
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
];

// GAP H: these hooks used to read a `CurrencyBridge.preload`-populated singleton that the generic
// bridge never fills. They now fetch nodes directly (mirroring `useEvmStakingValidators`), so the
// expected shape here is derived the same way the hook derives it — via the same mapper — rather than
// read back from a global.
const expectedValidators = mapMirrorNodesToValidators(mockNodes);

describe("hedera/react", () => {
  const currency = getCryptoCurrencyById("hedera");

  beforeEach(() => {
    jest.spyOn(apiClient, "getNodes").mockResolvedValue({ nodes: mockNodes, nextCursor: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("useHederaValidators", () => {
    it("should return all validators when no search query", async () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency));

      await waitFor(() => expect(result.current).toEqual(expectedValidators));
    });

    it("should return all validators when search query is empty string", async () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency, ""));

      await waitFor(() => expect(result.current).toEqual(expectedValidators));
    });

    it("should filter validators by name", async () => {
      const { result } = renderHook(() => hooks.useHederaValidators(currency, "Swirlds"));

      await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
      result.current.forEach(validator => {
        expect(validator.name.toLowerCase()).toContain("swirlds");
      });
    });

    it("should filter validators by node ID", async () => {
      const [firstValidator] = expectedValidators;

      const { result } = renderHook(() => hooks.useHederaValidators(currency, firstValidator.id));

      await waitFor(() => expect(result.current.length).toBeGreaterThan(0));
      expect(result.current.some(v => v.id === firstValidator.id)).toBe(true);
    });

    it("should return empty array when no validators match search", async () => {
      const { result } = renderHook(() =>
        hooks.useHederaValidators(currency, "nonexistingvalidator"),
      );

      await waitFor(() => expect(result.current).toEqual([]));
    });

    it("should be case insensitive when filtering", async () => {
      const { result: upperResult } = renderHook(() =>
        hooks.useHederaValidators(currency, "SWIRLDS"),
      );
      const { result: lowerResult } = renderHook(() =>
        hooks.useHederaValidators(currency, "swirlds"),
      );

      await waitFor(() => expect(upperResult.current.length).toBeGreaterThan(0));
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

    it("should enrich delegation with validator data", async () => {
      const [validator] = expectedValidators;

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(500),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      await waitFor(() =>
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

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      await waitFor(() =>
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
          },
        }),
      );
    });

    it("should handle delegation with zero staked amount", async () => {
      const [validator] = expectedValidators;

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(0),
        pendingReward: new BigNumber(0),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      await waitFor(() => expect(result.current.validator.id).toEqual(validator.id));
      expect(result.current.delegated).toEqual(new BigNumber(0));
    });

    it("should handle delegation with pending rewards", async () => {
      const [validator] = expectedValidators;

      const delegation: HederaDelegation = {
        nodeId: Number(validator.id),
        delegated: new BigNumber(100000),
        pendingReward: new BigNumber(1500),
      };

      const { result } = renderHook(() =>
        hooks.useHederaEnrichedDelegation(mockAccount, delegation),
      );

      await waitFor(() => expect(result.current.pendingReward).toEqual(new BigNumber(1500)));
    });
  });
});
