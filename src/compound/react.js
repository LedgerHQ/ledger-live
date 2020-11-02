// @flow
import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { TokenAccount } from "../types";
import { getSupplyMax } from "../families/ethereum/modules/compound";

export function useSupplyMax(account: TokenAccount): BigNumber {
  return useMemo(() => getSupplyMax(account), [account]);
}

export const useSupplyMaxChoiceButtons = (
  supplyMax: BigNumber
): Array<{ label: string, value: BigNumber }> => {
  return useMemo(
    () => [
      {
        label: "25%",
        value: supplyMax.multipliedBy(0.25).integerValue(),
      },
      {
        label: "50%",
        value: supplyMax.multipliedBy(0.5).integerValue(),
      },
      {
        label: "75%",
        value: supplyMax.multipliedBy(0.75).integerValue(),
      },
      {
        label: "100%",
        value: supplyMax,
      },
    ],
    [supplyMax]
  );
};
