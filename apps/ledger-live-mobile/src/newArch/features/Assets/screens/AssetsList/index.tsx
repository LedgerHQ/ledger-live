import React from "react";
import AssetsListView from "LLM/features/Assets/components/AssetsListView";
import { ScreenName } from "~/const";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SafeAreaView from "~/components/SafeAreaView";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AssetsListNavigator } from "./types";
import { useTranslation } from "react-i18next";
import { TrackScreen } from "~/analytics";
import { useSelector } from "react-redux";
import { hasNoAccountsSelector, isUpToDateSelector } from "~/reducers/accounts";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { RefreshMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import Spinning from "~/components/Spinning";
import { parseBoolean } from "LLM/utils/parseBoolean";
import AccountsEmptyList from "LLM/components/EmptyList/AccountsEmptyList";

type Props = StackNavigatorProps<AssetsListNavigator, ScreenName.AssetsList>;

export default function AssetsList({ route }: Props) {
  const { params } = route;
  const { t } = useTranslation();
  const hasNoAccount = useSelector(hasNoAccountsSelector);

  const showHeader =
    (params?.showHeader ? parseBoolean(params?.showHeader) : false) && !hasNoAccount;
  const isSyncEnabled = params?.isSyncEnabled ? parseBoolean(params?.isSyncEnabled) : false;
  const sourceScreenName = params?.sourceScreenName;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  return (
    <>
      <TrackScreen name="Assets" source={sourceScreenName} />
      <ReactNavigationPerformanceView screenName={ScreenName.AssetsList} interactive>
        <SafeAreaView edges={["left", "right", "bottom"]} isFlex style={{ marginHorizontal: 16 }}>
          {showHeader && (
            <Text variant="h1Inter" fontWeight="semiBold" fontSize={28} paddingY={2}>
              {t("assets.title")}
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
          {hasNoAccount ? (
            <AccountsEmptyList sourceScreenName={sourceScreenName} />
          ) : (
            <AssetsListView sourceScreenName={sourceScreenName} isSyncEnabled={isSyncEnabled} />
          )}
        </SafeAreaView>
      </ReactNavigationPerformanceView>
    </>
  );
}
