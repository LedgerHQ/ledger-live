import { useCallback } from "react";
import SelectAccountAndCurrencyDrawer from "~/renderer/drawers/DataSelector/SelectAccountAndCurrencyDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useHistory } from "react-router-dom";
import { stakeDefaultTrack } from "./constants";
import { track, trackPage } from "~/renderer/analytics/segment";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { useStake } from "LLD/hooks/useStake";
import { walletSelector } from "~/renderer/reducers/wallet";
import { Account, AccountLike } from "@ledgerhq/types-live";
import {
  ModularDrawerLocation,
  openAssetAndAccountDrawer,
  useModularDrawerVisibility,
} from "LLD/features/ModularDrawer";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDrawer";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useLazyLedgerCurrency } from "@ledgerhq/live-common/dada-client/hooks/useLazyLedgerCurrency";

const DRAWER_FLOW = "stake";

export type StakeFlowProps = {
  currencies?: string[];
  shouldRedirect?: boolean;
  alwaysShowNoFunds?: boolean;
  source?: string;
  /** "get-funds" shows different text on no funds modal if entry point is "get coins" button. Default is undefined. */
  entryPoint?: "get-funds" | undefined;
  returnTo?: string;
};

const useStakeFlow = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const walletState = useSelector(walletSelector);
  const { enabledCurrencies, partnerSupportedAssets, getRouteToPlatformApp } = useStake();
  const list = enabledCurrencies.concat(partnerSupportedAssets);
  const earnDrawerConfigurationFlag = useFeature("ptxEarnDrawerConfiguration");

  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "lldModularDrawer",
  });

  const modularDrawerVisible = isModularDrawerVisible({
    location: ModularDrawerLocation.LIVE_APP,
    liveAppId: "earn",
  });

  const handleAccountSelected = useCallback(
    (
      account: AccountLike,
      parentAccount: Account | undefined,
      alwaysShowNoFunds: StakeFlowProps["alwaysShowNoFunds"],
      entryPoint: StakeFlowProps["entryPoint"],
      source: StakeFlowProps["source"],
      shouldRedirect: StakeFlowProps["shouldRedirect"],
      returnTo?: string,
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

      if (alwaysShowNoFunds || account.spendableBalance.isZero()) {
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
            returnTo,
          },
        });
      } else {
        dispatch(openModal("MODAL_START_STAKE", { account, parentAccount, source }));
      }

      const isNoFundsFlow = account.spendableBalance.isZero();

      if (shouldRedirect && !platformAppRoute && !isNoFundsFlow) {
        history.push({
          pathname: returnTo ?? `/account/${account.id}`,
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

  const { getLedgerCurrencies } = useLazyLedgerCurrency({
    product: "lld",
    version: __APP_VERSION__,
  });

  /**
   * LIVE-23210: Remove legacy currency handling when MAD is fully enabled
   * This function contains legacy code that should be removed once MAD fully enabled.
   */
  return useCallback(
    async ({
      currencies,
      shouldRedirect = true,
      alwaysShowNoFunds = false,
      source,
      entryPoint,
      returnTo,
    }: StakeFlowProps = {}) => {
      dispatch(setFlowValue(DRAWER_FLOW));
      dispatch(setSourceValue(source || ""));

      const listCurrencies = currencies || list;
      trackPage("Stake", "Drawer - Choose Asset", {
        ...stakeDefaultTrack,
        page: history.location.pathname,
        type: "drawer",
      });

      const onSuccess = (account: AccountLike, parentAccount?: Account) => {
        handleAccountSelected(
          account,
          parentAccount,
          alwaysShowNoFunds,
          entryPoint,
          source,
          shouldRedirect,
          returnTo,
        );
      };

      if (modularDrawerVisible) {
        // Add APY configuration for earn/stake functionality
        const earnDrawerConfiguration = earnDrawerConfigurationFlag?.enabled
          ? earnDrawerConfigurationFlag.params
          : {};
        openAssetAndAccountDrawer({
          currencies: listCurrencies,
          useCase: "earn",
          onSuccess,
          onCancel: handleRequestClose,
          areCurrenciesFiltered: listCurrencies.length > 0,
          drawerConfiguration: earnDrawerConfiguration,
        });
      } else {
        // TO REMOVE when MAD enabled and we remove legacy currencies
        const cryptoCurrencies = (await getLedgerCurrencies(listCurrencies)) ?? [];

        setDrawer(
          SelectAccountAndCurrencyDrawer,
          {
            currencies: cryptoCurrencies,
            flow: DRAWER_FLOW,
            source: source ?? "",
            onAccountSelected: (account, parentAccount) =>
              handleAccountSelected(
                account,
                parentAccount,
                alwaysShowNoFunds,
                entryPoint,
                source,
                shouldRedirect,
                returnTo,
              ),
          },
          {
            onRequestClose: handleRequestClose,
          },
        );
      }
    },
    [
      dispatch,
      getLedgerCurrencies,
      list,
      history.location.pathname,
      modularDrawerVisible,
      handleAccountSelected,
      earnDrawerConfigurationFlag,
      handleRequestClose,
    ],
  );
};

export default useStakeFlow;
