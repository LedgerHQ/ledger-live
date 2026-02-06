import React, { useEffect, lazy, Suspense } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import TrackAppStart from "~/renderer/components/TrackAppStart";
import { LiveApp } from "~/renderer/screens/platform";
import { BridgeSyncProvider } from "~/renderer/bridge/BridgeSyncContext";
import { WalletSyncProvider } from "LLD/features/WalletSync/components/WalletSyncContext";
import { SyncNewAccounts } from "~/renderer/bridge/SyncNewAccounts";
import Box from "~/renderer/components/Box/Box";
import { useListenToHidDevices } from "./hooks/useListenToHidDevices";
import ExportLogsButton from "~/renderer/components/ExportLogsButton";
import Idler from "~/renderer/components/Idler";
import IsUnlocked from "~/renderer/components/IsUnlocked";
import AppRegionDrag from "~/renderer/components/AppRegionDrag";
import IsNewVersion from "~/renderer/components/IsNewVersion";
import IsSystemLanguageAvailable from "~/renderer/components/IsSystemLanguageAvailable";
import IsTermOfUseUpdated from "./components/IsTermOfUseUpdated";
import KeyboardContent from "~/renderer/components/KeyboardContent";
import MainSideBar from "~/renderer/components/MainSideBar";
import SideBar from "LLD/components/SideBar";
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import ContextMenuWrapper from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import DebugUpdater from "~/renderer/components/debug/DebugUpdater";
import DebugFirmwareUpdater from "~/renderer/components/debug/DebugFirmwareUpdater";
import Page from "LLD/components/Page";
import { isWallet40Page } from "LLD/components/Page/utils";
import AnalyticsConsole from "~/renderer/components/AnalyticsConsole";
import ThemeConsole from "~/renderer/components/ThemeConsole";
import DebugMock from "~/renderer/components/debug/DebugMock";
import DebugSkeletons from "~/renderer/components/debug/DebugSkeletons";
import { DisableTransactionBroadcastWarning } from "~/renderer/components/debug/DisableTransactionBroadcastWarning";
import { DebugWrapper } from "~/renderer/components/debug/shared";
import useDeeplink from "~/renderer/hooks/useDeeplinking";
import useUSBTroubleshooting from "~/renderer/hooks/useUSBTroubleshooting";
import ModalsLayer from "./ModalsLayer";
import { ToastOverlay } from "~/renderer/components/ToastOverlay";
import Drawer from "~/renderer/drawers/Drawer";
import UpdateBanner from "~/renderer/components/Updater/Banner";
import FirmwareUpdateBanner from "~/renderer/components/FirmwareUpdateBanner";
import VaultSignerBanner from "~/renderer/components/VaultSignerBanner";
import { updateIdentify } from "./analytics/segment";
import { useFeature, FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { accountsSelector } from "./reducers/accounts";
import { useRecoverRestoreOnboarding } from "~/renderer/hooks/useRecoverRestoreOnboarding";
import {
  hasCompletedOnboardingSelector,
  hasSeenAnalyticsOptInPromptSelector,
  areSettingsLoaded,
} from "~/renderer/reducers/settings";
import { isLocked as isLockedSelector } from "~/renderer/reducers/application";
import { useAutoDismissPostOnboardingEntryPoint } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { setShareAnalytics, setSharePersonalizedRecommendations } from "./actions/settings";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useEnforceSupportedLanguage } from "./hooks/useEnforceSupportedLanguage";
import { useDeviceManagementKit } from "@ledgerhq/live-dmk-desktop";
import { AppGeoBlocker } from "LLD/features/AppBlockers/components/AppGeoBlocker";
import { AppVersionBlocker } from "LLD/features/AppBlockers/components/AppVersionBlocker";
import { setSolanaLdmkEnabled } from "@ledgerhq/live-common/families/solana/setup";
import useCheckAccountWithFunds from "./components/PostOnboardingHub/logic/useCheckAccountWithFunds";
import { ModularDialogRoot } from "LLD/features/ModularDialog/ModularDialogRoot";
import { SendFlowRoot } from "LLD/features/Send/SendFlowRoot";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";

const PlatformCatalog = lazy(() => import("~/renderer/screens/platform"));
const Dashboard = lazy(() => import("~/renderer/screens/dashboard"));
const Settings = lazy(() => import("~/renderer/screens/settings"));
const Accounts = lazy(() => import("~/renderer/screens/accounts"));
const Card = lazy(() => import("~/renderer/screens/card"));
const Manager = lazy(() => import("~/renderer/screens/manager"));
const Exchange = lazy(() => import("~/renderer/screens/exchange"));
const Earn = lazy(() => import("~/renderer/screens/earn"));
const Bank = lazy(() => import("~/renderer/screens/bank"));
const SwapWeb = lazy(() => import("~/renderer/screens/swapWeb"));
const Swap2 = lazy(() => import("~/renderer/screens/exchange/Swap2"));
const Perps = lazy(() => import("LLD/features/Perps"));
const Market40 = lazy(() => import("LLD/features/Market"));
const Market = lazy(() => import("~/renderer/screens/market"));

const MarketCoin = lazy(() => import("~/renderer/screens/market/MarketCoin"));
const WelcomeScreenSettings = lazy(
  () => import("~/renderer/screens/settings/WelcomeScreenSettings"),
);
const SyncOnboarding = lazy(() => import("./components/SyncOnboarding"));
const RecoverPlayer = lazy(() => import("~/renderer/screens/recover/Player"));

const RecoverRestore = lazy(() => import("~/renderer/components/RecoverRestore"));
const Onboarding = lazy(() => import("~/renderer/components/Onboarding"));
const PostOnboardingScreen = lazy(() => import("~/renderer/components/PostOnboardingScreen"));
const USBTroubleshooting = lazy(() => import("~/renderer/screens/USBTroubleshooting"));
const Asset = lazy(() => import("~/renderer/screens/asset"));
const Account = lazy(() => import("~/renderer/screens/account"));
const Analytics = lazy(() => import("LLD/features/Analytics"));
const CardW40 = lazy(() => import("LLD/features/Card"));

const LoaderWrapper = styled.div`
  padding: 24px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
`;

const Fallback = () => (
  <LoaderWrapper>
    <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
      <InfiniteLoader size={58} />
    </Flex>
  </LoaderWrapper>
);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line react/display-name
const withSuspense = Component => props => (
  <Suspense fallback={<Fallback />}>
    <Component {...props} />
  </Suspense>
);

// in order to test sentry integration, we need the ability to test it out.
const LetThisCrashForCrashTest = () => {
  throw new Error("CrashTestRendering");
};

const LetMainSendCrashTest = () => {
  useEffect(() => {
    ipcRenderer.send("mainCrashTest");
  }, []);
  return null;
};

const LetInternalSendCrashTest = () => {
  useEffect(() => {
    ipcRenderer.send("internalCrashTest");
  }, []);
  return null;
};

export const TopBannerContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 19;
  & > *:not(:first-child) {
    display: none;
  }
`;

const NightlyLayerR = () => {
  const children = [];
  const w = 200;
  const h = 100;
  for (let y = 0.5; y < 20; y++) {
    for (let x = 0.5; x < 20; x++) {
      children.push(
        <div
          style={{
            position: "absolute",
            textAlign: "center",
            top: y * h,
            left: x * w,
            transform: "rotate(-45deg)",
          }}
        >
          PRERELEASE
          <br />
          {__APP_VERSION__}
        </div>,
      );
    }
  }
  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        opacity: 0.1,
        color: "#777",
        width: "100%",
        height: "100%",
        top: 0,
        right: 0,
        zIndex: 999999999999,
      }}
    >
      {children}
    </div>
  );
};

const NightlyLayer = React.memo(NightlyLayerR);

// Wrapper component for RecoverPlayer with FeatureToggle
const RecoverPlayerWithFeatureToggle = () => {
  return (
    <FeatureToggle featureId="protectServicesDesktop">
      {withSuspense(RecoverPlayer)({})}
    </FeatureToggle>
  );
};

// Shared content for the main app layout
const MainAppContent = ({
  shouldDisplayMarketBanner,
  shouldDisplayWallet40MainNav,
}: {
  shouldDisplayMarketBanner: boolean;
  shouldDisplayWallet40MainNav: boolean;
}) => (
  <>
    <Routes>
      <Route path="/recover/:appId" element={<RecoverPlayerWithFeatureToggle />} />
    </Routes>
    {shouldDisplayWallet40MainNav ? <SideBar /> : <MainSideBar />}

    <Page>
      <TopBannerContainer>
        <UpdateBanner />
        <FirmwareUpdateBanner />
        <VaultSignerBanner />
      </TopBannerContainer>
      <Routes>
        <Route path="/" element={withSuspense(Dashboard)({})} />
        <Route path="/settings/*" element={withSuspense(Settings)({})} />
        <Route path="/accounts" element={withSuspense(Accounts)({})} />
        <Route path="/card-new-wallet" element={withSuspense(CardW40)({})} />
        <Route path="/card/:appId?" element={withSuspense(Card)({})} />
        <Route path="/manager/reload" element={<Navigate to="/manager" replace />} />
        <Route path="/manager/*" element={withSuspense(Manager)({})} />
        <Route path="/platform" element={withSuspense(PlatformCatalog)({})} />
        <Route path="/platform/:appId" element={<LiveApp />} />
        <Route path="/earn/*" element={withSuspense(Earn)({})} />
        <Route path="/exchange/:appId?" element={withSuspense(Exchange)({})} />
        <Route path="/swap-web" element={withSuspense(SwapWeb)({})} />
        <Route path="/account/:parentId/:id/*" element={withSuspense(Account)({})} />
        <Route path="/account/:id/*" element={withSuspense(Account)({})} />
        <Route path="/asset/*" element={withSuspense(Asset)({})} />
        <Route path="/swap/*" element={withSuspense(Swap2)({})} />
        <Route path="/perps/*" element={withSuspense(Perps)({})} />
        <Route path="/market/:currencyId" element={withSuspense(MarketCoin)({})} />
        <Route
          path="/market"
          element={withSuspense(shouldDisplayMarketBanner ? Market40 : Market)({})}
        />
        <Route path="/bank/*" element={withSuspense(Bank)({})} />
        <Route path="/analytics" element={withSuspense(Analytics)({})} />
      </Routes>
    </Page>
    <Drawer />
    <ToastOverlay />
  </>
);

// Main app layout component that handles the main navigation after onboarding
const MainAppLayout = () => {
  const { pathname } = useLocation();
  const {
    shouldDisplayMarketBanner,
    isEnabled: isWallet40Enabled,
    shouldDisplayWallet40MainNav,
  } = useWalletFeaturesConfig("desktop");

  const useWallet40Layout = isWallet40Enabled && isWallet40Page(pathname);
  return (
    <>
      <IsNewVersion />
      <IsSystemLanguageAvailable />
      <IsTermOfUseUpdated />
      <SyncNewAccounts priority={2} />

      {useWallet40Layout ? (
        <div className="flex size-full grow flex-row bg-canvas">
          <MainAppContent
            shouldDisplayMarketBanner={shouldDisplayMarketBanner}
            shouldDisplayWallet40MainNav={shouldDisplayWallet40MainNav}
          />
        </div>
      ) : (
        <Box
          grow
          horizontal
          bg="background.default"
          color="neutral.c70"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <MainAppContent
            shouldDisplayMarketBanner={shouldDisplayMarketBanner}
            shouldDisplayWallet40MainNav={shouldDisplayWallet40MainNav}
          />
        </Box>
      )}

      {__PRERELEASE__ && __CHANNEL__ !== "next" && !__CHANNEL__.includes("sha") ? (
        <NightlyLayer />
      ) : null}

      <KeyboardContent sequence="CRASH_TEST">
        <LetThisCrashForCrashTest />
      </KeyboardContent>
      <KeyboardContent sequence="CRASH_MAIN">
        <LetMainSendCrashTest />
      </KeyboardContent>
      <KeyboardContent sequence="CRASH_INTERNAL">
        <LetInternalSendCrashTest />
      </KeyboardContent>
    </>
  );
};

export default function Default() {
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const areSettingsLoadedSelector = useSelector(areSettingsLoaded);
  const accounts = useSelector(accountsSelector);
  const analyticsConsoleActive = useEnv("ANALYTICS_CONSOLE");
  const themeConsoleActive = useEnv("DEBUG_THEME");
  const providerNumber = useEnv("FORCE_PROVIDER");
  const ldmkSolanaSignerFeatureFlag = useFeature("ldmkSolanaSigner");

  const dmk = useDeviceManagementKit();
  const checkAccountsWithFunds = useCheckAccountWithFunds();

  useAccountsWithFundsListener(accounts, updateIdentify, checkAccountsWithFunds);
  useListenToHidDevices();
  useDeeplink();
  useUSBTroubleshooting();
  useFetchCurrencyAll();
  useFetchCurrencyFrom();
  useRecoverRestoreOnboarding();
  useAutoDismissPostOnboardingEntryPoint();
  useEnforceSupportedLanguage();

  const analyticsFF = useFeature("lldAnalyticsOptInPrompt");
  const hasSeenAnalyticsOptInPrompt = useSelector(hasSeenAnalyticsOptInPromptSelector);
  const isLocked = useSelector(isLockedSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof ldmkSolanaSignerFeatureFlag?.enabled === "boolean") {
      setSolanaLdmkEnabled(ldmkSolanaSignerFeatureFlag?.enabled);
    }
  }, [ldmkSolanaSignerFeatureFlag]);

  useEffect(() => {
    // WebHID is now always enabled, set provider if specified
    if (providerNumber) {
      dmk?.setProvider(providerNumber);
    }
    // setting provider only at initialisation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmk]);

  useEffect(() => {
    if (
      !isLocked &&
      analyticsFF?.enabled &&
      (!hasCompletedOnboarding || analyticsFF?.params?.entryPoints.includes("Portfolio")) &&
      !hasSeenAnalyticsOptInPrompt
    ) {
      dispatch(setShareAnalytics(false));
      dispatch(setSharePersonalizedRecommendations(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  useEffect(() => {
    if (!areSettingsLoadedSelector) {
      return;
    }

    const wasHardReset = window.localStorage.getItem("hard-reset") === "1";

    // If we just did a hard reset and onboarding is not completed, force redirect to onboarding
    // even if we're on the settings page (where the reset button is)
    if (wasHardReset && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
      window.localStorage.removeItem("hard-reset");
      updateIdentify();
      return;
    }

    // Normal onboarding check (when not after a reset)
    const userIsOnboardingOrSettingUp =
      pathname.includes("onboarding") ||
      pathname.includes("recover") ||
      pathname.includes("settings");

    if (!userIsOnboardingOrSettingUp && !hasCompletedOnboarding) {
      navigate("/onboarding", { replace: true });
    }
    updateIdentify();
  }, [navigate, pathname, hasCompletedOnboarding, areSettingsLoadedSelector]);

  return (
    <>
      <TriggerAppReady />
      <ExportLogsButton hookToShortcut />
      <TrackAppStart />
      <Idler />
      {process.platform === "darwin" ? <AppRegionDrag /> : null}
      <AppGeoBlocker>
        <AppVersionBlocker>
          <IsUnlocked>
            <BridgeSyncProvider>
              <WalletSyncProvider>
                <ContextMenuWrapper>
                  <ModalsLayer />
                  <DebugWrapper>
                    {process.env.MOCK ? <DebugMock /> : null}
                    {process.env.DEBUG_UPDATE ? <DebugUpdater /> : null}
                    {process.env.DEBUG_SKELETONS ? <DebugSkeletons /> : null}
                    {process.env.DEBUG_FIRMWARE_UPDATE ? <DebugFirmwareUpdater /> : null}
                  </DebugWrapper>
                  {process.env.DISABLE_TRANSACTION_BROADCAST ? (
                    <DisableTransactionBroadcastWarning
                      value={process.env.DISABLE_TRANSACTION_BROADCAST}
                    />
                  ) : null}
                  <ModularDialogRoot />
                  <SendFlowRoot />
                  <Routes>
                    <Route
                      path="/onboarding/*"
                      element={
                        <>
                          <Suspense fallback={<Fallback />}>
                            <Onboarding />
                          </Suspense>
                          <Drawer />
                        </>
                      }
                    />
                    <Route path="/sync-onboarding/*" element={withSuspense(SyncOnboarding)({})} />
                    <Route
                      path="/post-onboarding"
                      element={
                        <>
                          <Suspense fallback={<Fallback />}>
                            <PostOnboardingScreen />
                          </Suspense>
                          <Drawer />
                        </>
                      }
                    />
                    <Route path="/recover-restore" element={withSuspense(RecoverRestore)({})} />

                    <Route
                      path="/USBTroubleshooting"
                      element={
                        <Suspense fallback={<Fallback />}>
                          <USBTroubleshooting onboarding={!hasCompletedOnboarding} />
                        </Suspense>
                      }
                    />

                    {!hasCompletedOnboarding ? (
                      <>
                        <Route
                          path="/settings/*"
                          element={withSuspense(WelcomeScreenSettings)({})}
                        />
                        <Route
                          path="/recover/:appId"
                          element={<RecoverPlayerWithFeatureToggle />}
                        />
                      </>
                    ) : (
                      <Route path="/*" element={<MainAppLayout />} />
                    )}
                  </Routes>
                </ContextMenuWrapper>
              </WalletSyncProvider>
            </BridgeSyncProvider>
          </IsUnlocked>
        </AppVersionBlocker>
      </AppGeoBlocker>

      {analyticsConsoleActive ? <AnalyticsConsole /> : null}
      {themeConsoleActive || process.env.DEBUG_THEME ? <ThemeConsole /> : null}
    </>
  );
}
