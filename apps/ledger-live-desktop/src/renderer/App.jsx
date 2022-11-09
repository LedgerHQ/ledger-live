// @flow
import React, { useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
import type { Store } from "redux";
import { HashRouter as Router } from "react-router-dom";
import { NftMetadataProvider } from "@ledgerhq/live-common/nft/NftMetadataProvider/index";

import "./global.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward.css";
import "tippy.js/dist/svg-arrow.css";

import type { State } from "~/renderer/reducers";

import StyleProvider from "~/renderer/styles/StyleProvider";

import { UpdaterProvider } from "~/renderer/components/Updater/UpdaterContext";
import ThrowBlock from "~/renderer/components/ThrowBlock";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import { RemoteConfigProvider } from "~/renderer/components/RemoteConfig";
// $FlowFixMe
import { FirebaseRemoteConfigProvider } from "~/renderer/components/FirebaseRemoteConfig";
// $FlowFixMe
import { FirebaseFeatureFlagsProvider } from "~/renderer/components/FirebaseFeatureFlags";
import CountervaluesProvider from "~/renderer/components/CountervaluesProvider";
import DrawerProvider from "~/renderer/drawers/Provider";
import Default from "./Default";
import WalletConnectProvider from "./screens/WalletConnect/Provider";
import { AnnouncementProviderWrapper } from "~/renderer/components/AnnouncementProviderWrapper";
import { PlatformAppProviderWrapper } from "~/renderer/components/PlatformAppProviderWrapper";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { themeSelector } from "./actions/general";
// $FlowFixMe
import MarketDataProvider from "~/renderer/screens/market/MarketDataProviderWrapper";
// $FlowFixMe
import { ConnectEnvsToSentry } from "~/renderer/components/ConnectEnvsToSentry";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";

const reloadApp = event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "r") {
    window.api.reloadRenderer();
  }
};

type Props = {
  store: Store<State, *>,
  initialCountervalues: *,
};

const InnerApp = ({ initialCountervalues }: { initialCountervalues: * }) => {
  const [reloadEnabled, setReloadEnabled] = useState(true);

  useEffect(() => {
    const reload = e => {
      if (reloadEnabled) {
        reloadApp(e);
      }
    };

    window.addEventListener("keydown", reload);
    return () => window.removeEventListener("keydown", reload);
  }, [reloadEnabled]);

  const selectedPalette = useSelector(themeSelector) || "light";

  return (
    <StyleProvider selectedPalette={selectedPalette}>
      <ThrowBlock
        onError={() => {
          if (!__DEV__) {
            setReloadEnabled(false);
          }
        }}
      >
        <RemoteConfigProvider>
          <FirebaseRemoteConfigProvider>
            <FirebaseFeatureFlagsProvider>
              <ConnectEnvsToSentry />
              <UpdaterProvider>
                <CountervaluesProvider initialState={initialCountervalues}>
                  <ToastProvider>
                    <AnnouncementProviderWrapper>
                      <Router>
                        <PostOnboardingProviderWrapped>
                          <WalletConnectProvider>
                            <PlatformAppProviderWrapper>
                              <DrawerProvider>
                                <NftMetadataProvider>
                                  <MarketDataProvider>
                                    <Default />
                                  </MarketDataProvider>
                                </NftMetadataProvider>
                              </DrawerProvider>
                            </PlatformAppProviderWrapper>
                          </WalletConnectProvider>
                        </PostOnboardingProviderWrapped>
                      </Router>
                    </AnnouncementProviderWrapper>
                  </ToastProvider>
                </CountervaluesProvider>
              </UpdaterProvider>
            </FirebaseFeatureFlagsProvider>
          </FirebaseRemoteConfigProvider>
        </RemoteConfigProvider>
      </ThrowBlock>
    </StyleProvider>
  );
};

const App = ({ store, initialCountervalues }: Props) => {
  return (
    <LiveStyleSheetManager>
      <Provider store={store}>
        <InnerApp initialCountervalues={initialCountervalues} />
      </Provider>
    </LiveStyleSheetManager>
  );
};

export default App;
