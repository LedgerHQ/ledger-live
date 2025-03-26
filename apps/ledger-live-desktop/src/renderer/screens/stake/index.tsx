import { useCallback } from "react";
import { listCurrencies, filterCurrencies } from "@ledgerhq/live-common/currencies/helpers";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useHistory } from "react-router-dom";
import { stakeDefaultTrack } from "./constants";
import { track, trackPage } from "~/renderer/analytics/segment";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { useStake } from "~/newArch/hooks/useStake";
import { walletSelector } from "~/renderer/reducers/wallet";
import { Account, AccountLike } from "@ledgerhq/types-live";

type StakeFlowProps = {
  currencies?: string[];
  shouldRedirect?: boolean;
  alwaysShowNoFunds?: boolean;
  source?: string;
  /** "get-funds" shows different text on no funds modal if entry point is "get coins" button. Default is undefined. */
  entryPoint?: "get-funds" | undefined;
};

const useStakeFlow = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const walletState = useSelector(walletSelector);
  const { enabledCurrencies, partnerSupportedAssets, getRouteToPlatformApp } = useStake();
  const list = enabledCurrencies.concat(partnerSupportedAssets);

  const handleAccountSelected = useCallback(
    (
      account: AccountLike,
      parentAccount: Account | undefined,
      alwaysShowNoFunds: StakeFlowProps["alwaysShowNoFunds"],
      entryPoint: StakeFlowProps["entryPoint"],
      source: StakeFlowProps["source"],
      shouldRedirect: StakeFlowProps["shouldRedirect"],
    ) => {
      track("button_clicked2", {
        ...stakeDefaultTrack,
        button: "asset",
        page: history.location.pathname,
        currency: account.type === "Account" ? account?.currency?.family : account?.token?.ticker,
        account: account ? getDefaultAccountName(account) : undefined,
        parentAccount: parentAccount ? getDefaultAccountName(parentAccount) : undefined,
        drawer: "Select Account And Currency Drawer",
      });
      setDrawer();

      const platformAppRoute = getRouteToPlatformApp(account, walletState, parentAccount);

      if (alwaysShowNoFunds) {
        dispatch(
          openModal("MODAL_NO_FUNDS_STAKE", {
            account,
            parentAccount,
            entryPoint,
          }),
        );
      } else if (platformAppRoute) {
        track("button_clicked2", {
          ...stakeDefaultTrack,
          button: "delegate",
          page: history.location.pathname,
          provider: platformAppRoute.state.appId,
          currency: account.type === "Account" ? account.currency.ticker : account.token.ticker,
        });
        history.push({
          pathname: platformAppRoute.pathname.toString(),
          state: {
            ...platformAppRoute.state,
          },
        });
      } else {
        dispatch(openModal("MODAL_START_STAKE", { account, parentAccount, source }));
      }

      if (shouldRedirect) {
        console.log(`>>> shouldRedirect. Can we just default this?`);
        history.push({
          pathname: `/account/${account.id}`,
        });
      }
    },
    [dispatch, history, getRouteToPlatformApp, walletState],
  );

  const handleRequestClose = useCallback(() => {
    setDrawer();
    track("button_clicked2", {
      ...stakeDefaultTrack,
      button: "close",
      page: history.location.pathname,
    });
  }, [history.location.pathname]);

  return useCallback(
    ({
      currencies,
      shouldRedirect = true,
      alwaysShowNoFunds = false,
      source,
      entryPoint,
    }: StakeFlowProps = {}) => {
      const cryptoCurrencies = filterCurrencies(listCurrencies(true), {
        currencies: currencies || list,
      });

      trackPage("Stake", "Drawer - Choose Asset", {
        ...stakeDefaultTrack,
        page: history.location.pathname,
        type: "drawer",
      });
      setDrawer(
        SelectAccountAndCurrencyDrawer,
        {
          currencies: cryptoCurrencies,
          onAccountSelected: (account, parentAccount) =>
            handleAccountSelected(
              account,
              parentAccount,
              alwaysShowNoFunds,
              entryPoint,
              source,
              shouldRedirect,
            ),
        },
        {
          onRequestClose: handleRequestClose,
        },
      );
    },
    [handleAccountSelected, handleRequestClose, history.location.pathname, list],
  );
};

export default useStakeFlow;
