import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { UseBalanceDeps, CreateBalanceItem, BalanceUI } from "../utils/type";
import { getBalanceAndFiatValueByAssets } from "../utils/getBalanceAndFiatValueByAssets";
import BigNumber from "bignumber.js";

export type NetworkDeps = {
  balanceItem: CreateBalanceItem;
  useBalanceDeps: UseBalanceDeps;
};

export function useRightBalanceNetwork({
  networks,
  useBalanceDeps,
  balanceItem,
  enabled = true,
}: NetworkDeps & { networks: CryptoOrTokenCurrency[]; enabled?: boolean }): Array<{
  rightElement?: React.ReactNode;
  balanceData?: BalanceUI;
}> {
  const { flattenedAccounts, state, counterValueCurrency } = useBalanceDeps();

  if (!enabled) return networks.map(() => ({}));

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
