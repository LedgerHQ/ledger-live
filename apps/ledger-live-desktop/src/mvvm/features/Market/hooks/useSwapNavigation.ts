import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  flattenAccounts,
  getAccountCurrency,
  isTokenAccount,
} from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useLazySwapNetworkCurrencyIds } from "@features/platform-aggregated-assets";
import { useFeature } from "@features/platform-feature-flags";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildSwapNavigationState } from "../utils/swapNavigation";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type SwapNavigationOptions = Readonly<{
  source?: string;
  ledgerIds?: readonly string[];
}>;

type NavigateToSwap = (
  ledgerCurrency: CryptoOrTokenCurrency,
  options?: SwapNavigationOptions,
) => Promise<void>;

interface UseSwapNavigationResult {
  navigateToSwap: NavigateToSwap;
}

export function useSwapNavigation(): UseSwapNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const { openAssetAndAccount } = useOpenAssetAndAccount();
  const modularDrawerFeature = useFeature("lldModularDrawer");
  const { getSwapNetworkCurrencyIds } = useLazySwapNetworkCurrencyIds({
    product: "lld",
    version: __APP_VERSION__,
    isStaging: modularDrawerFeature?.params?.backendEnvironment === "STAGING",
  });

  const navigateToSwap = useCallback<NavigateToSwap>(
    async (ledgerCurrency, options) => {
      const fromPath = location.pathname;
      const networkCurrencyIds = await getSwapNetworkCurrencyIds(
        ledgerCurrency.id,
        options?.ledgerIds,
      );
      const hasSeveralNetworks = networkCurrencyIds.length > 1;
      const availableAccounts = getAvailableAccountsById(ledgerCurrency.id, flattenedAccounts);

      if (!hasSeveralNetworks && availableAccounts.length === 0) {
        navigate("/swap", {
          state: buildSwapNavigationState({ defaultCurrency: ledgerCurrency, fromPath }),
        });
        return;
      }

      if (!hasSeveralNetworks && availableAccounts.length === 1) {
        const account = availableAccounts[0];
        const parentAccount = isTokenAccount(account)
          ? allAccounts.find(a => a.id === account.parentId)
          : undefined;

        navigate("/swap", {
          state: buildSwapNavigationState({
            defaultCurrency: ledgerCurrency,
            fromPath,
            account,
            parentAccount,
          }),
        });
        return;
      }

      openAssetAndAccount({
        currencies: networkCurrencyIds,
        areCurrenciesFiltered: true,
        useCase: "swap",
        flow: "swap",
        source: options?.source,
        drawerConfiguration: {},
        onSuccess: (account, parentAccount) => {
          navigate("/swap", {
            state: buildSwapNavigationState({
              defaultCurrency: getAccountCurrency(account),
              fromPath,
              account,
              parentAccount,
            }),
          });
        },
      });
    },
    [
      navigate,
      location.pathname,
      flattenedAccounts,
      allAccounts,
      openAssetAndAccount,
      getSwapNetworkCurrencyIds,
    ],
  );

  return { navigateToSwap };
}
