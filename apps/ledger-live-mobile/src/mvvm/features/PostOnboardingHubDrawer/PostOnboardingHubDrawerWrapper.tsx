import React, { useMemo } from "react";
import { BottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { PostOnboardingHubDrawerView } from "./PostOnboardingHubDrawerView";
import { usePostOnboardingHubDrawerViewModel } from "./hooks/usePostOnboardingHubDrawerViewModel";
import { getPostOnboardingHubSnapHeightPercent } from "./utils/postOnboardingHubDrawerSnapPoints";

export function PostOnboardingHubDrawerWrapper() {
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

  const snapPoints = useMemo(() => {
    const percent = getPostOnboardingHubSnapHeightPercent(
      stepperDisplay.totalSteps,
      areAllPostOnboardingActionsCompleted,
    );
    return [`${percent}%`];
  }, [areAllPostOnboardingActionsCompleted, stepperDisplay.totalSteps]);

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
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
      </BottomSheet>
      <ActivationDrawer
        startingStep={Steps.Activation}
        isOpen={isActivationDrawerVisible}
        handleClose={closeActivationDrawer}
      />
    </>
  );
}
