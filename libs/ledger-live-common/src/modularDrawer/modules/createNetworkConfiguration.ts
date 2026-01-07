import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useMemo } from "react";
import { useLeftAccountsModule } from "../hooks/useLeftAccounts";
import { useLeftAccountsApyModule } from "../hooks/useLeftAccountsApy";
import { useRightBalanceNetwork } from "../hooks/useRightBalanceNetwork";
import {
  CreateNetworkConfigurationHookProps,
  NetworkConfigurationDeps,
  Network,
  BalanceUI,
  NetworkLeftElementKind,
  NetworkRightElementKind,
} from "../utils/type";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";

type NetworksWithComponents = CryptoOrTokenCurrency &
  Network & {
    balanceData?: BalanceUI;
    count?: number;
    apy?: React.ReactElement;
    description?: string;
  };

const sortNetworks = (
  result: NetworksWithComponents[],
  leftElement?: NetworkLeftElementKind,
  rightElement?: NetworkRightElementKind,
) => {
  if (
    leftElement === "numberOfAccounts" ||
    leftElement === "numberOfAccountsAndApy" ||
    leftElement === undefined // default
  ) {
    result.sort((a, b) => (b?.count || 0) - (a?.count || 0));
  }

  if (
    rightElement === "balance" ||
    rightElement === undefined // default
  ) {
    result.sort((a, b) => compareByBalanceThenFiat(a?.balanceData, b?.balanceData));
  }
};

export const createNetworkConfigurationHook =
  (deps: NetworkConfigurationDeps) =>
  ({ networksConfig }: CreateNetworkConfigurationHookProps) => {
    const { leftElement, rightElement } = networksConfig ?? {};

    return (
      networks: CryptoOrTokenCurrency[],
    ): Array<
      CryptoOrTokenCurrency &
        Network & {
          balanceData?: BalanceUI;
          count?: number;
          apy?: React.ReactElement;
          description?: string;
        }
    > => {
      // Call all hooks unconditionally at the top level with enabled based on configuration
      const rightBalanceResult = useRightBalanceNetwork({
        networks,
        useBalanceDeps: deps.useBalanceDeps,
        balanceItem: deps.balanceItem,
        enabled: rightElement === "balance" || rightElement === undefined,
      });
      const leftAccountsResult = useLeftAccountsModule({
        networks,
        useAccountData: deps.useAccountData,
        accountsCount: deps.accountsCount,
        enabled: leftElement === "numberOfAccounts" || leftElement === undefined,
      });
      const leftAccountsApyResult = useLeftAccountsApyModule(
        { networks },
        deps.useAccountData,
        deps.accountsCountAndApy,
        deps.accountsApy,
        leftElement === "numberOfAccountsAndApy",
      );

      return useMemo(() => {
        const getRightResult = (index: number) => {
          if (rightElement === "undefined") return undefined;
          return rightBalanceResult[index];
        };

        const getLeftResult = (index: number) => {
          if (leftElement === "undefined") return undefined;
          if (leftElement === "numberOfAccountsAndApy") return leftAccountsApyResult[index];
          return leftAccountsResult[index];
        };

        const networksWithComponents = networks.map((network, index) => {
          const asset = network.type === "TokenCurrency" ? network.parentCurrency : network;
          const rightResult = getRightResult(index);
          const leftResult = getLeftResult(index);

          return {
            ...asset,
            ...rightResult,
            ...leftResult,
          };
        });

        sortNetworks(networksWithComponents, leftElement, rightElement);

        return networksWithComponents;
      }, [networks, rightBalanceResult, leftAccountsResult, leftAccountsApyResult]);
    };
  };
