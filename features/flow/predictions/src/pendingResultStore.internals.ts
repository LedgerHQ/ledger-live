import { useState, useSyncExternalStore } from "react";

/** How long the loading shows at least, so a quick answer doesn't flash past. */
export const MIN_RESULT_DISPLAY_MS = 1000;

type ResultOutcome = { outcome: string };

const noop = () => undefined;

type ResultRequest<Outcome, Answer> = {
  id: number;
  /** When the sheet came on screen. Null while it waits, e.g. behind the signing sheet. */
  presentedAt: number | null;
  /** The first outcome reported, held until the loading has been on screen long enough. */
  reportedOutcome: Outcome | null;
  /** What the sheet shows: null while loading. */
  outcome: Outcome | null;
  closed: Promise<Answer>;
  resolveClosed: (answer: Answer) => void;
};

/** What the sheet shows. `key` changes with every request and outcome. */
export type ShownResult<Outcome> = Readonly<{ key: string; outcome: Outcome | null }>;

export type PendingResultStore<Outcome, Answer> = Readonly<{
  /** Replaces any open request, so whoever waits for it can go on. Returns the request's id. */
  start: () => number;
  /**
   * Resolves once the user closes the sheet, or right away when `id` isn't open. Only the first
   * outcome shows, once the loading has been on screen long enough.
   */
  report: (id: number, outcome: Outcome) => Promise<Answer>;
  /** The open request came on screen: its minimum loading time starts now. */
  markPresented: () => void;
  /** Closes the sheet and answers whoever waits for it. */
  close: (answer: Answer) => void;
  dismiss: () => void;
  dismissIfShown: (id: number) => void;
  /** Once closed, the last state stays rendered so the sheet doesn't animate out empty. */
  useShownResult: () => Readonly<{ isOpen: boolean; shownResult: ShownResult<Outcome> | null }>;
}>;

/**
 * A sheet that loads until the live app reports an outcome, then shows it until the user closes it.
 * Module-level instances let the Wallet API handlers of any live app player drive the one globally
 * mounted sheet.
 */
export function createPendingResultStore<Outcome extends ResultOutcome, Answer>({
  dismissedAnswer,
}: Readonly<{
  /** What a dismissed, replaced or unopened request answers. */
  dismissedAnswer: Answer;
}>): PendingResultStore<Outcome, Answer> {
  let currentRequest: ResultRequest<Outcome, Answer> | null = null;
  let lastRequestId = 0;
  const listeners = new Set<() => void>();

  const setCurrentRequest = (request: ResultRequest<Outcome, Answer> | null) => {
    currentRequest = request;
    listeners.forEach(listener => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const getCurrentRequest = () => currentRequest;

  const showOutcomeOnceSeenLongEnough = ({
    id,
    presentedAt,
    reportedOutcome,
  }: ResultRequest<Outcome, Answer>) => {
    if (presentedAt === null || reportedOutcome === null) return;

    const remainingMs = Math.max(0, presentedAt + MIN_RESULT_DISPLAY_MS - Date.now());
    setTimeout(() => {
      if (currentRequest?.id !== id || currentRequest.outcome !== null) return;
      setCurrentRequest({ ...currentRequest, outcome: reportedOutcome });
    }, remainingMs);
  };

  const close = (answer: Answer) => {
    const request = currentRequest;
    if (!request) return;

    setCurrentRequest(null);
    request.resolveClosed(answer);
  };

  const dismiss = () => close(dismissedAnswer);

  return {
    start: () => {
      const displacedRequest = currentRequest;
      let resolveClosed: (answer: Answer) => void = noop;
      const closed = new Promise<Answer>(resolve => {
        resolveClosed = resolve;
      });
      lastRequestId += 1;
      setCurrentRequest({
        id: lastRequestId,
        presentedAt: null,
        reportedOutcome: null,
        outcome: null,
        closed,
        resolveClosed,
      });
      displacedRequest?.resolveClosed(dismissedAnswer);
      return lastRequestId;
    },
    report: (id, outcome) => {
      const request = currentRequest;
      if (request?.id !== id) return Promise.resolve(dismissedAnswer);

      if (request.reportedOutcome === null) {
        const reportedRequest = { ...request, reportedOutcome: outcome };
        setCurrentRequest(reportedRequest);
        showOutcomeOnceSeenLongEnough(reportedRequest);
      }
      return request.closed;
    },
    markPresented: () => {
      const request = currentRequest;
      if (request?.presentedAt !== null) return;

      const presentedRequest = { ...request, presentedAt: Date.now() };
      setCurrentRequest(presentedRequest);
      showOutcomeOnceSeenLongEnough(presentedRequest);
    },
    close,
    dismiss,
    dismissIfShown: id => {
      if (currentRequest?.id === id) dismiss();
    },
    useShownResult: () => {
      const request = useSyncExternalStore(subscribe, getCurrentRequest, getCurrentRequest);
      const currentResult =
        request === null
          ? null
          : {
              key: `${request.id}-${request.outcome?.outcome ?? "loading"}`,
              outcome: request.outcome,
            };
      const [lastShownResult, setLastShownResult] = useState(currentResult);

      if (currentResult !== null && currentResult.key !== lastShownResult?.key) {
        setLastShownResult(currentResult);
      }

      return { isOpen: currentResult !== null, shownResult: currentResult ?? lastShownResult };
    },
  };
}
