// @flow
import invariant from "invariant";
import { renderHook, act } from "@testing-library/react-hooks";
import { getCurrencyBridge } from "../../bridge";
import { getCryptoCurrencyById } from "../../currencies";
import { setEnv } from "../../env";
import { genAccount, genAddingOperationsInAccount } from "../../mock/account";
import type { Account, CurrencyBridge } from "../../types";
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
  });
});

function setup(): { account: Account, currencyBridge: CurrencyBridge } {
  const seed = "cosmos-1";
  const currency = getCryptoCurrencyById("cosmos");
  const account = genAccount(seed, { currency });
  setEnv("MOCK", 1);

  return {
    account: genAddingOperationsInAccount(account, 3, seed),
    currencyBridge: getCurrencyBridge(currency),
  };
}
