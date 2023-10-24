import React, { useEffect } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import { Redirect, Route, Switch, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { FeatureToggle } from "@ledgerhq/live-common/featureFlags/index";
import TrackAppStart from "~/renderer/components/TrackAppStart";
import { BridgeSyncProvider } from "~/renderer/bridge/BridgeSyncContext";
import { SyncNewAccounts } from "~/renderer/bridge/SyncNewAccounts";
import Dashboard from "~/renderer/screens/dashboard";
import Settings from "~/renderer/screens/settings";
import Accounts from "~/renderer/screens/accounts";
import Card from "~/renderer/screens/card";
import Manager from "~/renderer/screens/manager";
import Exchange from "~/renderer/screens/exchange";
import Earn from "./screens/earn";
import SwapWeb from "./screens/swapWeb";
import Swap2 from "~/renderer/screens/exchange/Swap2";
import USBTroubleshooting from "~/renderer/screens/USBTroubleshooting";
import Account from "~/renderer/screens/account";
import Asset from "~/renderer/screens/asset";
import { PlatformCatalog, LiveApp } from "~/renderer/screens/platform";
import NFTGallery from "~/renderer/screens/nft/Gallery";
import NFTCollection from "~/renderer/screens/nft/Gallery/Collection";
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
import RecoverRestore from "~/renderer/components/RecoverRestore";
import Onboarding from "~/renderer/components/Onboarding";
import PostOnboardingScreen from "~/renderer/components/PostOnboardingScreen";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import Market from "~/renderer/screens/market";
import MarketCoinScreen from "~/renderer/screens/market/MarketCoinScreen";
import Learn from "~/renderer/screens/learn";
import WelcomeScreenSettings from "~/renderer/screens/settings/WelcomeScreenSettings";
import SyncOnboarding from "./components/SyncOnboarding";
import RecoverPlayer from "~/renderer/screens/recover/Player";
import { updateIdentify } from "./analytics/segment";
import { useDiscoverDB } from "./screens/platform/v2/hooks";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { enableListAppsV2 } from "@ledgerhq/live-common/apps/hw";
import {
  useFetchCurrencyAll,
  useFetchCurrencyFrom,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import useAccountsWithFundsListener from "@ledgerhq/live-common/hooks/useAccountsWithFundsListener";
import { accountsSelector } from "./reducers/accounts";

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
  const discoverDB = useDiscoverDB();

  const listAppsV2 = useFeature("listAppsV2");
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
                    <Onboarding />
                    <Drawer />
                  </>
                )}
              />
              <Route path="/sync-onboarding" component={SyncOnboarding} />
              <Route
                path="/post-onboarding"
                render={() => (
                  <>
                    <PostOnboardingScreen />
                    <Drawer />
                  </>
                )}
              />
              <Route path="/recover-restore" component={RecoverRestore} />

              <Route path="/USBTroubleshooting">
                <USBTroubleshooting onboarding={!hasCompletedOnboarding} />
              </Route>
              {!hasCompletedOnboarding ? (
                <Route path="/settings" component={WelcomeScreenSettings} />
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
                            <Route path="/recover/:appId" component={RecoverPlayer} />
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
                            <Route path="/" exact component={Dashboard} />
                            <Route path="/settings" component={Settings} />
                            <Route path="/accounts" component={Accounts} />
                            <Route path="/card" component={Card} />
                            <Redirect from="/manager/reload" to="/manager" />
                            <Route path="/manager" component={Manager} />
                            <Route
                              path="/platform"
                              component={() => <PlatformCatalog db={discoverDB} />}
                              exact
                            />
                            <Route path="/platform/:appId?" component={LiveApp} />
                            <Route path="/earn" component={Earn} />
                            <Route exact path="/exchange/:appId?" component={Exchange} />
                            <Route
                              exact
                              path="/account/:id/nft-collection"
                              component={NFTGallery}
                            />
                            <Route path="/swap-web" component={SwapWeb} />
                            <Route
                              path="/account/:id/nft-collection/:collectionAddress?"
                              component={NFTCollection}
                            />
                            <Route path="/account/:parentId/:id" component={Account} />
                            <Route path="/account/:id" component={Account} />
                            <Route path="/asset/:assetId+" component={Asset} />
                            <Route path="/swap" component={Swap2} />
                            <Route path="/market/:currencyId" component={MarketCoinScreen} />
                            <Route path="/market" component={Market} />
                            <FeatureToggle featureId="learn">
                              <Route path="/learn" component={Learn} />
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
