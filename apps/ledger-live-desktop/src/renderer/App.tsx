import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { useSelector } from "LLD/hooks/redux";
import { Store } from "redux";
import { HashRouter as Router } from "react-router";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-desktop";
import { useFeature } from "@features/platform-feature-flags";
import "./global.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward.css";
import "tippy.js/dist/svg-arrow.css";
import { State } from "~/renderer/reducers";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { UpdaterProvider } from "~/renderer/components/Updater/UpdaterContext";
import ThrowBlock from "~/renderer/components/ThrowBlock";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import { CountervaluesBridgedProvider } from "~/renderer/components/CountervaluesProvider";
import DrawerProvider from "~/renderer/drawers/Provider";
import Default from "./Default";
import { ServiceStatusProviderWrapper } from "~/renderer/components/ServiceStatusProviderWrapper";
import { PlatformAppProviderWrapper } from "~/renderer/components/PlatformAppProviderWrapper";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { themeSelector } from "./actions/general";
import { ConnectEnvsToDatadog } from "~/renderer/components/ConnectEnvsToDatadog";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import { useBraze } from "./hooks/useBraze";
import { useResetTimeRangeOnGraphRework } from "LLD/hooks/useResetTimeRangeOnGraphRework";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppDataStorageProvider } from "~/renderer/hooks/storage-provider/useAppDataStorage";
import { allowDebugReactQuerySelector } from "./reducers/settings";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { setZcashShieldedEnabled } from "@ledgerhq/live-common/families/zcash/setup";

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
  useResetTimeRangeOnGraphRework();

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
  const ldmkTransport = useFeature("ldmkTransport");
  const zcashShielded = useFeature("zcashShielded");

  // Mirror the `zcashShielded` feature flag: neither a coin module nor the bridge
  // router can read React feature flags, and the developer drawer's override never
  // reaches the remote config, so what was resolved here is handed over. Flag ON
  // serves Zcash accounts with the standalone @ledgerhq/coin-zcash module, where
  // every send -- transparent t→t included -- is built and signed as a PCZT; OFF
  // keeps coin-bitcoin's Zcash chain-adapter on its legacy transparent path.
  useEffect(() => {
    setZcashShieldedEnabled(zcashShielded?.enabled ?? false);
  }, [zcashShielded?.enabled]);

  return (
    <StyleProvider selectedPalette={selectedPalette}>
      <ThemeProvider colorScheme={selectedPalette}>
        <ThrowBlock
          onError={() => {
            if (!__DEV__) {
              setReloadEnabled(false);
            }
          }}
        >
          <ConnectEnvsToDatadog />
          <UpdaterProvider>
            <AppDataStorageProvider>
              <DeviceManagementKitProvider ldmkTransportEnabled={ldmkTransport?.enabled ?? false}>
                <CountervaluesBridgedProvider initialState={initialCountervalues}>
                  <ToastProvider>
                    <ServiceStatusProviderWrapper>
                      <Router>
                        <PostOnboardingProviderWrapped>
                          <PlatformAppProviderWrapper>
                            <DrawerProvider>
                              <QueryClientProvider client={queryClient}>
                                <Default />
                                <ReactQueryDevtoolsProvider />
                              </QueryClientProvider>
                            </DrawerProvider>
                          </PlatformAppProviderWrapper>
                        </PostOnboardingProviderWrapped>
                      </Router>
                    </ServiceStatusProviderWrapper>
                  </ToastProvider>
                </CountervaluesBridgedProvider>
              </DeviceManagementKitProvider>
            </AppDataStorageProvider>
          </UpdaterProvider>
        </ThrowBlock>
      </ThemeProvider>
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
