import { useState, useSyncExternalStore } from "react";
import type { PredictionsOnboardingStep, PredictionsSheet } from "@features/platform-predictions";

type PredictionsSheetRequest = {
  id: number;
  sheet: PredictionsSheet;
  stepIndex: number;
  onCancel: () => void;
};

/** A step on screen. `key` changes with every request and step, so each one starts fresh. */
export type ShownStep = Readonly<{ key: string; step: PredictionsOnboardingStep }>;

// Module-level so the Wallet API handlers of any live app player drive the one globally mounted sheet.
let currentRequest: PredictionsSheetRequest | null = null;
let lastRequestId = 0;
const listeners = new Set<() => void>();

function setCurrentRequest(request: PredictionsSheetRequest | null) {
  currentRequest = request;
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getCurrentRequest = () => currentRequest;

const stepKeyOf = (request: PredictionsSheetRequest) => `${request.id}-${request.stepIndex}`;

/** Shows `sheet`, replacing the open one, which is cancelled so its Wallet API call doesn't hang. */
export function showPredictionsSheet(sheet: PredictionsSheet, onCancel: () => void) {
  const displacedRequest = currentRequest;
  lastRequestId += 1;
  setCurrentRequest({ id: lastRequestId, sheet, stepIndex: 0, onCancel });
  displacedRequest?.onCancel();
}

/** Closes the sheet and cancels its request, so its Wallet API call doesn't hang. */
export function dismissPredictionsSheet() {
  const request = currentRequest;
  if (!request) return;

  setCurrentRequest(null);
  request.onCancel();
}

/** Like `dismissPredictionsSheet`, but only while `sheet` is the one open. */
export function dismissPredictionsSheetIfShown(sheet: PredictionsSheet) {
  if (currentRequest?.sheet === sheet) dismissPredictionsSheet();
}

/**
 * Accepts the step with `stepKey`. A sheet keeps its last content on screen while it closes, so a
 * late tap there must not accept the step of a request opened since.
 */
export function acceptPredictionsStep(stepKey: string) {
  const request = currentRequest;
  if (!request || stepKeyOf(request) !== stepKey) return;

  const { sheet, stepIndex } = request;
  const nextStepIndex = stepIndex + 1;
  const isLastStep = nextStepIndex === sheet.steps.length;

  setCurrentRequest(isLastStep ? null : { ...request, stepIndex: nextStepIndex });
  sheet.onStepAccept(sheet.steps[stepIndex]);
  if (isLastStep) sheet.onComplete();
}

/**
 * The step to render, and whether the sheet is open. Once closed, the last step stays rendered so
 * the sheet doesn't animate out empty.
 */
export function usePredictionsStep(): Readonly<{ isOpen: boolean; shownStep: ShownStep | null }> {
  const request = useSyncExternalStore(subscribe, getCurrentRequest, getCurrentRequest);
  const currentStep =
    request === null
      ? null
      : { key: stepKeyOf(request), step: request.sheet.steps[request.stepIndex] };
  const [lastShownStep, setLastShownStep] = useState(currentStep);

  if (currentStep !== null && currentStep.key !== lastShownStep?.key) {
    setLastShownStep(currentStep);
  }

  return { isOpen: currentStep !== null, shownStep: currentStep ?? lastShownStep };
}
