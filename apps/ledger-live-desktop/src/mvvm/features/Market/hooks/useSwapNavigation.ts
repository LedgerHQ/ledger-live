import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildSwapNavigationState } from "../utils/swapNavigation";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";

export type SwapNavigationOptions = Readonly<{
  currencyIds?: readonly string[];
}>;

type NavigateToSwap = (
  ledgerCurrency: CryptoOrTokenCurrency,
  options?: SwapNavigationOptions,
) => void;

interface UseSwapNavigationResult {
  navigateToSwap: NavigateToSwap;
}

export function useSwapNavigation(): UseSwapNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const navigateToSwap = useCallback<NavigateToSwap>(
    (ledgerCurrency: CryptoOrTokenCurrency, options?: SwapNavigationOptions) => {
      const fromPath = location.pathname;
      const currencyIds = options?.currencyIds?.length
        ? [...new Set(options.currencyIds)]
        : [ledgerCurrency.id];
      const hasAccounts = currencyIds.some(
        id => getAvailableAccountsById(id, flattenedAccounts).length > 0,
      );

      if (!hasAccounts) {
        navigate("/swap", {
          state: buildSwapNavigationState({ defaultCurrency: ledgerCurrency, fromPath }),
        });
        return;
      }

      // Swap only opens once the user has picked the network and account to swap from.
      openAssetAndAccount({
        currencies: currencyIds,
        areCurrenciesFiltered: true,
        useCase: "swap",
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
    [navigate, location.pathname, flattenedAccounts, openAssetAndAccount],
  );

  return { navigateToSwap };
}
