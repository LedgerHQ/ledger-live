import type { ReactNode } from "react";
import { NetworkConfigurationOptions, BalanceUI, NetworkHookParams } from "../utils/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";
import BigNumber from "bignumber.js";

export function useRightBalanceNetwork(
  { networks }: NetworkHookParams,
  {
    useBalanceDeps,
    balanceItem,
  }: Pick<NetworkConfigurationOptions, "useBalanceDeps" | "balanceItem">,
): Array<{
  rightElement?: ReactNode;
  balanceData?: BalanceUI;
}> {
  const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

  const networkBalanceData = getBalanceAndFiatValueByAssets(
    flattenedAccounts,
    networks,
    state,
    counterValueCurrency,
  );

  const balanceMap = new Map(networkBalanceData.map(b => [b.id, b]));

  return networks.map(network => {
    const currency = network.type === "TokenCurrency" ? network.parentCurrency : network;
    const balanceData = balanceMap.get(network.id) || {
      currency,
      balance: new BigNumber(0),
      fiatValue: 0,
    };

    return {
      rightElement: balanceItem(balanceData),
      balanceData,
    };
  });
}
