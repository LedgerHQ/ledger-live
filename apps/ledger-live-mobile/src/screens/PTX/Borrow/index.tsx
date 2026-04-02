import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex } from "@ledgerhq/native-ui";
import InfiniteLoader from "~/components/InfiniteLoader";
import React, { memo, useMemo } from "react";
import { Platform, View } from "react-native";
import { useSelector } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import TrackScreen from "~/analytics/TrackScreen";
import GenericErrorView from "~/components/GenericErrorView";
import { BorrowLiveAppNavigatorParamList } from "~/components/RootNavigator/types/BorrowLiveAppNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useSettings } from "~/hooks";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { BorrowWebview } from "./BorrowWebview";

export type Props = StackNavigatorProps<BorrowLiveAppNavigatorParamList, ScreenName.Borrow>;

const appManifestNotFoundError = new Error("Borrow App not found");

const DEFAULT_MANIFEST_ID =
  DEFAULT_FEATURES.ptxBorrowLiveApp?.params?.manifest_id ?? "borrow";

export const BorrowScreen = memo(Borrow);

function Borrow({ route }: Props) {
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const devMode = useEnv("MANAGER_DEV_MODE").toString();
  const { platform: _appId, ...params } = route.params || {};
  const searchParams = useMemo(
    () => (route.path ? new URL("ledgerlive://" + route.path).searchParams : new URLSearchParams()),
    [route.path],
  );

  const borrowFlag = useFeature("ptxBorrowLiveApp");
  const borrowManifestId = borrowFlag?.enabled
    ? borrowFlag.params?.manifest_id
    : DEFAULT_MANIFEST_ID;

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(borrowManifestId);
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(borrowManifestId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest: LiveAppManifest | undefined = localManifest ?? remoteManifest;

  if (!remoteLiveAppState.isLoading && !manifest) {
    console.error(appManifestNotFoundError);
  }

  const webviewInputs = useMemo(
    () => ({
      theme,
      lang: language,
      locale: language,
      currencyTicker,
      devMode,
      discreetMode: discreet ? "true" : "false",
      OS: Platform.OS,
      ...params,
      ...Object.fromEntries(searchParams.entries()),
    }),
    [theme, language, currencyTicker, devMode, discreet, params, searchParams],
  );

  if (manifest) {
    return (
      <View testID="borrow-screen" style={{ flex: 1 }}>
        <TrackScreen category="BorrowDashboard" name="Borrow" />
        <BorrowWebview manifest={manifest} inputs={webviewInputs} />
      </View>
    );
  }

  return (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={appManifestNotFoundError} />
      )}
    </Flex>
  );
}
