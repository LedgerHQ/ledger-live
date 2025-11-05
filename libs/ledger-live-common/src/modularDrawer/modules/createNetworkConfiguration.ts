import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { createUseLeftAccountsModule } from "../hooks/useLeftAccounts";
import { useLeftAccountsApyModule } from "../hooks/useLeftAccountsApy";
import { createUseRightBalanceNetwork } from "../hooks/useRightBalanceNetwork";
import {
  CreateNetworkConfigurationHookProps,
  NetworkConfigurationDeps,
  Network,
  NetworkHook,
  AccountModuleParams,
  BalanceUI,
  NetworkLeftElementKind,
  NetworkRightElementKind,
} from "../utils/type";
import { compareByBalanceThenFiat } from "../utils/sortByBalance";

const getLeftElement =
  (NetworkConfigurationDeps: NetworkConfigurationDeps) =>
  (leftElement?: NetworkLeftElementKind): NetworkHook | undefined => {
    switch (leftElement) {
      case "undefined":
        return undefined;
      case "numberOfAccountsAndApy":
        return (params: AccountModuleParams) =>
          useLeftAccountsApyModule(
            params,
            NetworkConfigurationDeps.useAccountData,
            NetworkConfigurationDeps.accountsCountAndApy,
          );
      case "numberOfAccounts":
      default:
        return createUseLeftAccountsModule({
          useAccountData: NetworkConfigurationDeps.useAccountData,
          accountsCount: NetworkConfigurationDeps.accountsCount,
        });
    }
  };

const getRightElement =
  (NetworkConfigurationDeps: NetworkConfigurationDeps) =>
  (rightElement?: NetworkRightElementKind): NetworkHook | undefined => {
    switch (rightElement) {
      case "undefined":
        return undefined;
      case "balance":
      default:
        return (params: { networks: CryptoOrTokenCurrency[] }) =>
          createUseRightBalanceNetwork({
            useBalanceDeps: NetworkConfigurationDeps.useBalanceDeps,
            balanceItem: NetworkConfigurationDeps.balanceItem,
          })({ networks: params.networks });
    }
  };

type NetworksWithComponents = CryptoOrTokenCurrency &
  Network & { balanceData?: BalanceUI; count?: number };

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
  (NetworkConfigurationDeps: NetworkConfigurationDeps) =>
  ({ networksConfig, accounts$ }: CreateNetworkConfigurationHookProps) => {
    const { leftElement, rightElement } = networksConfig ?? {};
    const leftHook = getLeftElement(NetworkConfigurationDeps)(leftElement);
    const rightHook = getRightElement(NetworkConfigurationDeps)(rightElement);

    const hooks = [rightHook, leftHook].filter((hook): hook is NetworkHook => Boolean(hook));

    return (
      networks: CryptoOrTokenCurrency[],
    ): Array<CryptoOrTokenCurrency & Network & { balanceData?: BalanceUI; count?: number }> => {
      const hookResults = hooks.map(hook =>
        hook({
          accounts$,
          networks,
        }),
      );

      const networksWithComponents = networks.map((network, index) => {
        const asset = network.type === "TokenCurrency" ? network.parentCurrency : network;

        const merged: NetworksWithComponents = { ...asset };

        for (const hookResult of hookResults) {
          if (hookResult[index]) {
            Object.assign(merged, hookResult[index]);
          }
        }

        return merged;
      });

      sortNetworks(networksWithComponents, leftElement, rightElement);

      return networksWithComponents;
    };
  };
