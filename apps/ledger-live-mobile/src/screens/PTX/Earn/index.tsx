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
import { Platform } from "react-native";
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

export type Props = StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>;

const appManifestNotFoundError = new Error("Earn App not found");

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_EARN_MANIFEST_ID || DEFAULT_FEATURES.ptxEarnLiveApp.params?.manifest_id;

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
  const earnUiFlag = useFeature("ptxEarnUi");
  const earnUiVersion = earnUiFlag?.params?.value ?? "v1";
  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(earnManifestId);
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(earnManifestId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest: LiveAppManifest | undefined = !localManifest ? remoteManifest : localManifest;
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

  return manifest ? (
    <Container>
      <TrackScreen category="EarnDashboard" name="Earn" />
      <EarnWebview
        manifest={manifest}
        inputs={{
          theme,
          lang: language,
          locale: language, // LLM doesn't support different locales. By doing this we don't have to have specific LLM/LLD logic in earn, and in future if LLM supports locales we will change this from `language` to `locale`
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
          uiVersion: earnUiVersion,
          ...params,
          ...Object.fromEntries(searchParams.entries()),
        }}
      />
    </Container>
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={appManifestNotFoundError} />
      )}
    </Flex>
  );
}
