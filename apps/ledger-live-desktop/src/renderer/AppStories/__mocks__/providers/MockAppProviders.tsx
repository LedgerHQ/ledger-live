import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";
import "tippy.js/animations/shift-toward.css";
import "tippy.js/dist/svg-arrow.css";
import "~/renderer/global.css";

import type { Decorator } from "@storybook/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import merge from "lodash/merge";
import React, { PropsWithChildren, createContext } from "react";
import { Provider, useSelector } from "react-redux";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

import { importCountervalues } from "@ledgerhq/live-countervalues/lib-es/logic";
import type { CounterValuesState, CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { NftMetadataProvider } from "@ledgerhq/live-nft-react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { palettes } from "@ledgerhq/react-ui/styles/index";

import dbMiddleware from "~/renderer/middlewares/db";
import { State } from "~/renderer/reducers";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { UpdaterProvider } from "~/renderer/components/Updater/UpdaterContext";
import ThrowBlock from "~/renderer/components/ThrowBlock";
import LiveStyleSheetManager from "~/renderer/styles/LiveStyleSheetManager";
import { FirebaseRemoteConfigProvider } from "~/renderer/components/FirebaseRemoteConfig";
import DrawerProvider from "~/renderer/drawers/Provider";
import { AnnouncementProviderWrapper } from "~/renderer/components/AnnouncementProviderWrapper";
import { PlatformAppProviderWrapper } from "~/renderer/components/PlatformAppProviderWrapper";
import { ConnectEnvsToSentry } from "~/renderer/components/ConnectEnvsToSentry";
import PostOnboardingProviderWrapped from "~/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped";
import { AppDataStorageProvider } from "~/renderer/hooks/storage-provider/useAppDataStorage";
import { themeSelector } from "~/renderer/actions/general";
import createStore from "~/renderer/createStore";

import { StorylyProvider } from "~/storyly/StorylyProvider";

// import { useBraze } from "./hooks/useBraze";

type OverrideState = (state: State) => State;
type Params = {
  path?: string;
  state?: OverrideState | State;
  backgrounds?: { default?: unknown };
  initialCountervalues?: CounterValuesStateRaw;
};
type RouterEntries = MemoryRouterProps["initialEntries"];

export const MockProviderDecorator: Decorator = (Story, { globals, parameters }) => {
  const {
    path,
    state = state => state,
    backgrounds,
    initialCountervalues = { status: {} },
  } = parameters as Params;

  // Router state
  const routerEntries: RouterEntries = typeof path === "string" ? [path] : undefined;
  console.log({ routerEntries });

  // Redux state
  const overrideState: OverrideState =
    typeof state === "function" ? state : (s: State) => merge(s, state);
  const initialState = overrideState({
    settings: {
      accountsViewMode: "list",
      anonymousUserNotifications: {},
      blacklistedTokenIds: [],
      currenciesSettings: [],
      devicesModelList: [],
      hasCompletedOnboarding: true,
      hasInstalledApps: true,
      lastUsedVersion: "2.0.0",
      nftCollectionsStatusByNetwork: {},
      orderAccounts: "",
      overriddenFeatureFlags: {},
      selectedTimeRange: "month",
      starredMarketCoins: [],
      supportedCounterValues: [],
      swap: { selectableCurrencies: [] },
      theme: inferTheme(globals?.backgrounds?.value, backgrounds?.default),
      vaultSigner: {
        enabled: false,
        host: "",
        token: "",
        workspace: "",
      },
    },
  } as unknown as State);
  console.log({ state });

  console.log({ globals, parameters });
  return (
    <LiveStyleSheetManager>
      <Provider store={createStore({ state: initialState, dbMiddleware })}>
        <Providers routerEntries={routerEntries} initialCountervalues={initialCountervalues}>
          <Story />
        </Providers>
      </Provider>
    </LiveStyleSheetManager>
  );
};

type ProvidersProps = PropsWithChildren<{
  routerEntries: RouterEntries;
  initialCountervalues: CounterValuesStateRaw;
}>;

function Providers({ routerEntries, initialCountervalues, children }: ProvidersProps) {
  // useBraze();

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
      <ThrowBlock>
        <FirebaseRemoteConfigProvider>
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
                    <MemoryRouter initialEntries={routerEntries}>
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
                    </MemoryRouter>
                  </AnnouncementProviderWrapper>
                </ToastProvider>
              </CountervaluesContext.Provider>

              {/* </CountervaluesProvider> */}
              {/* </CountervaluesMarketcap> */}
              {/* </DeviceManagementKitProvider> */}
            </AppDataStorageProvider>
          </UpdaterProvider>
          {/*   </FirebaseFeatureFlagsProvider> */}
        </FirebaseRemoteConfigProvider>
      </ThrowBlock>
      <div id="modals"></div>
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

function inferTheme(value: unknown, fallback: unknown): "dark" | "light" {
  if (value === palettes.dark.background.default) return "dark";
  if (value === palettes.light.background.default) return "light";
  if (fallback === "dark" || fallback === "light") return fallback;
  return "light";
}
