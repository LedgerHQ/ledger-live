import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildBuyNavigationState, type BuyNavigationOnRampState } from "../utils/buyNavigation";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type NavigateToBuy = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
) => void;

interface UseBuyNavigationResult {
  navigateToBuy: NavigateToBuy;
}

export function useBuyNavigation(): UseBuyNavigationResult {
  const navigate = useNavigate();
  const location = useLocation();
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  const navigateToBuy = useCallback<NavigateToBuy>(
    (ledgerCurrency, ticker) => {
      if (!ledgerCurrency) {
        const onRampState: BuyNavigationOnRampState = {
          mode: "onRamp",
          defaultTicker: ticker?.toUpperCase(),
          returnTo: location.pathname,
        };
        navigate("/exchange", { state: onRampState });
        return;
      }

      const availableAccounts = getAvailableAccountsById(ledgerCurrency.id, flattenedAccounts);
      const hasAccounts = availableAccounts.length > 0;

      if (!hasAccounts) {
        navigate("/exchange", {
          state: buildBuyNavigationState({ ledgerCurrency, returnTo: location.pathname }),
        });
        return;
      }

      if (availableAccounts.length === 1) {
        const account = availableAccounts[0];
        const parentAccount = isTokenAccount(account)
          ? allAccounts.find(a => a.id === account.parentId)
          : undefined;

        navigate("/exchange", {
          state: buildBuyNavigationState({
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
        useCase: "buy",
        drawerConfiguration: {},
        onSuccess: (account, parentAccount) => {
          navigate("/exchange", {
            state: buildBuyNavigationState({
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

  return { navigateToBuy };
}
