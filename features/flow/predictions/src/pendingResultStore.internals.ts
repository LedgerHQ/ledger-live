import { useState, useSyncExternalStore } from "react";

/** How long the loading shows at least, so a quick answer doesn't flash past. */
export const MIN_RESULT_DISPLAY_MS = 1000;

type ResultOutcome = { outcome: string };

const noop = () => undefined;

type ResultRequest<Outcome, Answer, Context> = {
  id: number;
  /** What the request is about, given when it starts and shown with every outcome. */
  context: Context;
  /** When the sheet came on screen. Null while it waits, e.g. behind the signing sheet. */
  presentedAt: number | null;
  /** The first outcome reported, held until the loading has been on screen long enough. */
  reportedOutcome: Outcome | null;
  /** What the sheet shows: null while loading. */
  outcome: Outcome | null;
  /** Nothing was reported in time: the sheet shows the timeout's outcome and ignores reports. */
  isTimedOut: boolean;
  timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  closed: Promise<Answer>;
  resolveClosed: (answer: Answer) => void;
};

/** What the sheet shows. `key` changes with every request and outcome. */
export type ShownResult<Outcome, Context = void> = Readonly<{
  key: string;
  context: Context;
  outcome: Outcome | null;
}>;

export type PendingResultStore<Outcome, Answer, Context> = Readonly<{
  /** Replaces any open request, so whoever waits for it can go on. Returns the request's id. */
  start: (context: Context) => number;
  /**
   * Resolves once the user closes the sheet, or right away when `id` isn't open or timed out. Only
   * the first outcome shows, once the loading has been on screen long enough.
   */
  report: (id: number, outcome: Outcome) => Promise<Answer>;
  /** The open request came on screen: its minimum loading time starts now. */
  markPresented: () => void;
  /** Closes the sheet and answers whoever waits for it. */
  close: (answer: Answer) => void;
  dismiss: () => void;
  dismissIfShown: (id: number) => void;
  /** Once closed, the last state stays rendered so the sheet doesn't animate out empty. */
  useShownResult: () => Readonly<{
    isOpen: boolean;
    shownResult: ShownResult<Outcome, Context> | null;
  }>;
}>;

/**
 * A sheet that loads until the live app reports an outcome, then shows it until the user closes it.
 * Module-level instances let the Wallet API handlers of any live app player drive the one globally
 * mounted sheet.
 */
export function createPendingResultStore<Outcome extends ResultOutcome, Answer, Context = void>({
  dismissedAnswer,
  timeout,
}: Readonly<{
  /** What a dismissed, replaced, unopened or timed out request answers. */
  dismissedAnswer: Answer;
  /** Shows `outcome` when nothing was reported `ms` after the request started. */
  timeout?: Readonly<{ ms: number; outcome: Outcome }>;
}>): PendingResultStore<Outcome, Answer, Context> {
  let currentRequest: ResultRequest<Outcome, Answer, Context> | null = null;
  let lastRequestId = 0;
  const listeners = new Set<() => void>();

  const setCurrentRequest = (request: ResultRequest<Outcome, Answer, Context> | null) => {
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
  }: ResultRequest<Outcome, Answer, Context>) => {
    if (presentedAt === null || reportedOutcome === null) return;

    const remainingMs = Math.max(0, presentedAt + MIN_RESULT_DISPLAY_MS - Date.now());
    setTimeout(() => {
      if (currentRequest?.id !== id || currentRequest.outcome !== null) return;
      setCurrentRequest({ ...currentRequest, outcome: reportedOutcome });
    }, remainingMs);
  };

  const timeOut = (id: number, outcome: Outcome) => {
    const request = currentRequest;
    if (request?.id !== id || request.reportedOutcome !== null) return;

    const timedOutRequest = { ...request, reportedOutcome: outcome, isTimedOut: true };
    setCurrentRequest(timedOutRequest);
    showOutcomeOnceSeenLongEnough(timedOutRequest);
  };

  const close = (answer: Answer) => {
    const request = currentRequest;
    if (!request) return;

    clearTimeout(request.timeoutTimer);
    setCurrentRequest(null);
    request.resolveClosed(answer);
  };

  const dismiss = () => close(dismissedAnswer);

  return {
    start: context => {
      const displacedRequest = currentRequest;
      let resolveClosed: (answer: Answer) => void = noop;
      const closed = new Promise<Answer>(resolve => {
        resolveClosed = resolve;
      });
      lastRequestId += 1;
      const id = lastRequestId;
      setCurrentRequest({
        id,
        context,
        presentedAt: null,
        reportedOutcome: null,
        outcome: null,
        isTimedOut: false,
        timeoutTimer: timeout && setTimeout(() => timeOut(id, timeout.outcome), timeout.ms),
        closed,
        resolveClosed,
      });
      if (displacedRequest) {
        clearTimeout(displacedRequest.timeoutTimer);
        displacedRequest.resolveClosed(dismissedAnswer);
      }
      return id;
    },
    report: (id, outcome) => {
      const request = currentRequest;
      if (request?.id !== id || request.isTimedOut) return Promise.resolve(dismissedAnswer);

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
              context: request.context,
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
