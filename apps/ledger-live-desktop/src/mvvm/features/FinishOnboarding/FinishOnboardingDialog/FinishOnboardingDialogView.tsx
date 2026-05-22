import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Stepper,
} from "@ledgerhq/lumen-ui-react";
import { LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import PostOnboardingAction from "./components/PostOnboardingAction";
import { cn } from "LLD/utils/cn";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { FinishOnboardingDialogViewProps } from "./hooks/useFinishOnboardingDialogViewModel";

const FinishOnboardingDialogView = ({
  actions,
  allActionsCompleted,
  completedActionsAmount,
  deviceModelId,
  isOpen,
  onClose,
  onGotIt,
  onGotItLabel,
  title,
  totalActionsAmount,
}: FinishOnboardingDialogViewProps) => {
  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {isOpen && <TrackPage category="Post onboarding widget" flow="post-onboarding" />}
      <DialogContent
        className="bg-canvas flex h-auto max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader onClose={onClose} className="!mb-0 shrink-0" />
        <DialogBody className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto p-16 pt-0">
          {/*
            The first “step” is a hardcoded `deviceOnboarded` row, not from `actions`.
            `completedActionsAmount` / `totalActionsAmount` include `IMPLICIT_DEVICE_STEP_OFFSET` in
            `hooks/utils.ts` so the stepper matches that row + `actionList` below.
          */}
          <div className="flex flex-col p-8 gap-16">
            <Stepper
              className="h-54 w-54 text-interactive-subtle"
              currentStep={completedActionsAmount}
              totalSteps={totalActionsAmount}
              label={`${completedActionsAmount}/${totalActionsAmount}`}
            />
            <div className="flex flex-col">
              <span className="heading-4-semi-bold text-base">{title}</span>
            </div>
          </div>
          {/*
            This row is always `completed` (only the checkmark is shown, not `lumenSymbol`); a
            concrete symbol is still required by `PostOnboardingAction`.
          */}
          <PostOnboardingAction
            key={PostOnboardingActionId.deviceOnboarded}
            completed
            description=""
            deviceModelId={deviceModelId}
            lumenSymbol={LedgerDevices}
            postOnboardingActionId={PostOnboardingActionId.deviceOnboarded}
            shouldCompleteOnStart={false}
            startAction={() => { }}
            title="postOnboarding.dialog.actions.deviceOnboarded.title"
          />
          {actions.map(action => (
            <PostOnboardingAction
              key={action.id}
              buttonLabelForAnalyticsEvent={action.buttonLabelForAnalyticsEvent}
              completed={action.completed}
              description={action.description ?? ""}
              deviceModelId={deviceModelId}
              lumenSymbol={action.lumenSymbol}
              postOnboardingActionId={action.id}
              shouldCompleteOnStart={action.shouldCompleteOnStart ?? false}
              startAction={action.startAction}
              title={action.title}
            />
          ))}
          {/*
            Always render the same `Button` so the footer slot matches the visible CTA. When actions
            are not done yet, the control stays in the layout with `invisible` (keeps size, removes
            painting and hit-testing).
          */}
          <div className="w-full shrink-0 py-16">
            <Button
              appearance="base"
              size="lg"
              className={cn(
                "w-full",
                !allActionsCompleted && "invisible pointer-events-none select-none",
              )}
              type="button"
              onClick={allActionsCompleted ? onGotIt : undefined}
              tabIndex={allActionsCompleted ? undefined : -1}
              aria-hidden={!allActionsCompleted}
            >
              {onGotItLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default FinishOnboardingDialogView;
