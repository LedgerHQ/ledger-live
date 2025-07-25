import React from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { NftMetadataProvider } from "@ledgerhq/live-nft-react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { ToastProvider } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import { BridgeSyncProvider } from "~/bridge/BridgeSyncContext";
import { OnboardingContextProvider } from "~/screens/Onboarding/onboardingContext";
import CounterValuesProvider from "~/components/CounterValuesProvider";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { CountervaluesMarketcap } from "@ledgerhq/live-countervalues-react/index";
import { InViewContextProvider } from "LLM/contexts/InViewContext";
import { WalletSyncProvider } from "LLM/features/WalletSync/components/WalletSyncContext";
import { AppDataStorageProvider } from "~/hooks/storageProvider/useAppDataStorage";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-mobile";
import { useLdmkFeatureFlagInitiallyEnabled } from "@ledgerhq/live-common/hooks/useLdmkFeatureFlagInitiallyEnabled";

type AppProvidersProps = {
  initialCountervalues?: CounterValuesStateRaw;
  children: JSX.Element;
};

const queryClient = new QueryClient();

function AppProviders({ initialCountervalues, children }: AppProvidersProps) {
  const dmkEnabled = useLdmkFeatureFlagInitiallyEnabled();
  return (
    <QueryClientProvider client={queryClient}>
      <BridgeSyncProvider>
        <WalletSyncProvider>
          <DeviceManagementKitProvider dmkEnabled={dmkEnabled}>
            <CountervaluesMarketcap>
              <CounterValuesProvider initialState={initialCountervalues}>
                <AppDataStorageProvider>
                  <OnboardingContextProvider>
                    <PostOnboardingProviderWrapped>
                      <ToastProvider>
                        <NotificationsProvider>
                          <SnackbarContainer />
                          <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
                            <InViewContextProvider>{children}</InViewContextProvider>
                          </NftMetadataProvider>
                        </NotificationsProvider>
                      </ToastProvider>
                    </PostOnboardingProviderWrapped>
                  </OnboardingContextProvider>
                </AppDataStorageProvider>
              </CounterValuesProvider>
            </CountervaluesMarketcap>
          </DeviceManagementKitProvider>
        </WalletSyncProvider>
      </BridgeSyncProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
