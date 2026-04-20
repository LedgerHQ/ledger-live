import React from "react";
import { Platform } from "react-native";
import { BottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { PostOnboardingHubDrawerView } from "./PostOnboardingHubDrawerView";
import { usePostOnboardingHubDrawerViewModel } from "./hooks/usePostOnboardingHubDrawerViewModel";

export function PostOnboardingHubDrawerWrapper() {
  const insets = useSafeAreaInsets();
  const {
    bottomSheetRef,
    areDrawersLocked,
    deviceModelId,
    productName,
    actionsState,
    isLedgerSyncActive,
    accounts,
    openActivationDrawer,
    isActivationDrawerVisible,
    closeActivationDrawer,
    areAllPostOnboardingActionsCompleted,
    stepperDisplay,
    closePostOnboardingHubDrawer,
    onRequestExit,
  } = usePostOnboardingHubDrawerViewModel();

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["70%"]}
        enablePanDownToClose={!areDrawersLocked}
        hideCloseButton={areDrawersLocked}
        onDismiss={closePostOnboardingHubDrawer}
        backdropPressBehavior={areDrawersLocked ? "none" : "close"}
      >
        <IsInDrawerProvider>
          {deviceModelId ? (
            <>
              <TrackScreen
                key={areAllPostOnboardingActionsCompleted.toString()}
                category={
                  areAllPostOnboardingActionsCompleted
                    ? "User has completed all post-onboarding actions"
                    : "Post-onboarding hub"
                }
                deviceModelId={deviceModelId}
                flow="post-onboarding"
              />
              <PostOnboardingHubDrawerView
                deviceModelId={deviceModelId}
                productName={productName}
                actionsState={actionsState}
                isLedgerSyncActive={isLedgerSyncActive}
                accounts={accounts}
                openActivationDrawer={openActivationDrawer}
                onRequestExit={onRequestExit}
                onActionPress={closePostOnboardingHubDrawer}
                stepperDisplay={stepperDisplay}
                areAllPostOnboardingActionsCompleted={areAllPostOnboardingActionsCompleted}
              />
            </>
          ) : null}
        </IsInDrawerProvider>
        <Box height={Platform.OS === "android" ? insets.bottom : 0} />
      </BottomSheet>
      <ActivationDrawer
        startingStep={Steps.Activation}
        isOpen={isActivationDrawerVisible}
        handleClose={closeActivationDrawer}
      />
    </>
  );
}
