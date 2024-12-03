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
import { isUpToDateSelector } from "~/reducers/accounts";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/useGlobalSyncState";
import { RefreshMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import Spinning from "~/components/Spinning";

type Props = StackNavigatorProps<AssetsListNavigator, ScreenName.AssetsList>;

export default function AssetsList({ route }: Props) {
  const { params } = route;
  const { t } = useTranslation();
  const showHeader = params?.showHeader;
  const sourceScreenName = params?.sourceScreenName;
  const isSyncEnabled = params?.isSyncEnabled;

  const isUpToDate = useSelector(isUpToDateSelector);
  const globalSyncState = useGlobalSyncState();
  const syncPending = globalSyncState.pending && !isUpToDate;

  return (
    <>
      <TrackScreen event="Accounts" />
      <ReactNavigationPerformanceView screenName={ScreenName.AssetsList} interactive>
        <SafeAreaView edges={["bottom", "left", "right"]} isFlex style={{ marginHorizontal: 16 }}>
          {showHeader && (
            <Text variant="h1Inter" fontSize={28} paddingY={2}>
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
          <AssetsListView sourceScreenName={sourceScreenName} isSyncEnabled={isSyncEnabled} />
        </SafeAreaView>
      </ReactNavigationPerformanceView>
    </>
  );
}
