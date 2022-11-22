// @flow
import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { ipcRenderer } from "electron";
import { Redirect, Route, Switch, useLocation, useHistory } from "react-router-dom";
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
import Swap2 from "~/renderer/screens/exchange/Swap2";
import USBTroubleshooting from "~/renderer/screens/USBTroubleshooting";
import Account from "~/renderer/screens/account";
import WalletConnect from "~/renderer/screens/WalletConnect";
import Asset from "~/renderer/screens/asset";
import Lend from "~/renderer/screens/lend";
import PlatformCatalog from "~/renderer/screens/platform";
import PlatformApp from "~/renderer/screens/platform/App";
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
// $FlowFixMe
import IsTermOfUseUpdated from "./components/IsTermOfUseUpdated";
import DeviceBusyIndicator from "~/renderer/components/DeviceBusyIndicator";
import KeyboardContent from "~/renderer/components/KeyboardContent";
import PerfIndicator from "~/renderer/components/PerfIndicator";
import MainSideBar from "~/renderer/components/MainSideBar";
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import ContextMenuWrapper from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import DebugUpdater from "~/renderer/components/debug/DebugUpdater";
import DebugTheme from "~/renderer/components/debug/DebugTheme";
import DebugFirmwareUpdater from "~/renderer/components/debug/DebugFirmwareUpdater";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
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
import Onboarding from "~/renderer/components/Onboarding";
import PostOnboardingScreen from "~/renderer/components/PostOnboardingScreen";

import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";

// $FlowFixMe
import Market from "~/renderer/screens/market";
// $FlowFixMe
import MarketCoinScreen from "~/renderer/screens/market/MarketCoinScreen";
// $FlowFixMe
import Learn from "~/renderer/screens/learn";

import { useProviders } from "~/renderer/screens/exchange/Swap2/Form";
import WelcomeScreenSettings from "~/renderer/screens/settings/WelcomeScreenSettings";
import SyncOnboarding from "./components/SyncOnboarding";

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

export const TopBannerContainer: ThemedComponent<{}> = styled.div`
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
  const location = useLocation();
  const ref: React$ElementRef<any> = useRef();
  const history = useHistory();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  useListenToHidDevices();
  useDeeplink();
  useUSBTroubleshooting();

  useProviders(); // prefetch data from swap providers here

  // every time location changes, scroll back up
  useEffect(() => {
    if (ref && ref.current) {
      ref.current.scrollTo(0, 0);
    }
  }, [location]);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      history.push("/onboarding");
    }
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
              <Route path="/onboarding" render={props => <Onboarding {...props} />} />
              <Route path="/sync-onboarding" render={props => <SyncOnboarding {...props} />} />
              <Route path="/post-onboarding" render={() => <PostOnboardingScreen />} />
              <Route path="/USBTroubleshooting">
                <USBTroubleshooting onboarding={!hasCompletedOnboarding} />
              </Route>
              {!hasCompletedOnboarding ? (
                <Route path="/settings" render={props => <WelcomeScreenSettings {...props} />} />
              ) : (
                <Route>
                  <Switch>
                    <Route exact path="/walletconnect">
                      <WalletConnect />
                    </Route>
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
                        style={{ width: "100%", height: "100%" }}
                      >
                        <MainSideBar />
                        <Page>
                          <TopBannerContainer>
                            <UpdateBanner />
                            <FirmwareUpdateBanner />
                          </TopBannerContainer>
                          <Switch>
                            <Route path="/" exact render={props => <Dashboard {...props} />} />
                            <Route path="/settings" render={props => <Settings {...props} />} />
                            <Route path="/accounts" render={props => <Accounts {...props} />} />
                            <Route path="/card" render={props => <Card {...props} />} />
                            <Redirect from="/manager/reload" to="/manager" />
                            <Route path="/manager" render={props => <Manager {...props} />} />
                            <Route
                              path="/platform"
                              render={(props: any) => <PlatformCatalog {...props} />}
                              exact
                            />
                            <Route
                              path="/platform/:appId?"
                              render={(props: any) => <PlatformApp {...props} />}
                            />
                            <Route path="/lend" render={props => <Lend {...props} />} />
                            <Route path="/exchange" render={(props: any) => <Exchange />} />
                            <Route
                              exact
                              path="/account/:id/nft-collection"
                              render={props => <NFTGallery {...props} />}
                            />
                            <Route
                              path="/account/:id/nft-collection/:collectionAddress?"
                              render={props => <NFTCollection {...props} />}
                            />
                            <Route
                              path="/account/:parentId/:id"
                              render={props => <Account {...props} />}
                            />
                            <Route path="/account/:id" render={props => <Account {...props} />} />
                            <Route
                              path="/asset/:assetId+"
                              render={(props: any) => <Asset {...props} />}
                            />
                            <Route path="/swap" render={props => <Swap2 {...props} />} />

                            <Route
                              path="/market/:currencyId"
                              render={props => <MarketCoinScreen {...props} />}
                            />
                            <Route path="/market" render={props => <Market {...props} />} />
                            <FeatureToggle feature="learn">
                              <Route path="/learn" render={props => <Learn {...props} />} />
                            </FeatureToggle>
                          </Switch>
                        </Page>
                        <Drawer />
                        <ToastOverlay />
                      </Box>

                      {__PRERELEASE__ && __CHANNEL__ !== "next" && !__CHANNEL__.includes("sha") ? (
                        <NightlyLayer />
                      ) : null}

                      <DeviceBusyIndicator />
                      <KeyboardContent sequence="BJBJBJ">
                        <PerfIndicator />
                      </KeyboardContent>
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
