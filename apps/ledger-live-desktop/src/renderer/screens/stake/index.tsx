import { useCallback, useMemo } from "react";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useNavigate, useLocation } from "react-router";
import { stakeDefaultTrack } from "./constants";
import { track, trackPage } from "~/renderer/analytics/segment";
import { useDispatch } from "LLD/hooks/redux";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { useStake } from "LLD/hooks/useStake";
import { useNavigateToStakeForAccount } from "LLD/hooks/useNavigateToStakeForAccount";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { setFlowValue, setSourceValue } from "~/renderer/reducers/modularDialog";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";
import { setOriginFlow } from "~/renderer/analytics/originFlow";
import { useFeature } from "@features/platform-feature-flags";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";

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
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { navigateToStakeForAccount } = useNavigateToStakeForAccount();
  const { enabledCurrencies, partnerSupportedAssets } = useStake();
  const list = useMemo(() => {
    return enabledCurrencies.concat(partnerSupportedAssets);
  }, [enabledCurrencies, partnerSupportedAssets]);
  const earnDrawerConfigurationFlag = useFeature("ptxEarnDrawerConfiguration");

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
        page: location.pathname,
        currency: account.type === "Account" ? account?.currency?.family : account?.token?.ticker,
        account: account ? getDefaultAccountName(account) : undefined,
        parentAccount: parentAccount ? getDefaultAccountName(parentAccount) : undefined,
        drawer: "Select Account And Currency Drawer",
      });
      setDrawer();

      const outcome = navigateToStakeForAccount(account, parentAccount, {
        returnTo,
        alwaysShowNoFunds,
        entryPoint,
        source,
      });

      if (outcome.outcome === "platform_earn") {
        track("button_clicked2", {
          ...stakeDefaultTrack,
          button: "delegate",
          page: location.pathname,
          provider: outcome.provider,
          currency: account.type === "Account" ? account.currency.ticker : account.token.ticker,
        });
      }

      if (shouldRedirect && outcome.outcome === "native_stake") {
        navigate(returnTo ?? `/account/${account.id}`);
      }
    },
    [navigate, location, navigateToStakeForAccount],
  );

  const handleRequestClose = useCallback(() => {
    setDrawer();
    track("button_clicked2", {
      ...stakeDefaultTrack,
      button: "close",
      page: location.pathname,
    });
  }, [location.pathname]);

  const { openAssetAndAccount } = useOpenAssetAndAccount();

  return useCallback(
    ({
      currencies,
      shouldRedirect = true,
      alwaysShowNoFunds = false,
      source,
      entryPoint,
      returnTo,
    }: StakeFlowProps = {}) => {
      dispatch(setFlowValue(DRAWER_FLOW));
      setOriginFlow(HOOKS_TRACKING_LOCATIONS.stake);
      dispatch(setSourceValue(source || ""));

      const cryptoCurrencies = currencies || list;

      trackPage("Stake", "Drawer - Choose Asset", {
        ...stakeDefaultTrack,
        page: location.pathname,
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

      // Add APY configuration for earn/stake functionality
      const earnDrawerConfiguration = earnDrawerConfigurationFlag?.enabled
        ? earnDrawerConfigurationFlag.params
        : {};
      openAssetAndAccount({
        currencies: cryptoCurrencies,
        useCase: "earn",
        onSuccess,
        onCancel: handleRequestClose,
        areCurrenciesFiltered: cryptoCurrencies.length > 0,
        drawerConfiguration: earnDrawerConfiguration,
      });
    },
    [
      dispatch,
      earnDrawerConfigurationFlag,
      handleAccountSelected,
      handleRequestClose,
      location.pathname,
      list,
      openAssetAndAccount,
    ],
  );
};

export default useStakeFlow;
