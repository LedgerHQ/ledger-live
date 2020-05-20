// @flow
import invariant from "invariant";
import { renderHook, act } from "@testing-library/react-hooks";
import { getAccountUnit } from "../../account";
import { getAccountBridge, getCurrencyBridge } from "../../bridge";
import { getCryptoCurrencyById } from "../../currencies";
import { setEnv } from "../../env";
import { genAccount, genAddingOperationsInAccount } from "../../mock/account";
import type { Account, CurrencyBridge, Transaction } from "../../types";
import { getCurrentCosmosPreloadData } from "./preloadedData";
import preloadedMockData from "./preloadedData.mock";
import * as hooks from "./react";

describe("cosmos/react", () => {
  describe("useCosmosPreloadData", () => {
    it("should return Cosmos preload data and updates", async () => {
      const { currencyBridge } = setup();
      const { result } = renderHook(() => hooks.useCosmosPreloadData());

      const data = getCurrentCosmosPreloadData();
      expect(result.current).toStrictEqual(data);

      act(() => {
        currencyBridge.preload();
      });

      expect(result.current).toStrictEqual(preloadedMockData);
    });
  });

  describe("useCosmosFormattedDelegations", () => {
    it("should return formatted delegations", async () => {
      const { account, currencyBridge } = setup();
      const { result } = renderHook(() =>
        hooks.useCosmosFormattedDelegations(account)
      );

      await act(async () => {
        await currencyBridge.preload();
      });

      const delegations = account.cosmosResources?.delegations;
      invariant(delegations, "cosmos: delegations is required");

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current.length).toBe(delegations.length);

      expect(result.current[0].validator.validatorAddress).toBe(
        delegations[0].validatorAddress
      );
      expect(result.current[0].address).toBe(delegations[0].validatorAddress);
      expect(result.current[0].amount).toBe(delegations[0].amount);
      expect(result.current[0].pendingRewards.toString()).toBe(
        delegations[0].pendingRewards.toString()
      );
      expect(result.current[0].status).toStrictEqual(delegations[0].status);
    });

    it("should return formatted delegations for claimReward", async () => {
      const { account, currencyBridge } = setup();
      const { result } = renderHook(() =>
        hooks.useCosmosFormattedDelegations(account, "claimReward")
      );

      await act(async () => {
        await currencyBridge.preload();
      });

      expect(result.current.length).toBe(2);
      expect(result.current[0].reward.split(" ")[0]).toBe(
        getAccountUnit(account).code
      );
    });

    it("should return formatted delegations for redelegate/undelegate", async () => {
      const { account, currencyBridge } = setup();
      const { result: redelegateResult } = renderHook(() =>
        hooks.useCosmosFormattedDelegations(account, "redelegate")
      );

      const { result: undelegateResult } = renderHook(() =>
        hooks.useCosmosFormattedDelegations(account, "undelegate")
      );

      await act(async () => {
        await currencyBridge.preload();
      });

      expect(redelegateResult).toStrictEqual(undelegateResult);

      const delegations = account.cosmosResources?.delegations;
      invariant(delegations, "cosmos: delegations is required");

      expect(redelegateResult.current.length).toBe(delegations.length);
      expect(redelegateResult.current[0].formattedAmount.split(" ")[0]).toBe(
        getAccountUnit(account).code
      );
    });
  });

  describe("useCosmosDelegationsQuerySelector", () => {
    it("should return delegations filtered by query as options", async () => {
      const { account, transaction, currencyBridge } = setup();
      invariant(
        account.cosmosResources,
        "cosmos: account and cosmos resources required"
      );
      const delegations = account.cosmosResources.delegations || [];
      const newTx = {
        ...transaction,
        mode: "delegation",
        validators: delegations.map(({ validatorAddress, amount }) => ({
          address: validatorAddress,
          amount,
        })),
      };
      const { result } = renderHook(() =>
        hooks.useCosmosDelegationsQuerySelector(account, newTx)
      );

      await act(async () => {
        await currencyBridge.preload();
      });

      expect(result.current.options.length).toBe(delegations.length);

      act(() => {
        result.current.setQuery("Nodeasy.com");
      });

      expect(result.current.options.length).toBe(1);
    });

    it("should return the first delegation as value", async () => {
      const { account, transaction, currencyBridge } = setup();
      invariant(
        account.cosmosResources,
        "cosmos: account and cosmos resources required"
      );
      const delegations = account.cosmosResources.delegations || [];
      const newTx = {
        ...transaction,
        mode: "delegation",
        validators: delegations.map(({ validatorAddress, amount }) => ({
          address: validatorAddress,
          amount,
        })),
      };
      const { result } = renderHook(() =>
        hooks.useCosmosDelegationsQuerySelector(account, newTx)
      );

      await act(async () => {
        await currencyBridge.preload();
      });

      expect(result.current.value.address).toBe(
        delegations[0].validatorAddress
      );
    });

    it("should find delegation by cosmosSourceValidator field and return as value for redelegate", async () => {
      const { account, transaction, currencyBridge } = setup();
      invariant(
        account.cosmosResources,
        "cosmos: account and cosmos resources required"
      );
      const delegations = account.cosmosResources.delegations || [];
      const cosmosSourceValidator =
        delegations[delegations.length - 1].validatorAddress;
      const newTx = {
        ...transaction,
        mode: "redelegate",
        validators: delegations.map(({ validatorAddress, amount }) => ({
          address: validatorAddress,
          amount,
        })),
        cosmosSourceValidator,
      };
      const { result } = renderHook(() =>
        hooks.useCosmosDelegationsQuerySelector(account, newTx)
      );

      await act(async () => {
        await currencyBridge.preload();
      });

      expect(result.current.value.address).toBe(cosmosSourceValidator);
    });
  });

  describe("useSortedValidators", () => {
    it.todo("should reutrn sorted validators");
  });
});

function setup(): {
  account: Account,
  currencyBridge: CurrencyBridge,
  transaction: Transaction,
} {
  setEnv("MOCK", 1);
  setEnv("EXPERIMENTAL_CURRENCIES", "cosmos");
  const seed = "cosmos-1";
  const currency = getCryptoCurrencyById("cosmos");
  const a = genAccount(seed, { currency });
  const account = genAddingOperationsInAccount(a, 3, seed);
  const bridge = getAccountBridge(account);
  const transaction = bridge.createTransaction(account);

  return {
    account,
    currencyBridge: getCurrencyBridge(currency),
    transaction,
  };
}
