import React, { useEffect, lazy, Suspense } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import { Redirect, Route, Switch, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import TrackAppStart from "~/renderer/components/TrackAppStart";
import { LiveApp } from "~/renderer/screens/platform";
import { BridgeSyncProvider } from "~/renderer/bridge/BridgeSyncContext";
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
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import ContextMenuWrapper from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import DebugUpdater from "~/renderer/components/debug/DebugUpdater";
import DebugTheme from "~/renderer/components/debug/DebugTheme";
import DebugFirmwareUpdater from "~/renderer/components/debug/DebugFirmwareUpdater";
import Page from "~/renderer/components/Page";
import AnalyticsConsole from "~/renderer/components/AnalyticsConsole";
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
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { updateIdentify } from "./analytics/segment";
import { useFeature, FeatureToggle } from "@ledgerhq/live-config/featureFlags/index";
import { enableListAppsV2 } from "@ledgerhq/live-common/apps/hw";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { accountsSelector } from "./reducers/accounts";

const PlatformCatalog = lazy(() => import("~/renderer/screens/platform"));
const Dashboard = lazy(() => import("~/renderer/screens/dashboard"));
const Settings = lazy(() => import("~/renderer/screens/settings"));
const Accounts = lazy(() => import("~/renderer/screens/accounts"));
const Card = lazy(() => import("~/renderer/screens/card"));
const Manager = lazy(() => import("~/renderer/screens/manager"));
const Exchange = lazy(() => import("~/renderer/screens/exchange"));
const Earn = lazy(() => import("~/renderer/screens/earn"));
const SwapWeb = lazy(() => import("~/renderer/screens/swapWeb"));
const Swap2 = lazy(() => import("~/renderer/screens/exchange/Swap2"));

const Market = lazy(() => import("~/renderer/screens/market"));
const MarketCoinScreen = lazy(() => import("~/renderer/screens/market/MarketCoinScreen"));
const Learn = lazy(() => import("~/renderer/screens/learn"));
const WelcomeScreenSettings = lazy(
  () => import("~/renderer/screens/settings/WelcomeScreenSettings"),
);
const SyncOnboarding = lazy(() => import("./components/SyncOnboarding"));
const RecoverPlayer = lazy(() => import("~/renderer/screens/recover/Player"));

const NFTGallery = lazy(() => import("~/renderer/screens/nft/Gallery"));
const NFTCollection = lazy(() => import("~/renderer/screens/nft/Gallery/Collection"));
const RecoverRestore = lazy(() => import("~/renderer/components/RecoverRestore"));
const Onboarding = lazy(() => import("~/renderer/components/Onboarding"));
const PostOnboardingScreen = lazy(() => import("~/renderer/components/PostOnboardingScreen"));
const USBTroubleshooting = lazy(() => import("~/renderer/screens/USBTroubleshooting"));
const Asset = lazy(() => import("~/renderer/screens/asset"));
const Account = lazy(() => import("~/renderer/screens/account"));

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

export default function Default() {
  const history = useHistory();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const accounts = useSelector(accountsSelector);

  useAccountsWithFundsListener(accounts, updateIdentify);
  useListenToHidDevices();
  useDeeplink();
  useUSBTroubleshooting();
  useFetchCurrencyAll();
  useFetchCurrencyFrom();

  const listAppsV2 = useFeature("listAppsV2minor1");
  useEffect(() => {
    if (!listAppsV2) return;
    enableListAppsV2(listAppsV2.enabled);
  }, [listAppsV2]);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      history.push("/onboarding");
    }
    updateIdentify();
  }, [history, hasCompletedOnboarding]);
  return (
    <>
      <TriggerAppReady />
      <ExportLogsButton hookToShortcut />
      <TrackAppStart />
      <Idler />
      {process.platform === "darwin" ? <AppRegionDrag /> : null}

      <IsUnlocked>
        <BridgeSyncProvider>
          <ContextMenuWrapper>
            <ModalsLayer />
            <DebugWrapper>
              {process.env.DEBUG_THEME ? <DebugTheme /> : null}
              {process.env.MOCK ? <DebugMock /> : null}
              {process.env.DEBUG_UPDATE ? <DebugUpdater /> : null}
              {process.env.DEBUG_SKELETONS ? <DebugSkeletons /> : null}
              {process.env.DEBUG_FIRMWARE_UPDATE ? <DebugFirmwareUpdater /> : null}
            </DebugWrapper>
            {process.env.DISABLE_TRANSACTION_BROADCAST ? (
              <DisableTransactionBroadcastWarning />
            ) : null}
            <Switch>
              <Route
                path="/onboarding"
                render={() => (
                  <>
                    <Suspense fallback={<Fallback />}>
                      <Onboarding />
                    </Suspense>
                    <Drawer />
                  </>
                )}
              />
              <Route path="/sync-onboarding" render={withSuspense(SyncOnboarding)} />
              <Route
                path="/post-onboarding"
                render={() => (
                  <>
                    <Suspense fallback={<Fallback />}>
                      <PostOnboardingScreen />
                    </Suspense>
                    <Drawer />
                  </>
                )}
              />
              <Route path="/recover-restore" render={withSuspense(RecoverRestore)} />

              <Route path="/USBTroubleshooting">
                <Suspense fallback={<Fallback />}>
                  <USBTroubleshooting onboarding={!hasCompletedOnboarding} />
                </Suspense>
              </Route>
              {!hasCompletedOnboarding ? (
                <Route path="/settings" render={withSuspense(WelcomeScreenSettings)} />
              ) : (
                <Route>
                  <Switch>
                    <Route>
                      <IsNewVersion />
                      <IsSystemLanguageAvailable />
                      <IsTermOfUseUpdated />
                      <SyncNewAccounts priority={2} />

                      <Box
                        grow
                        horizontal
                        bg="palette.background.default"
                        color="palette.text.shade60"
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <FeatureToggle featureId="protectServicesDesktop">
                          <Switch>
                            <Route path="/recover/:appId" render={withSuspense(RecoverPlayer)} />
                          </Switch>
                        </FeatureToggle>
                        <MainSideBar />
                        <Page>
                          <TopBannerContainer>
                            <UpdateBanner />
                            <FirmwareUpdateBanner />
                            <VaultSignerBanner />
                          </TopBannerContainer>
                          <Switch>
                            <Route path="/" exact render={withSuspense(Dashboard)} />
                            <Route path="/settings" render={withSuspense(Settings)} />
                            <Route path="/accounts" render={withSuspense(Accounts)} />
                            <Route path="/card" render={withSuspense(Card)} />
                            <Redirect from="/manager/reload" to="/manager" />
                            <Route path="/manager" render={withSuspense(Manager)} />
                            <Route path="/platform" render={withSuspense(PlatformCatalog)} exact />
                            <Route path="/platform/:appId?" component={LiveApp} />
                            <Route path="/earn" render={withSuspense(Earn)} />
                            <Route exact path="/exchange/:appId?" render={withSuspense(Exchange)} />
                            <Route
                              exact
                              path="/account/:id/nft-collection"
                              render={withSuspense(NFTGallery)}
                            />
                            <Route path="/swap-web" render={withSuspense(SwapWeb)} />
                            <Route
                              path="/account/:id/nft-collection/:collectionAddress?"
                              render={withSuspense(NFTCollection)}
                            />
                            <Route path="/account/:parentId/:id" render={withSuspense(Account)} />
                            <Route path="/account/:id" render={withSuspense(Account)} />
                            <Route path="/asset/:assetId+" render={withSuspense(Asset)} />
                            <Route path="/swap" render={withSuspense(Swap2)} />
                            <Route
                              path="/market/:currencyId"
                              render={withSuspense(MarketCoinScreen)}
                            />
                            <Route path="/market" render={withSuspense(Market)} />
                            <FeatureToggle featureId="learn">
                              <Route path="/learn" render={withSuspense(Learn)} />
                            </FeatureToggle>
                          </Switch>
                        </Page>
                        <Drawer />
                        <ToastOverlay />
                      </Box>

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
                    </Route>
                  </Switch>
                </Route>
              )}
            </Switch>
          </ContextMenuWrapper>
        </BridgeSyncProvider>
      </IsUnlocked>

      {process.env.ANALYTICS_CONSOLE ? <AnalyticsConsole /> : null}
    </>
  );
}
