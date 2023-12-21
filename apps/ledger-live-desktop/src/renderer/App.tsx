import React, { useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
import { Store } from "redux";
import { HashRouter as Router } from "react-router-dom";
import { NftMetadataProvider } from "@ledgerhq/live-common/nft/NftMetadataProvider/index";
import "./global.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward.css";
import "tippy.js/dist/svg-arrow.css";
import { State } from "~/renderer/reducers";
import StyleProviderV2 from "~/renderer/styles/StyleProviderV2";
import { UpdaterProvider } from "~/renderer/components/Updater/UpdaterContext";
import ThrowBlock from "~/renderer/components/ThrowBlock";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import { FirebaseRemoteConfigProvider } from "~/renderer/components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "~/renderer/components/FirebaseFeatureFlags";
import CountervaluesProvider from "~/renderer/components/CountervaluesProvider";
import DrawerProvider from "~/renderer/drawers/Provider";
import Default from "./Default";
import { AnnouncementProviderWrapper } from "~/renderer/components/AnnouncementProviderWrapper";
import { PlatformAppProviderWrapper } from "~/renderer/components/PlatformAppProviderWrapper";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { themeSelector } from "./actions/general";
import MarketDataProvider from "~/renderer/screens/market/MarketDataProviderWrapper";
import { ConnectEnvsToSentry } from "~/renderer/components/ConnectEnvsToSentry";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import { useBraze } from "./hooks/useBraze";
import { CounterValuesStateRaw } from "@ledgerhq/live-common/countervalues/types";
const reloadApp = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "r") {
    window.api?.reloadRenderer();
  }
};
type Props = {
  store: Store<State>;
  initialCountervalues: CounterValuesStateRaw;
};
const InnerApp = ({ initialCountervalues }: { initialCountervalues: CounterValuesStateRaw }) => {
  const [reloadEnabled, setReloadEnabled] = useState(true);

  useBraze();

  useEffect(() => {
    const reload = (e: KeyboardEvent) => {
      if (reloadEnabled) {
        reloadApp(e);
      }
    };
    window.addEventListener("keydown", reload);
    return () => window.removeEventListener("keydown", reload);
  }, [reloadEnabled]);
  const selectedPalette = useSelector(themeSelector) || "light";
  return (
    <StyleProviderV2 selectedPalette={selectedPalette}>
      <ThrowBlock
        onError={() => {
          if (!__DEV__) {
            setReloadEnabled(false);
          }
        }}
      >
        <FirebaseRemoteConfigProvider>
          <FirebaseFeatureFlagsProvider>
            <ConnectEnvsToSentry />
            <UpdaterProvider>
              <CountervaluesProvider initialState={initialCountervalues}>
                <ToastProvider>
                  <AnnouncementProviderWrapper>
                    <Router>
                      <PostOnboardingProviderWrapped>
                        <PlatformAppProviderWrapper>
                          <DrawerProvider>
                            <NftMetadataProvider>
                              <MarketDataProvider>
                                <Default />
                              </MarketDataProvider>
                            </NftMetadataProvider>
                          </DrawerProvider>
                        </PlatformAppProviderWrapper>
                      </PostOnboardingProviderWrapped>
                    </Router>
                  </AnnouncementProviderWrapper>
                </ToastProvider>
              </CountervaluesProvider>
            </UpdaterProvider>
          </FirebaseFeatureFlagsProvider>
        </FirebaseRemoteConfigProvider>
      </ThrowBlock>
    </StyleProviderV2>
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
