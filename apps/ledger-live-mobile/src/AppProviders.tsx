import { BottomSheetModalProvider, GlobalTooltipBottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-mobile";
import { useSelector } from "~/context/hooks";
import { mockServerConfigSelector } from "~/reducers/settings";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLockProvider } from "LLM/features/AppLock/AppLockProvider";
import { InViewProvider } from "LLM/contexts/InViewContext";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import GlobalDrawers from "./GlobalDrawers";
import { useLedgerSyncWatch } from "@features/platform-wallet-sync";
import React from "react";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";

type AppProvidersProps = {
  children: React.JSX.Element;
};

const queryClient = new QueryClient();

function AppProviders({ children }: Readonly<AppProvidersProps>) {
  logStartupEvent("AppProviders render");
  const mockServerConfig = useSelector(mockServerConfigSelector);
  useLedgerSyncWatch();

  return (
    <QueryClientProvider client={queryClient}>
      <DeviceManagementKitProvider mockServerConfig={mockServerConfig}>
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
    </QueryClientProvider>
  );
}

export default AppProviders;
