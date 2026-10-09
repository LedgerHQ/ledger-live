import { BottomSheetModalProvider, GlobalTooltipBottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-mobile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLockProvider } from "LLM/features/AppLock/AppLockProvider";
import { InViewProvider } from "LLM/contexts/InViewContext";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import GlobalDrawers from "./GlobalDrawers";
import { WalletSyncProvider } from "LLM/features/WalletSync/components/WalletSyncContext";
import React from "react";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";

type AppProvidersProps = {
  children: React.JSX.Element;
};

const queryClient = new QueryClient();

function AppProviders({ children }: AppProvidersProps) {
  logStartupEvent("AppProviders render");

  return (
    <QueryClientProvider client={queryClient}>
      <WalletSyncProvider>
        <DeviceManagementKitProvider>
          <BottomSheetModalProvider>
            <AppLockProvider>
              <PostOnboardingProviderWrapped>
                <NotificationsProvider>
                  <SnackbarContainer />
                  <InViewProvider>
                    <GlobalDrawers>{children}</GlobalDrawers>
                  </InViewProvider>
                </NotificationsProvider>
              </PostOnboardingProviderWrapped>
              <GlobalTooltipBottomSheet />
            </AppLockProvider>
          </BottomSheetModalProvider>
        </DeviceManagementKitProvider>
      </WalletSyncProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
