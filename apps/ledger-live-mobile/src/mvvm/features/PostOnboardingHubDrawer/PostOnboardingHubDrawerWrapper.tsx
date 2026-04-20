import React, { useEffect, useMemo } from "react";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { TrackScreen } from "~/analytics";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { PostOnboardingHubDrawerView } from "./PostOnboardingHubDrawerView";
import { usePostOnboardingHubDrawerViewModel } from "./hooks/usePostOnboardingHubDrawerViewModel";
import { getPostOnboardingHubSnapHeightPercent } from "./utils/postOnboardingHubDrawerSnapPoints";

export function PostOnboardingHubDrawerWrapper() {
  const {
    isPostOnboardingHubDrawerOpen,
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

  const canOpenPostOnboardingHubDrawer = isPostOnboardingHubDrawerOpen && !!deviceModelId;

  useEffect(() => {
    if (isPostOnboardingHubDrawerOpen && !deviceModelId) {
      closePostOnboardingHubDrawer();
    }
  }, [closePostOnboardingHubDrawer, deviceModelId, isPostOnboardingHubDrawerOpen]);

  return (
    <>
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={canOpenPostOnboardingHubDrawer}
        onClose={closePostOnboardingHubDrawer}
        snapPoints={snapPoints}
      >
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
              closeHubDrawer={closePostOnboardingHubDrawer}
              stepperDisplay={stepperDisplay}
              areAllPostOnboardingActionsCompleted={areAllPostOnboardingActionsCompleted}
            />
          </>
        ) : null}
      </QueuedDrawerBottomSheet>
      <ActivationDrawer
        startingStep={Steps.Activation}
        isOpen={isActivationDrawerVisible}
        handleClose={closeActivationDrawer}
      />
    </>
  );
}
