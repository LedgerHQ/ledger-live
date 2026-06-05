import { useCallback } from "react";
import { useNavigate } from "react-router";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { walletSelector } from "~/renderer/reducers/wallet";
import { useStake } from "LLD/hooks/useStake";

export type NavigateToStakeForAccountOptions = {
  returnTo?: string;
  source?: string;
  entryPoint?: "get-funds";
  alwaysShowNoFunds?: boolean;
};

export type NavigateToStakeForAccountResult =
  | { outcome: "platform_earn"; provider: string }
  | { outcome: "native_stake" }
  | { outcome: "no_funds" }
  | { outcome: "earn_deposit_fallback" };

/**
 * Navigates to Earn (partner or deposit intent) or opens the native Ledger Live staking flow.
 * Partner staking always uses `/earn` with route state (`customDappUrl`, etc.), never `/platform/*`.
 */
export function useNavigateToStakeForAccount() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const walletState = useSelector(walletSelector);
  const { getCanStakeUsingLedgerLive, getRouteToPlatformApp } = useStake();

  const navigateToEarnScreen = useCallback(
    (state?: Record<string, string | undefined>) => {
      navigate("/earn", state ? { state } : undefined);
    },
    [navigate],
  );

  const openNoFundsStakeModal = useCallback(
    (
      account: Account | TokenAccount,
      parentAccount: Account | undefined | null,
      entryPoint?: "get-funds",
    ) => {
      dispatch(
        openModal("MODAL_NO_FUNDS_STAKE", {
          account,
          parentAccount: parentAccount ?? undefined,
          entryPoint,
        }),
      );
    },
    [dispatch],
  );

  const navigateToStakeForAccount = useCallback(
    (
      account: Account | TokenAccount,
      parentAccount: Account | undefined | null,
      {
        returnTo,
        source,
        entryPoint,
        alwaysShowNoFunds = false,
      }: NavigateToStakeForAccountOptions = {},
    ): NavigateToStakeForAccountResult => {
      if (alwaysShowNoFunds) {
        openNoFundsStakeModal(account, parentAccount, entryPoint);
        return { outcome: "no_funds" };
      }

      const platformAppRoute = getRouteToPlatformApp(account, walletState, parentAccount, returnTo);

      if (platformAppRoute) {
        navigateToEarnScreen(platformAppRoute.state);
        return { outcome: "platform_earn", provider: platformAppRoute.state.appId };
      }

      const currencyId = getAccountCurrency(account).id;

      if (getCanStakeUsingLedgerLive(currencyId)) {
        if (account.spendableBalance.isZero()) {
          openNoFundsStakeModal(account, parentAccount, entryPoint);
          return { outcome: "no_funds" };
        }

        dispatch(
          openModal("MODAL_START_STAKE", {
            account,
            parentAccount: parentAccount ?? undefined,
            source,
          }),
        );
        return { outcome: "native_stake" };
      }

      if (account.spendableBalance.isZero()) {
        openNoFundsStakeModal(account, parentAccount, entryPoint);
        return { outcome: "no_funds" };
      }

      navigateToEarnScreen({ intent: "deposit", cryptoAssetId: currencyId });
      return { outcome: "earn_deposit_fallback" };
    },
    [
      dispatch,
      getCanStakeUsingLedgerLive,
      getRouteToPlatformApp,
      navigateToEarnScreen,
      openNoFundsStakeModal,
      walletState,
    ],
  );

  return { navigateToStakeForAccount };
}
