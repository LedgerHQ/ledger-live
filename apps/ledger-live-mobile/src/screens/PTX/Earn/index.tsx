import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import React, { Fragment, memo, useMemo } from "react";
import { Platform, View } from "react-native";
import { useSelector } from "~/context/hooks";
import { useTheme } from "styled-components/native";
import TrackScreen from "~/analytics/TrackScreen";
import GenericErrorView from "~/components/GenericErrorView";
import { EarnLiveAppNavigatorParamList } from "~/components/RootNavigator/types/EarnLiveAppNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import { ScreenName } from "~/const";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useSettings } from "~/hooks";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { EarnWebview } from "./EarnWebview";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";
import { EarnV2Webview } from "./EarnV2Webview";

export type Props = StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>;

const appManifestNotFoundError = new Error("Earn App not found");

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_EARN_MANIFEST_ID || DEFAULT_FEATURES.ptxEarnLiveApp.params?.manifest_id;

/** Persists across remounts (e.g. Strict Mode in dev) to avoid loader flicker when provider rehydrates. */
let lastKnownManifest: LiveAppManifest | undefined;

export const EarnScreen = memo(Earn);

function Earn({ route }: Props) {
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const devMode = useEnv("MANAGER_DEV_MODE").toString();
  const { platform: appId, ...params } = route.params || {};
  const searchParams = useMemo(
    () => (route.path ? new URL("ledgerlive://" + route.path).searchParams : new URLSearchParams()),
    [route.path],
  );
  const hideMainNavigator = useMemo(
    () => ["deposit", "withdraw"].includes(params?.intent ?? ""),
    [params],
  );

  const earnFlag = useFeature("ptxEarnLiveApp");
  const earnManifestId = earnFlag?.enabled ? earnFlag.params?.manifest_id : DEFAULT_MANIFEST_ID;
  const { isEnabled: isLwm40Enabled } = useWalletFeaturesConfig("mobile");
  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(earnManifestId);
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(earnManifestId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest: LiveAppManifest | undefined = !localManifest ? remoteManifest : localManifest;

  if (manifest) {
    lastKnownManifest = manifest;
  }

  const countryLocale = getCountryLocale();

  const stakePrograms = useVersionedStakePrograms();
  const { stakeProgramsParam } = useMemo(
    () => stakeProgramsToEarnParam(stakePrograms),
    [stakePrograms],
  );
  const stakeCurrenciesParam = useMemo(() => stakePrograms?.params?.list, [stakePrograms]);
  const ethDepositCohort = useMemo(
    () => getEthDepositScreenSetting(stakePrograms),
    [stakePrograms],
  );

  if (!remoteLiveAppState.isLoading && !manifest) {
    console.error(appManifestNotFoundError);
  }
  const Container = hideMainNavigator ? Fragment : TabBarSafeAreaView;

  const webviewInputs = useMemo(
    () => ({
      theme,
      lang: language,
      locale: language,
      countryLocale,
      currencyTicker,
      devMode,
      discreetMode: discreet ? "true" : "false",
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam?.length
        ? JSON.stringify(stakeCurrenciesParam)
        : undefined,
      OS: Platform.OS,
      ethDepositCohort,
      uiVersion: "v1",
      ...params,
      ...Object.fromEntries(searchParams.entries()),
    }),
    [
      theme,
      language,
      countryLocale,
      currencyTicker,
      devMode,
      discreet,
      stakeProgramsParam,
      stakeCurrenciesParam,
      ethDepositCohort,
      params,
      searchParams,
    ],
  );

  /** V2: single shell (background + content). Use lastKnownManifest whenever manifest is missing so remount (e.g. dev Strict Mode) keeps showing webview instead of loader. */
  if (isLwm40Enabled) {
    const displayManifest = manifest ?? lastKnownManifest;
    if (!displayManifest && !remoteLiveAppState.isLoading && remoteLiveAppState.error) {
      lastKnownManifest = undefined;
    }
    return (
      <EarnV2Webview
        manifest={displayManifest}
        inputs={webviewInputs}
        isLwm40Enabled={isLwm40Enabled}
        hideMainNavigator={hideMainNavigator}
        appManifestNotFoundError={appManifestNotFoundError}
      />
    );
  }
  /** V1: no background */
  if (manifest) {
    return (
      <View testID="earn-screen" style={{ flex: 1 }}>
        <Container>
          <TrackScreen category="EarnDashboard" name="Earn" />
          <EarnWebview manifest={manifest} inputs={webviewInputs} />
        </Container>
      </View>
    );
  }

  /** V1: no manifest yet, loader or error without background */
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
