import React, { useCallback, useMemo } from "react";
import AccounstListView from "LLM/features/Accounts/components/AccountsListView";
import { NavigatorName, ScreenName } from "~/const";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import { Flex, Text } from "@ledgerhq/native-ui";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import { AccountsListNavigator } from "./types";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "~/analytics";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { RefreshMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import { useSelector } from "react-redux";
import Spinning from "~/components/Spinning";
import { isUpToDateSelector } from "~/reducers/accounts";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  getAccountCurrency,
  isTokenAccount as isTokenAccountChecker,
} from "@ledgerhq/live-common/account/index";
import { useNavigation } from "@react-navigation/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { LoadingBasedGroupedCurrencies, LoadingStatus } from "@ledgerhq/live-common/deposit/type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { TrackingEvent } from "../../enums";
import { parseBoolean } from "LLM/utils/parseBoolean";
import { AddAccountContexts } from "../AddAccount/enums";
type Props = StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>;

export default function AccountsList({ route }: Props) {
  const { params } = route;
  const { t } = useTranslation();

  const canAddAccount = params?.canAddAccount ? parseBoolean(params?.canAddAccount) : false;
  const showHeader = params?.showHeader ? parseBoolean(params?.showHeader) : false;
  const isSyncEnabled = params?.isSyncEnabled ? parseBoolean(params?.isSyncEnabled) : false;
  const sourceScreenName = params?.sourceScreenName;

  const specificAccounts = params?.specificAccounts;
  const navigation = useNavigation();
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");

  const isTokenAccount = specificAccounts && isTokenAccountChecker(specificAccounts[0]);
  const ticker = specificAccounts
    ? isTokenAccount
      ? (specificAccounts[0] as TokenAccount).token.ticker
      : (specificAccounts[0] as Account).currency.ticker
    : undefined;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  const currency = specificAccounts ? getAccountCurrency(specificAccounts?.[0]) : null;

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const isAddAccountCtaDisabled = [LoadingStatus.Pending, LoadingStatus.Error].includes(
    providersLoadingStatus,
  );

  const { currenciesByProvider } = result;

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

    if (llmNetworkBasedAddAccountFlow?.enabled && currency) {
      if (provider && provider?.currenciesByNetwork.length > 1) {
        navigation.navigate(NavigatorName.AssetSelection, {
          screen: ScreenName.SelectNetwork,
          params: {
            currency: currency.id,
            context: AddAccountContexts.AddAccounts,
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
  }, [currency, llmNetworkBasedAddAccountFlow?.enabled, navigation, provider, specificAccounts]);

  const onClick = specificAccounts ? onAddAccount : undefined;
  const pageTrackingEvent = specificAccounts
    ? TrackingEvent.AccountListSummary
    : TrackingEvent.AccountsList;
  const currencyToTrack = specificAccounts ? currency?.name : undefined;
  return (
    <>
      <TrackScreen name={pageTrackingEvent} source={sourceScreenName} currency={currencyToTrack} />
      <ReactNavigationPerformanceView screenName={ScreenName.AccountsList} interactive>
        <SafeAreaView edges={["left", "right", "bottom"]} isFlex style={{ marginHorizontal: 16 }}>
          {showHeader && (
            <Text variant="h1Inter" fontWeight="semiBold" fontSize={28} paddingY={2}>
              {ticker
                ? t("accounts.cryptoAccountsTitle", { currencyTicker: ticker })
                : t("accounts.title")}
            </Text>
          )}
          {syncPending && (
            <Flex flexDirection="row" alignItems="center" my={3}>
              <Spinning clockwise>
                <RefreshMedium size={20} color="neutral.c80" />
              </Spinning>
              <Text color="neutral.c80" ml={2}>
                {t("portfolio.syncPending")}
              </Text>
            </Flex>
          )}
          {canAddAccount && (
            <AddAccountButton
              disabled={isAddAccountCtaDisabled}
              sourceScreenName={pageTrackingEvent}
              currency={currencyToTrack}
              onClick={onClick}
            />
          )}
          <AccounstListView
            sourceScreenName={sourceScreenName}
            isSyncEnabled={isSyncEnabled}
            specificAccounts={specificAccounts}
          />
        </SafeAreaView>
      </ReactNavigationPerformanceView>
    </>
  );
}
