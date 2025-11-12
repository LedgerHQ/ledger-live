import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useLdmkFeatureFlagInitiallyEnabled } from "@ledgerhq/live-common/hooks/useLdmkFeatureFlagInitiallyEnabled";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-mobile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InViewProvider } from "LLM/contexts/InViewContext";
import { ModularDrawerProvider } from "LLM/features/ModularDrawer";
import { WalletSyncProvider } from "LLM/features/WalletSync/components/WalletSyncContext";
import React from "react";
import { CountervaluesMarketcapBridgedProvider } from "~/components/CountervaluesMarketcapProvider";
import { CountervaluesBridgedProvider } from "~/components/CountervaluesProvider";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";

type AppProvidersProps = {
  initialCountervalues?: CounterValuesStateRaw;
  children: JSX.Element;
};

const queryClient = new QueryClient();

function AppProviders({ initialCountervalues, children }: AppProvidersProps) {
  const dmkEnabled = useLdmkFeatureFlagInitiallyEnabled();

  return (
    <QueryClientProvider client={queryClient}>
      <WalletSyncProvider>
        <DeviceManagementKitProvider dmkEnabled={dmkEnabled}>
          <CountervaluesMarketcapBridgedProvider>
            <CountervaluesBridgedProvider initialState={initialCountervalues}>
              <BottomSheetModalProvider>
                <PostOnboardingProviderWrapped>
                  <NotificationsProvider>
                    <SnackbarContainer />
                    <InViewProvider>
                      <ModularDrawerProvider>{children}</ModularDrawerProvider>
                    </InViewProvider>
                  </NotificationsProvider>
                </PostOnboardingProviderWrapped>
              </BottomSheetModalProvider>
            </CountervaluesBridgedProvider>
          </CountervaluesMarketcapBridgedProvider>
        </DeviceManagementKitProvider>
      </WalletSyncProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
