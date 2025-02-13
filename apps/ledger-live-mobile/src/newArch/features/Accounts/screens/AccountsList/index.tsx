import React from "react";
import AccounstListView from "LLM/features/Accounts/components/AccountsListView";
import { ScreenName } from "~/const";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import SafeAreaView from "~/components/SafeAreaView";
import { Flex, Text } from "@ledgerhq/native-ui";
import AddAccountButton from "LLM/features/Accounts/components/AddAccountButton";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "~/analytics";
import { RefreshMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import Spinning from "~/components/Spinning";
import useAccountsListViewModel, { type Props } from "./useAccountsListViewModel";
import AccountsEmptyList from "LLM/components/EmptyList/AccountsEmptyList";

export type ViewProps = Readonly<ReturnType<typeof useAccountsListViewModel>>;

function View({
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
}: ViewProps) {
  const { t } = useTranslation();

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
          {hasNoAccount ? (
            <AccountsEmptyList sourceScreenName={sourceScreenName} />
          ) : (
            <AccounstListView
              sourceScreenName={sourceScreenName}
              isSyncEnabled={isSyncEnabled}
              specificAccounts={specificAccounts}
            />
          )}
        </SafeAreaView>
      </ReactNavigationPerformanceView>
    </>
  );
}

const AccountsList = (props: Props) => <View {...useAccountsListViewModel(props)} />;

export default AccountsList;
