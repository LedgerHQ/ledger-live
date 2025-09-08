import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { createUseLeftAccountsModule } from "../hooks/useLeftAccounts";
import { useLeftAccountsApyModule } from "../hooks/useLeftAccountsApy";
import { createUseRightBalanceNetwork } from "../hooks/useRightBalanceNetwork";
import {
  CreateNetworkConfigurationHookProps,
  NetworkConfigurationDeps,
  LeftElementKind,
  Network,
  NetworkHook,
  RightElementKind,
  AccountModuleParams,
} from "../utils/type";
import { composeHooks } from "../../utils/composeHooks";

export const getLeftElement =
  (NetworkConfigurationDeps: NetworkConfigurationDeps) =>
  (leftElement: LeftElementKind): NetworkHook | undefined => {
    switch (leftElement) {
      case "numberOfAccounts":
        return createUseLeftAccountsModule({
          useAccountData: NetworkConfigurationDeps.useAccountData,
          accountsCount: NetworkConfigurationDeps.accountsCount,
        });
      case "numberOfAccountsAndApy":
        return (params: AccountModuleParams & { networks: CryptoOrTokenCurrency[] }) =>
          useLeftAccountsApyModule(
            params,
            NetworkConfigurationDeps.useAccountData,
            NetworkConfigurationDeps.accountsCountAndApy,
            params.networks,
          );
      case "undefined":
      default:
        return undefined;
    }
  };

export const getRightElement =
  (NetworkConfigurationDeps: NetworkConfigurationDeps) =>
  (rightElement: RightElementKind): NetworkHook | undefined => {
    switch (rightElement) {
      case "balance":
        return createUseRightBalanceNetwork({
          useBalanceDeps: NetworkConfigurationDeps.useBalanceDeps,
          balanceItem: NetworkConfigurationDeps.balanceItem,
        });
      case "undefined":
      default:
        return undefined;
    }
  };

export const createNetworkConfigurationHook =
  (NetworkConfigurationDeps: NetworkConfigurationDeps) =>
  ({
    networksConfig,
    selectedAssetId,
    currenciesByProvider,
    accounts$,
  }: CreateNetworkConfigurationHookProps) => {
    const { leftElement = "undefined", rightElement = "undefined" } = networksConfig ?? {};
    const leftHook = getLeftElement(NetworkConfigurationDeps)(leftElement);
    const rightHook = getRightElement(NetworkConfigurationDeps)(rightElement);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const hooks = [rightHook, leftHook].filter(Boolean) as NetworkHook[];

    return (
      assets: CryptoOrTokenCurrency[],
      networks: CryptoOrTokenCurrency[],
    ): Array<CryptoOrTokenCurrency & Network> => {
      const composedHook = composeHooks<CryptoOrTokenCurrency, Network>(
        ...hooks.map(
          hook => () =>
            hook({
              assets,
              selectedAssetId,
              currenciesByProvider: currenciesByProvider || [],
              accounts$,
              networks,
            }),
        ),
      );
      return composedHook(assets);
    };
  };
