import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { useLdmkFeatureFlagInitiallyEnabled } from "@ledgerhq/live-common/hooks/useLdmkFeatureFlagInitiallyEnabled";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { DeviceManagementKitProvider } from "@ledgerhq/live-dmk-mobile";
import { NftMetadataProvider } from "@ledgerhq/live-nft-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InViewProvider } from "LLM/contexts/InViewContext";
import { ModularDrawerProvider } from "LLM/features/ModularDrawer";
import { WalletSyncProvider } from "LLM/features/WalletSync/components/WalletSyncContext";
import React from "react";
import { BridgeSyncProvider } from "~/bridge/BridgeSyncContext";
import { CountervaluesMarketcapBridgedProvider } from "~/components/CountervaluesMarketcapProvider";
import { CountervaluesBridgedProvider } from "~/components/CountervaluesProvider";
import { AppDataStorageProvider } from "~/hooks/storageProvider/useAppDataStorage";
import PostOnboardingProviderWrapped from "~/logic/postOnboarding/PostOnboardingProviderWrapped";
import NotificationsProvider from "~/screens/NotificationCenter/NotificationsProvider";
import SnackbarContainer from "~/screens/NotificationCenter/Snackbar/SnackbarContainer";
import { OnboardingContextProvider } from "~/screens/Onboarding/onboardingContext";

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
            <CountervaluesMarketcapBridgedProvider>
              <CountervaluesBridgedProvider initialState={initialCountervalues}>
                <BottomSheetModalProvider>
                  <AppDataStorageProvider>
                    <OnboardingContextProvider>
                      <PostOnboardingProviderWrapped>
                        <NotificationsProvider>
                          <SnackbarContainer />
                          <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
                            <InViewProvider>
                              <ModularDrawerProvider>{children}</ModularDrawerProvider>
                            </InViewProvider>
                          </NftMetadataProvider>
                        </NotificationsProvider>
                      </PostOnboardingProviderWrapped>
                    </OnboardingContextProvider>
                  </AppDataStorageProvider>
                </BottomSheetModalProvider>
              </CountervaluesBridgedProvider>
            </CountervaluesMarketcapBridgedProvider>
          </DeviceManagementKitProvider>
        </WalletSyncProvider>
      </BridgeSyncProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
