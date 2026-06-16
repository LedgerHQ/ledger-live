import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { ReactElement } from "react";
import { useLeftAccountsModule } from "../hooks/useLeftAccounts";
import { useLeftAccountsApyModule } from "../hooks/useLeftAccountsApy";
import { useRightBalanceNetwork } from "../hooks/useRightBalanceNetwork";
import {
  NetworkConfigurationOptions,
  Network,
  BalanceUI,
  NetworkLeftElementKind,
  NetworkRightElementKind,
} from "../utils/type";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";

type NetworkComponentProps = Partial<
  Network & {
    balanceData?: BalanceUI;
    count?: number;
  }
>;

export type NetworksWithComponents = CryptoOrTokenCurrency &
  Network & {
    balanceData?: BalanceUI;
    count?: number;
    apy?: ReactElement;
    description?: string;
  };

export const sortNetworks = (
  result: NetworksWithComponents[],
  leftElement?: NetworkLeftElementKind,
  rightElement?: NetworkRightElementKind,
) => {
  let sorted = result;
  if (
    leftElement === "numberOfAccounts" ||
    leftElement === "numberOfAccountsAndApy" ||
    leftElement === undefined
  ) {
    sorted = [...sorted].sort((a, b) => (b?.count || 0) - (a?.count || 0));
  }

  if (rightElement === "balance" || rightElement === undefined) {
    sorted = [...sorted].sort((a, b) => compareByBalanceThenFiat(a?.balanceData, b?.balanceData));
  }
  return sorted;
};

export function useNetworkConfiguration(
  networks: CryptoOrTokenCurrency[],
  options: NetworkConfigurationOptions,
) {
  const { leftElement = "numberOfAccounts", rightElement = "balance" } = options;
  const params = { networks };
  const emptyParams: { networks: CryptoOrTokenCurrency[] } = { networks: [] };

  const rightResults: Record<string, NetworkComponentProps[]> = {
    balance: useRightBalanceNetwork(
      rightElement === "balance" || rightElement === undefined ? params : emptyParams,
      options,
    ),
  };
  const leftResults: Record<string, NetworkComponentProps[]> = {
    numberOfAccounts: useLeftAccountsModule(
      leftElement === "numberOfAccounts" || leftElement === undefined ? params : emptyParams,
      options,
    ),
    numberOfAccountsAndApy: useLeftAccountsApyModule(
      leftElement === "numberOfAccountsAndApy" ? params : emptyParams,
      options,
    ),
  };

  const merged = networks.map<NetworksWithComponents>((network, i) => {
    const asset =
      network.type === "TokenCurrency" ? getCryptoCurrencyById(network.parentCurrencyId) : network;
    return {
      ...asset,
      ...rightResults[rightElement]?.[i],
      ...leftResults[leftElement]?.[i],
    };
  });

  return sortNetworks(merged, leftElement, rightElement);
}
