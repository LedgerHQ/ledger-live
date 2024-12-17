import React, { useCallback } from "react";
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

type Props = StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>;

export default function AccountsList({ route }: Props) {
  const { params } = route;
  const { t } = useTranslation();
  const canAddAccount = params?.canAddAccount;
  const showHeader = params?.showHeader;
  const sourceScreenName = params?.sourceScreenName;
  const isSyncEnabled = params?.isSyncEnabled;
  const specificAccounts = params?.specificAccounts;
  const navigation = useNavigation();

  const isTokenAccount = specificAccounts && isTokenAccountChecker(specificAccounts[0]);
  const ticker = specificAccounts
    ? isTokenAccount
      ? (specificAccounts[0] as TokenAccount).token.ticker
      : (specificAccounts[0] as Account).currency.ticker
    : undefined;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  const onAddAccount = useCallback(() => {
    if (!specificAccounts) return;

    const currency = getAccountCurrency(specificAccounts?.[0]);

    if (currency && currency.type === "TokenCurrency") {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: undefined,
        params: {
          token: currency,
        },
      });
    } else {
      navigation.navigate(NavigatorName.AddAccounts, {
        screen: undefined,
        currency,
      });
    }
  }, [navigation, specificAccounts]);

  const onClick = specificAccounts ? onAddAccount : undefined;

  return (
    <>
      <TrackScreen event="Accounts" />
      <ReactNavigationPerformanceView screenName={ScreenName.AccountsList} interactive>
        <SafeAreaView edges={["left", "right", "bottom"]} isFlex style={{ marginHorizontal: 16 }}>
          {showHeader && (
            <Text variant="h1Inter" fontSize={28} paddingY={2}>
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
          {canAddAccount && <AddAccountButton sourceScreenName="Accounts" onClick={onClick} />}
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
