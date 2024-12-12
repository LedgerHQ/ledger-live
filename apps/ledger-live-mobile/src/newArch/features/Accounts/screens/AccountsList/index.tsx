import React from "react";
import AccounstListView from "LLM/features/Accounts/components/AccountsListView";
import { ScreenName } from "~/const";
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

type Props = StackNavigatorProps<AccountsListNavigator, ScreenName.AccountsList>;

export default function AccountsList({ route }: Props) {
  const { params } = route;
  const { t } = useTranslation();
  const canAddAccount = params?.canAddAccount;
  const showHeader = params?.showHeader;
  const sourceScreenName = params?.sourceScreenName;
  const isSyncEnabled = params?.isSyncEnabled;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  return (
    <>
      <TrackScreen event="Accounts" />
      <ReactNavigationPerformanceView screenName={ScreenName.AccountsList} interactive>
        <SafeAreaView edges={["bottom", "left", "right"]} isFlex style={{ marginHorizontal: 16 }}>
          {showHeader && (
            <Text variant="h1Inter" fontSize={28} paddingY={2}>
              {t("accounts.title")}
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
          {canAddAccount && <AddAccountButton sourceScreenName="Accounts" />}
          <AccounstListView sourceScreenName={sourceScreenName} isSyncEnabled={isSyncEnabled} />
        </SafeAreaView>
      </ReactNavigationPerformanceView>
    </>
  );
}
