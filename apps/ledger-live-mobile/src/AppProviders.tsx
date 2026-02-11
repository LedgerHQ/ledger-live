import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useLdmkFeatureFlagInitiallyEnabled } from "@ledgerhq/live-common/hooks/useLdmkFeatureFlagInitiallyEnabled";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-mobile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InViewProvider } from "LLM/contexts/InViewContext";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import GlobalDrawers from "./GlobalDrawers";
import { WalletSyncProvider } from "LLM/features/WalletSync/components/WalletSyncContext";
import React from "react";
import { CountervaluesBridgedProvider } from "~/components/CountervaluesProvider";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";

type AppProvidersProps = {
  initialCountervalues?: CounterValuesStateRaw;
  children: React.JSX.Element;
};

const queryClient = new QueryClient();

function AppProviders({ initialCountervalues, children }: AppProvidersProps) {
  logStartupEvent("AppProviders render");
  const dmkEnabled = useLdmkFeatureFlagInitiallyEnabled();

  return (
    <QueryClientProvider client={queryClient}>
      <WalletSyncProvider>
        <DeviceManagementKitProvider dmkEnabled={dmkEnabled}>
          <CountervaluesBridgedProvider initialState={initialCountervalues}>
            <BottomSheetModalProvider>
              <PostOnboardingProviderWrapped>
                <NotificationsProvider>
                  <SnackbarContainer />
                  <InViewProvider>
                    <GlobalDrawers>{children}</GlobalDrawers>
                  </InViewProvider>
                </NotificationsProvider>
              </PostOnboardingProviderWrapped>
            </BottomSheetModalProvider>
          </CountervaluesBridgedProvider>
        </DeviceManagementKitProvider>
      </WalletSyncProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
