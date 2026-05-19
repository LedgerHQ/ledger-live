import { useCallback } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useLocation, useNavigate } from "react-router";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { flattenAccounts, isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import { buildBuyNavigationState, type BuyNavigationOnRampState } from "../utils/buyNavigation";
import { buildSellNavigationState, type SellNavigationOffRampState } from "../utils/sellNavigation";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountLike } from "@ledgerhq/types-live";

type RampExchangeKind = "buy" | "sell";

type NavigateToRamp = (
  ledgerCurrency: CryptoOrTokenCurrency | null | undefined,
  ticker?: string,
) => void;

type BuildRampStateParams = {
  ledgerCurrency: CryptoOrTokenCurrency;
  account?: AccountLike;
  parentAccount?: Account;
  returnTo?: string;
};

function buildRampNavigationState(kind: RampExchangeKind, params: BuildRampStateParams) {
  return kind === "buy" ? buildBuyNavigationState(params) : buildSellNavigationState(params);
}

function emptyLedgerRampState(
  kind: RampExchangeKind,
  ticker: string | undefined,
  returnTo: string,
): BuyNavigationOnRampState | SellNavigationOffRampState {
  if (kind === "buy") {
    return { mode: "onRamp", defaultTicker: ticker?.toUpperCase(), returnTo };
  }
  return { mode: "offRamp", defaultTicker: ticker?.toUpperCase(), returnTo };
}

export function useRampExchangeNavigation(kind: RampExchangeKind): NavigateToRamp {
  const navigate = useNavigate();
  const location = useLocation();
  const allAccounts = useSelector(accountsSelector);
  const flattenedAccounts = flattenAccounts(allAccounts);
  const { openAssetAndAccount } = useOpenAssetAndAccount();

  return useCallback<NavigateToRamp>(
    (ledgerCurrency, ticker) => {
      if (!ledgerCurrency) {
        navigate("/exchange", {
          state: emptyLedgerRampState(kind, ticker, location.pathname),
        });
        return;
      }

      const availableAccounts = getAvailableAccountsById(ledgerCurrency.id, flattenedAccounts);
      const hasAccounts = availableAccounts.length > 0;

      if (!hasAccounts) {
        navigate("/exchange", {
          state: buildRampNavigationState(kind, {
            ledgerCurrency,
            returnTo: location.pathname,
          }),
        });
        return;
      }

      if (availableAccounts.length === 1) {
        const account = availableAccounts[0];
        const parentAccount = isTokenAccount(account)
          ? allAccounts.find(a => a.id === account.parentId)
          : undefined;

        navigate("/exchange", {
          state: buildRampNavigationState(kind, {
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
        useCase: kind,
        drawerConfiguration: {},
        onSuccess: (account, parentAccount) => {
          navigate("/exchange", {
            state: buildRampNavigationState(kind, {
              ledgerCurrency,
              account,
              parentAccount,
              returnTo: location.pathname,
            }),
          });
        },
      });
    },
    [navigate, flattenedAccounts, allAccounts, openAssetAndAccount, location.pathname, kind],
  );
}
