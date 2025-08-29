import { getFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-desktop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
import { HashRouter as Router } from "react-router-dom";
import { Store } from "redux";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward.css";
import "tippy.js/dist/svg-arrow.css";
import "tippy.js/dist/tippy.css";
import { AnnouncementProviderWrapper } from "~/renderer/components/AnnouncementProviderWrapper";
import { ConnectEnvsToSentry } from "~/renderer/components/ConnectEnvsToSentry";
import { CountervaluesMarketcapBridgedProvider } from "~/renderer/components/CountervaluesMarketcapProvider";
import { CountervaluesBridgedProvider } from "~/renderer/components/CountervaluesProvider";
import { FirebaseFeatureFlagsProvider } from "~/renderer/components/FirebaseFeatureFlags";
import { FirebaseRemoteConfigProvider } from "~/renderer/components/FirebaseRemoteConfig";
import { PlatformAppProviderWrapper } from "~/renderer/components/PlatformAppProviderWrapper";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import ThrowBlock from "~/renderer/components/ThrowBlock";
import { UpdaterProvider } from "~/renderer/components/Updater/UpdaterContext";
import DrawerProvider from "~/renderer/drawers/Provider";
import { AppDataStorageProvider } from "~/renderer/hooks/storage-provider/useAppDataStorage";
import { State } from "~/renderer/reducers";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { StorylyProvider } from "~/storyly/StorylyProvider";
import { themeSelector } from "./actions/general";
import Default from "./Default";
import "./global.css";
import { useBraze } from "./hooks/useBraze";
import { allowDebugReactQuerySelector } from "./reducers/settings";

const reloadApp = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "r") {
    window.api?.reloadRenderer();
  }
};

type Props = {
  store: Store<State>;
  initialCountervalues: CounterValuesStateRaw;
};

const queryClient = new QueryClient();

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
    <StyleProvider selectedPalette={selectedPalette}>
      <ThrowBlock
        onError={() => {
          if (!__DEV__) {
            setReloadEnabled(false);
          }
        }}
      >
        <FirebaseRemoteConfigProvider>
          <FirebaseFeatureFlagsProvider getFeature={getFeature}>
            <ConnectEnvsToSentry />
            <UpdaterProvider>
              <AppDataStorageProvider>
                <DeviceManagementKitProvider>
                  <CountervaluesMarketcapBridgedProvider>
                    <CountervaluesBridgedProvider initialState={initialCountervalues}>
                      <ToastProvider>
                        <AnnouncementProviderWrapper>
                          <Router>
                            <PostOnboardingProviderWrapped>
                              <PlatformAppProviderWrapper>
                                <DrawerProvider>
                                  <StorylyProvider>
                                    <QueryClientProvider client={queryClient}>
                                      <Default />
                                      <ReactQueryDevtoolsProvider />
                                    </QueryClientProvider>
                                  </StorylyProvider>
                                </DrawerProvider>
                              </PlatformAppProviderWrapper>
                            </PostOnboardingProviderWrapped>
                          </Router>
                        </AnnouncementProviderWrapper>
                      </ToastProvider>
                    </CountervaluesBridgedProvider>
                  </CountervaluesMarketcapBridgedProvider>
                </DeviceManagementKitProvider>
              </AppDataStorageProvider>
            </UpdaterProvider>
          </FirebaseFeatureFlagsProvider>
        </FirebaseRemoteConfigProvider>
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

const ReactQueryDevtoolsProvider = () => {
  const allowDebugReactQuery = useSelector(allowDebugReactQuerySelector);
  if (!allowDebugReactQuery) return null;
  return <ReactQueryDevtools initialIsOpen={false} />;
};

export default App;
