import React from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NftMetadataProvider } from "@ledgerhq/live-nft-react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import ButtonUseTouchableContext from "~/context/ButtonUseTouchableContext";
import { BridgeSyncProvider } from "~/bridge/BridgeSyncContext";
import { OnboardingContextProvider } from "~/screens/Onboarding/onboardingContext";
import CounterValuesProvider from "~/components/CounterValuesProvider";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";
import MarketDataProvider from "LLM/features/Market/components//MarketDataProviderWrapper";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { CountervaluesMarketcap } from "@ledgerhq/live-countervalues-react/index";

type AppProvidersProps = {
  initialCountervalues?: CounterValuesStateRaw;
  children: JSX.Element;
};

const queryClient = new QueryClient();

function AppProviders({ initialCountervalues, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BridgeSyncProvider>
        <CountervaluesMarketcap>
          <CounterValuesProvider initialState={initialCountervalues}>
            <ButtonUseTouchableContext.Provider value={true}>
              <OnboardingContextProvider>
                <PostOnboardingProviderWrapped>
                  <ToastProvider>
                    <NotificationsProvider>
                      <SnackbarContainer />
                      <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
                        <MarketDataProvider>{children}</MarketDataProvider>
                      </NftMetadataProvider>
                    </NotificationsProvider>
                  </ToastProvider>
                </PostOnboardingProviderWrapped>
              </OnboardingContextProvider>
            </ButtonUseTouchableContext.Provider>
          </CounterValuesProvider>
        </CountervaluesMarketcap>
      </BridgeSyncProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
