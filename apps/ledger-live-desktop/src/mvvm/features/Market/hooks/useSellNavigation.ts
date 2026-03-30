import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildSellNavigationState, type SellNavigationOffRampState } from "../utils/sellNavigation";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type NavigateToSell = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
) => void;

interface UseSellNavigationResult {
  navigateToSell: NavigateToSell;
}

export function useSellNavigation(): UseSellNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const navigateToSell = useCallback<NavigateToSell>(
    (ledgerCurrency, ticker) => {
      if (!ledgerCurrency) {
        const offRampState: SellNavigationOffRampState = {
          mode: "offRamp",
          defaultTicker: ticker?.toUpperCase(),
          returnTo: location.pathname,
        };
        navigate("/exchange", { state: offRampState });
        return;
      }

      const availableAccounts = getAvailableAccountsById(ledgerCurrency.id, flattenedAccounts);
      const hasAccounts = availableAccounts.length > 0;

      if (!hasAccounts) {
        navigate("/exchange", {
          state: buildSellNavigationState({ ledgerCurrency, returnTo: location.pathname }),
        });
        return;
      }

      if (availableAccounts.length === 1) {
        const account = availableAccounts[0];
        const parentAccount = isTokenAccount(account)
          ? allAccounts.find(a => a.id === account.parentId)
          : undefined;

        navigate("/exchange", {
          state: buildSellNavigationState({
            ledgerCurrency,
            account,
            parentAccount,
            returnTo: location.pathname,
          }),
        });
        return;
      }

      openAssetAndAccount({
        currencies: [ledgerCurrency.id],
        areCurrenciesFiltered: true,
        useCase: "sell",
        drawerConfiguration: {},
        onSuccess: (account, parentAccount) => {
          navigate("/exchange", {
            state: buildSellNavigationState({
              ledgerCurrency,
              account,
              parentAccount,
              returnTo: location.pathname,
            }),
          });
        },
      });
    },
    [navigate, flattenedAccounts, allAccounts, openAssetAndAccount, location.pathname],
  );

  return { navigateToSell };
}
