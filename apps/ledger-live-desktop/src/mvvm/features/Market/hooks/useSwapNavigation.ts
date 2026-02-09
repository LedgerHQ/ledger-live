import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useNavigate, useLocation } from "react-router";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildSwapNavigationState } from "../utils/swapNavigation";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type NavigateToSwap = (ledgerCurrency: CryptoOrTokenCurrency) => void;

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
    (ledgerCurrency: CryptoOrTokenCurrency) => {
      const fromPath = location.pathname;
      const availableAccounts = getAvailableAccountsById(ledgerCurrency.id, flattenedAccounts);
      const hasAccounts = availableAccounts.length > 0;

      if (!hasAccounts) {
        navigate("/swap", {
          state: buildSwapNavigationState({ defaultCurrency: ledgerCurrency, fromPath }),
        });
        return;
      }

      if (availableAccounts.length === 1) {
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
        currencies: [ledgerCurrency.id],
        areCurrenciesFiltered: true,
        useCase: "swap",
        drawerConfiguration: {},
        onSuccess: (account, parentAccount) => {
          navigate("/swap", {
            state: buildSwapNavigationState({
              defaultCurrency: ledgerCurrency,
              fromPath,
              account,
              parentAccount,
            }),
          });
        },
      });
    },
    [navigate, location.pathname, flattenedAccounts, allAccounts, openAssetAndAccount],
  );

  return { navigateToSwap };
}
