import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  getAccountCurrency,
  isTokenAccount as isTokenAccountChecker,
} from "@ledgerhq/live-common/account/index";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { TokenAccount, Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { hasNoAccountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { parseBoolean } from "LLM/utils/parseBoolean";
import { AddAccountContexts } from "../AddAccount/enums";
import { TrackingEvent } from "../../enums";
import { AccountsListNavigator } from "./types";
import { useNavigation } from "@react-navigation/core";

export type Props = BaseComposite<
  StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>
>;

export default function useNoAssociatedAccountsViewModel({ route }: Props) {
  const navigation = useNavigation();
  const { params } = route;

  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const isLlmNetworkBasedAddAccountFlowEnabled = llmNetworkBasedAddAccountFlow?.enabled;

  const hasNoAccount = useSelector(hasNoAccountsSelector);
  const isUpToDate = useSelector(isUpToDateSelector);

  const canAddAccount =
    (params?.canAddAccount ? parseBoolean(params?.canAddAccount) : false) && !hasNoAccount;
  const showHeader = params?.showHeader ? parseBoolean(params?.showHeader) : false;
  const isSyncEnabled = params?.isSyncEnabled ? parseBoolean(params?.isSyncEnabled) : false;
  const sourceScreenName = params?.sourceScreenName;
  const specificAccounts = params?.specificAccounts;

  const ticker = getTicker(specificAccounts);

  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  const currency = specificAccounts ? getAccountCurrency(specificAccounts?.[0]) : null;

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider } = result;

  const isAddAccountCtaDisabled = [LoadingStatus.Pending, LoadingStatus.Error].includes(
    providersLoadingStatus,
  );

  const provider = useMemo(
    () =>
      currency &&
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
        ),
      ),
    [currenciesByProvider, currency],
  );

  const onAddAccount = useCallback(() => {
    if (!specificAccounts) return;

    if (isLlmNetworkBasedAddAccountFlowEnabled && currency) {
      if (provider && provider?.currenciesByNetwork.length > 1) {
        navigation.navigate(NavigatorName.AssetSelection, {
          screen: ScreenName.SelectNetwork,
          params: {
            currency: currency.id,
            context: AddAccountContexts.AddAccounts,
            sourceScreenName: ScreenName.AccountsList,
          },
        });
      } else {
        navigation.navigate(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency: currency as CryptoCurrency,
            context: AddAccountContexts.AddAccounts,
          },
        });
      }
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: undefined,
        currency,
      });
    }
  }, [currency, isLlmNetworkBasedAddAccountFlowEnabled, navigation, provider, specificAccounts]);

  const onClick = specificAccounts ? onAddAccount : undefined;

  const pageTrackingEvent = specificAccounts
    ? TrackingEvent.AccountListSummary
    : TrackingEvent.AccountsList;
  const currencyToTrack = specificAccounts ? currency?.name : undefined;

  return {
    hasNoAccount,
    isSyncEnabled,
    canAddAccount,
    showHeader,
    isAddAccountCtaDisabled,
    pageTrackingEvent,
    currencyToTrack,
    ticker,
    syncPending,
    sourceScreenName,
    specificAccounts,
    onClick,
  };
}

function getTicker(specificAccounts: Account[] | TokenAccount[] | undefined) {
  const isTokenAccount = specificAccounts && isTokenAccountChecker(specificAccounts[0]);

  if (!specificAccounts) return undefined;
  if (isTokenAccount) return (specificAccounts[0] as TokenAccount).token.ticker;
  return (specificAccounts[0] as Account).currency.ticker;
}
