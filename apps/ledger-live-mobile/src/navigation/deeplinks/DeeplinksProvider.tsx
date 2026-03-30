import React, { useEffect, useRef } from "react";
import { useSelector } from "~/context/hooks";
import { Platform, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { navigationRef, isReadyRef } from "../../rootnavigation";
import { ScreenName } from "~/const";
import { useGeneralTermsAccepted } from "~/logic/terms";
import { lightTheme, darkTheme, Theme } from "../../colors";
import { logLastStartupEvents } from "LLM/utils/logLastStartupEvents";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import { STARTUP_EVENTS } from "LLM/utils/resolveStartupEvents";
import { AppLoadingManager } from "LLM/features/LaunchScreen";
import { SplashScreenHandle } from "LLM/features/LaunchScreen/SplashScreenHandle";
import { useLinking } from "./useLinking";

const themes: { [key: string]: Theme } = {
  light: lightTheme,
  dark: darkTheme,
};

const SPLASH_SCREEN_BACKGROUND_COLOR = "#18171A";
const styles = StyleSheet.create({
  appBackground: {
    flex: 1,
    backgroundColor: SPLASH_SCREEN_BACKGROUND_COLOR,
  },
});

const emptyObject: LiveAppManifest[] = [];

function handleStartComplete() {
  logLastStartupEvents(STARTUP_EVENTS.NAV_READY);
}

export const DeeplinksProvider = ({
  children,
  resolvedTheme,
}: {
  children: React.ReactNode;
  resolvedTheme: "light" | "dark";
}) => {
  logStartupEvent("DeeplinksProvider render");

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { state } = useRemoteLiveAppContext();
  const liveAppProviderInitialized = !!state.value || !!state.error;
  const manifests = state?.value?.liveAppByIndex || emptyObject;
  const userAcceptedTerms = useGeneralTermsAccepted();
  const buySellUiFlag = useFeature("buySellUi");
  const llmAccountListUI = useFeature("llmAccountListUI");
  const { shouldDisplayMarketBanner, shouldDisplayWallet40MainNav } =
    useWalletFeaturesConfig("mobile");

  const buySellUiManifestId = buySellUiFlag?.params?.manifestId;
  const AccountsListScreenName = llmAccountListUI?.enabled
    ? ScreenName.AccountsList
    : ScreenName.Accounts;

  const linking = useLinking({
    hasCompletedOnboarding,
    userAcceptedTerms,
    buySellUiManifestId,
    llmAccountListUIEnabled: llmAccountListUI?.enabled,
    AccountsListScreenName,
    shouldDisplayMarketBanner,
    shouldDisplayWallet40MainNav,
    liveAppProviderInitialized,
    manifests,
  });

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const theme = themes[resolvedTheme] as ReactNavigation.Theme;

  const [isReady, setIsReady] = React.useState(false);
  const [isNavigationContainerReady, setIsNavigationContainerReady] = React.useState(false);

  useEffect(() => {
    if (userAcceptedTerms === null) return;
    setIsReady(true);
  }, [userAcceptedTerms]);

  useEffect(
    () => () => {
      if (isReadyRef.current) {
        isReadyRef.current = false;
      }
    },
    [],
  );

  const animSplash = useFeature("llmAnimatedSplashScreen");
  const showAnimatedSplashScreen = useRef(
    (animSplash?.enabled && animSplash.params?.[Platform.OS]) ?? true,
  );
  const SplashScreenComponent = useRef(
    showAnimatedSplashScreen.current ? AppLoadingManager : SplashScreenHandle,
  );

  return (
    <View style={styles.appBackground}>
      <SplashScreenComponent.current
        isNavigationReady={isReady && isNavigationContainerReady}
        onAppReady={handleStartComplete}
      >
        {isReady ? (
          <NavigationContainer
            theme={theme}
            linking={linking}
            ref={navigationRef}
            onReady={() => {
              setIsNavigationContainerReady(true);
              isReadyRef.current = true;
            }}
          >
            {children}
          </NavigationContainer>
        ) : null}
      </SplashScreenComponent.current>
    </View>
  );
};
