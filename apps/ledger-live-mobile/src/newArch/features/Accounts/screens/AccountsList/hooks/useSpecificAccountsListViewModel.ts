import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasNoAccountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { parseBoolean } from "LLM/utils/parseBoolean";
import { TrackingEvent } from "../../../enums";
import { AccountsListNavigator } from "../types";
import { useNavigation } from "@react-navigation/core";
import {
  navigateToAssetSelection,
  navigateToDeviceSelection,
  navigateToNetworkSelection,
} from "../utils/navigation";
import { getTicker } from "../utils/getTicker";
import { Account, TokenAccount } from "@ledgerhq/types-live";

export type Props = BaseComposite<
  StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>
> & {
  specificAccounts: Account[] | TokenAccount[];
};

export type SpecificAccountsType = ReturnType<typeof useSpecificAccountsListViewModel>;

export default function useSpecificAccountsListViewModel({ route, specificAccounts }: Props) {
  const navigation = useNavigation();
  const { params } = route;

  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const isLlmNetworkBasedAddAccountFlowEnabled = llmNetworkBasedAddAccountFlow?.enabled;

  const hasNoAccount = useSelector(hasNoAccountsSelector);
  const isUpToDate = useSelector(isUpToDateSelector);

  const canAddAccount =
    (params?.canAddAccount ? parseBoolean(params?.canAddAccount) : false) && !hasNoAccount;
  const showHeader =
    (params?.showHeader ? parseBoolean(params?.showHeader) : false) && !hasNoAccount;
  const isSyncEnabled = params?.isSyncEnabled ? parseBoolean(params?.isSyncEnabled) : false;
  const sourceScreenName = params?.sourceScreenName;

  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const ticker = getTicker(specificAccounts[0]);
  const currency = getAccountCurrency(specificAccounts[0]);
  const { currenciesByProvider } = result;

  const provider = useMemo(
    () =>
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
        ),
      ),
    [currenciesByProvider, currency],
  );

  const isAddAccountCtaDisabled = [LoadingStatus.Pending, LoadingStatus.Error].includes(
    providersLoadingStatus,
  );

  const hasNetworksProviders = provider && currenciesByProvider.length > 1;

  const onAddAccount = () => {
    if (isLlmNetworkBasedAddAccountFlowEnabled && currency) {
      if (hasNetworksProviders) {
        navigateToNetworkSelection({
          navigation,
          currency,
        });
      } else {
        navigateToDeviceSelection({
          navigation,
          currency,
        });
      }
    } else {
      navigateToAssetSelection({
        navigation,
        currency,
      });
    }
  };

  const onClick = onAddAccount;
  const pageTrackingEvent = TrackingEvent.AccountListSummary;
  const currencyToTrack = currency.name;

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
