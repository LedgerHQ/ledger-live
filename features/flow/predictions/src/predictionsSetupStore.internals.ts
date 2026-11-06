import { useState, useSyncExternalStore } from "react";
import type { PredictionsSetupOutcome } from "@features/platform-predictions";

/** How long the setup shows at least, so a quick answer doesn't flash past. */
export const MIN_SETUP_DISPLAY_MS = 1000;

type SetupRequest = {
  id: number;
  /** When the dialog came on screen. Null while it waits, e.g. behind the binding's sheet. */
  presentedAt: number | null;
  /** The first outcome reported, held until the loading has been on screen long enough. */
  reportedOutcome: PredictionsSetupOutcome | null;
  /** What the dialog shows: null while loading. */
  outcome: PredictionsSetupOutcome | null;
  closed: Promise<void>;
  resolveClosed: () => void;
};

/** What the setup dialog shows. `key` changes with every request and outcome. */
export type ShownSetup = Readonly<{ key: string; outcome: PredictionsSetupOutcome | null }>;

// Module-level so the Wallet API handlers of any live app player drive the one globally mounted dialog.
let currentRequest: SetupRequest | null = null;
let lastRequestId = 0;
const listeners = new Set<() => void>();

function setCurrentRequest(request: SetupRequest | null) {
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

const noop = () => undefined;

function createClosed(): Pick<SetupRequest, "closed" | "resolveClosed"> {
  let resolveClosed: () => void = noop;
  const closed = new Promise<void>(resolve => {
    resolveClosed = resolve;
  });
  return { closed, resolveClosed };
}

/** Replaces any open setup, so whoever waits for it to close can go on. Returns the setup's id. */
export function startPredictionsSetup(): number {
  const displacedRequest = currentRequest;
  const { closed, resolveClosed } = createClosed();
  lastRequestId += 1;
  setCurrentRequest({
    id: lastRequestId,
    presentedAt: null,
    reportedOutcome: null,
    outcome: null,
    closed,
    resolveClosed,
  });
  displacedRequest?.resolveClosed();
  return lastRequestId;
}

function showOutcomeOnceSeenLongEnough({ id, presentedAt, reportedOutcome }: SetupRequest) {
  if (presentedAt === null || reportedOutcome === null) return;

  const remainingMs = Math.max(0, presentedAt + MIN_SETUP_DISPLAY_MS - Date.now());
  setTimeout(() => {
    if (currentRequest?.id !== id || currentRequest.outcome !== null) return;
    setCurrentRequest({ ...currentRequest, outcome: reportedOutcome });
  }, remainingMs);
}

/**
 * Resolves once the user closes the dialog, or right away when `setupId` isn't open. Only the first
 * outcome shows, once the loading has been on screen long enough.
 */
export function reportPredictionsSetup(
  setupId: number,
  outcome: PredictionsSetupOutcome,
): Promise<void> {
  const request = currentRequest;
  if (request?.id !== setupId) return Promise.resolve();

  if (request.reportedOutcome === null) {
    const reportedRequest = { ...request, reportedOutcome: outcome };
    setCurrentRequest(reportedRequest);
    showOutcomeOnceSeenLongEnough(reportedRequest);
  }
  return request.closed;
}

/** The open setup came on screen: its minimum loading time starts now. */
export function markPredictionsSetupPresented() {
  const request = currentRequest;
  if (request?.presentedAt !== null) return;

  const presentedRequest = { ...request, presentedAt: Date.now() };
  setCurrentRequest(presentedRequest);
  showOutcomeOnceSeenLongEnough(presentedRequest);
}

/** Also lets whoever waits for the setup go on. */
export function dismissPredictionsSetup() {
  const request = currentRequest;
  if (!request) return;

  setCurrentRequest(null);
  request.resolveClosed();
}

export function dismissPredictionsSetupIfShown(setupId: number) {
  if (currentRequest?.id === setupId) dismissPredictionsSetup();
}

/** Once closed, the last state stays rendered so the dialog doesn't animate out empty. */
export function usePredictionsSetup(): Readonly<{
  isOpen: boolean;
  shownSetup: ShownSetup | null;
}> {
  const request = useSyncExternalStore(subscribe, getCurrentRequest, getCurrentRequest);
  const currentSetup =
    request === null
      ? null
      : { key: `${request.id}-${request.outcome?.outcome ?? "loading"}`, outcome: request.outcome };
  const [lastShownSetup, setLastShownSetup] = useState(currentSetup);

  if (currentSetup !== null && currentSetup.key !== lastShownSetup?.key) {
    setLastShownSetup(currentSetup);
  }

  return { isOpen: currentSetup !== null, shownSetup: currentSetup ?? lastShownSetup };
}
