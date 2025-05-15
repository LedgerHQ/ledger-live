import type { Decorator } from "@storybook/react";
import type { CounterValuesState, CountervaluesSettings } from "@ledgerhq/live-countervalues/types";

import dbMiddleware from "~/renderer/middlewares/db";

import React, { PropsWithChildren, createContext, useEffect, useState } from "react";
import { Provider, useSelector } from "react-redux";
import { Store } from "redux";
import { HashRouter as Router } from "react-router-dom";
import { NftMetadataProvider } from "@ledgerhq/live-nft-react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { getFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-desktop";
import "../global.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward.css";
import "tippy.js/dist/svg-arrow.css";
import { State } from "~/renderer/reducers";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { UpdaterProvider } from "~/renderer/components/Updater/UpdaterContext";
import ThrowBlock from "~/renderer/components/ThrowBlock";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import { FirebaseRemoteConfigProvider } from "~/renderer/components/FirebaseRemoteConfig";
import { FirebaseFeatureFlagsProvider } from "~/renderer/components/FirebaseFeatureFlags";
import CountervaluesProvider from "~/renderer/components/CountervaluesProvider";
import { CountervaluesMarketcap } from "@ledgerhq/live-countervalues-react";
import DrawerProvider from "~/renderer/drawers/Provider";
import { AnnouncementProviderWrapper } from "~/renderer/components/AnnouncementProviderWrapper";
import { PlatformAppProviderWrapper } from "~/renderer/components/PlatformAppProviderWrapper";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { ConnectEnvsToSentry } from "~/renderer/components/ConnectEnvsToSentry";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import { StorylyProvider } from "~/storyly/StorylyProvider";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppDataStorageProvider } from "~/renderer/hooks/storage-provider/useAppDataStorage";
// import { useBraze } from "../hooks/useBraze";
import { themeSelector } from "../actions/general";
import { satisfies } from "semver";
// import createStore from "../createStore";

import createStore from "~/renderer/createStore";
import { importCountervalues } from "@ledgerhq/live-countervalues/lib-es/logic";

// import Default from "./Default";
// import { useBraze } from "./hooks/useBraze";
// import { themeSelector } from "./actions/general";
// import { allowDebugReactQuerySelector } from "./reducers/settings";

type OverrideInitialState = (state: State) => State;
type Params = {
  backgrounds?: { default?: Theme };
  overrideInitialState?: OverrideInitialState;
  initialCountervalues?: CounterValuesStateRaw;
};

export const MockProviderDecorator: Decorator = (Story, { globals, parameters }) => {
  const {
    backgrounds,
    overrideInitialState = state => state,
    initialCountervalues = { status: {} },
  } = parameters as Params;

  const theme = inferTheme(globals?.backgrounds?.value) ?? backgrounds?.default ?? "light";
  const state = overrideInitialState({
    settings: {
      theme,
      vaultSigner: {
        enabled: false,
        host: "",
        token: "",
        workspace: "",
      },
      supportedCounterValues: [],
      devicesModelList: [],
      blacklistedTokenIds: [],
      orderAccounts: "",
    },
  } as unknown as State);

  console.log({ globals, parameters });
  return (
    <Provider store={createStore({ state, dbMiddleware })}>
      <Providers initialCountervalues={initialCountervalues}>
        <Story />
      </Providers>
    </Provider>
  );
};

type ProvidersProps = PropsWithChildren<{
  initialCountervalues: CounterValuesStateRaw;
}>;

function Providers({ initialCountervalues, children }: ProvidersProps) {
  const [reloadEnabled, setReloadEnabled] = useState(true);

  // useBraze();

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

  const counterValueState = importCountervalues(initialCountervalues, {
    // the list of pairs we need to load
    trackingPairs: [],
    // if true, we will autofill gaps in the data (a missing datapoint between two day). This is typically needed to have smooth graphs.
    autofillGaps: false,
    // preference that define the general refresh rate of countervalues (how often loadCountervalues loop is recalled)
    refreshRate: 10000,
    // in the hybrid batching strategy implementation of latest fetching, defines after which rank we start to batch
    marketCapBatchingAfterRank: 5,
  });

  return (
    <StyleProvider selectedPalette={selectedPalette}>
      <ThrowBlock
        onError={() => {
          if (!__DEV__) {
            setReloadEnabled(false);
          }
        }}
      >
        {/* <FirebaseRemoteConfigProvider> */}
        {/*   <FirebaseFeatureFlagsProvider getFeature={getFeature}> */}
        <ConnectEnvsToSentry />
        <UpdaterProvider>
          <AppDataStorageProvider>
            {/* <DeviceManagementKitProvider> */}
            {/* <CountervaluesMarketcap> */}
            {/* <CountervaluesProvider initialState={initialCountervalues}> */}

            <CountervaluesContext.Provider value={counterValueState}>
              <ToastProvider>
                <AnnouncementProviderWrapper>
                  <Router>
                    <PostOnboardingProviderWrapped>
                      <PlatformAppProviderWrapper>
                        <DrawerProvider>
                          <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
                            <StorylyProvider>
                              <QueryClientProvider client={queryClient}>
                                {children}
                              </QueryClientProvider>
                            </StorylyProvider>
                          </NftMetadataProvider>
                        </DrawerProvider>
                      </PlatformAppProviderWrapper>
                    </PostOnboardingProviderWrapped>
                  </Router>
                </AnnouncementProviderWrapper>
              </ToastProvider>
            </CountervaluesContext.Provider>

            {/* </CountervaluesProvider> */}
            {/* </CountervaluesMarketcap> */}
            {/* </DeviceManagementKitProvider> */}
          </AppDataStorageProvider>
        </UpdaterProvider>
        {/*   </FirebaseFeatureFlagsProvider> */}
        {/* </FirebaseRemoteConfigProvider> */}
      </ThrowBlock>
    </StyleProvider>
  );
}

export const initialState: CounterValuesState = {
  data: {},
  status: {},
  cache: {},
};
const CountervaluesContext = createContext<CounterValuesState>(initialState);

const queryClient = new QueryClient();
const reloadApp = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "r") {
    window.api?.reloadRenderer();
  }
};

type Theme = "dark" | "light";
function inferTheme(value: unknown): Theme | undefined {
  if (typeof value !== "string" || !/#[0-9a-f]{6}/.test(value)) return;
  const r = value.slice(1, 3);
  const g = value.slice(3, 5);
  const b = value.slice(5, 7);
  return [r, g, b].map(x => parseInt(x, 16)).reduce((a, b) => a + b) >= 128 * 3 ? "light" : "dark";
}
