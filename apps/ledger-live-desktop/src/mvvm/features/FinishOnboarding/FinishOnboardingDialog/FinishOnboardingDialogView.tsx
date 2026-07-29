import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Stepper,
} from "@ledgerhq/lumen-ui-react";
import PostOnboardingAction from "./components/PostOnboardingAction";
import { cn } from "LLD/utils/cn";
import TrackPage from "~/renderer/analytics/TrackPage";
import type { FinishOnboardingDialogViewProps } from "./hooks/useFinishOnboardingDialogViewModel";

const FinishOnboardingDialogView = ({
  steps,
  allStepsCompleted,
  completedStepsAmount,
  deviceModelId,
  isOpen,
  onClose,
  onGotIt,
  onGotItLabel,
  title,
  totalStepsAmount,
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
          <div className="flex flex-col p-8 gap-16">
            <Stepper
              className="h-54 w-54 text-interactive-subtle"
              currentStep={completedStepsAmount}
              totalSteps={totalStepsAmount}
              label={`${completedStepsAmount}/${totalStepsAmount}`}
            />
            <div className="flex flex-col">
              <span className="heading-4-semi-bold text-base">{title}</span>
            </div>
          </div>
          {steps.map(step => (
            <PostOnboardingAction
              key={step.id}
              buttonLabelForAnalyticsEvent={step.buttonLabelForAnalyticsEvent}
              completed={step.completed}
              description={step.description ?? ""}
              deviceModelId={deviceModelId}
              lumenSymbol={step.lumenSymbol}
              postOnboardingActionId={step.id}
              shouldCompleteOnStart={step.shouldCompleteOnStart ?? false}
              startAction={step.startAction}
              title={step.title}
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
                !allStepsCompleted && "invisible pointer-events-none select-none",
              )}
              type="button"
              onClick={allStepsCompleted ? onGotIt : undefined}
              tabIndex={allStepsCompleted ? undefined : -1}
              aria-hidden={!allStepsCompleted}
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
