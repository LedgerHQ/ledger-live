import { useState, useSyncExternalStore } from "react";

/** How long the loading shows at least, so a quick answer doesn't flash past. */
export const MIN_LOADING_DISPLAY_MS = 1000;

const noop = () => undefined;

type ResultRequest<Result, Answer, Context> = {
  id: number;
  context: Context;
  /** When the sheet came on screen. Null while it waits, e.g. behind the signing sheet. */
  presentedAt: number | null;
  /** The first result reported, held until the loading has been on screen long enough. */
  reportedResult: Result | null;
  /** What the sheet shows: null while loading. */
  result: Result | null;
  isTimedOut: boolean;
  timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  closed: Promise<Answer>;
  resolveClosed: (answer: Answer) => void;
};

/** What the sheet shows. `key` changes with every request and result. */
export type ShownResult<Result, Context = void> = Readonly<{
  id: number;
  key: string;
  context: Context;
  result: Result | null;
}>;

export type PendingResultStore<Result, Answer, Context> = Readonly<{
  /** Replaces any open request, so whoever waits for it can go on. Returns the request's id. */
  start: (context: Context) => number;
  /**
   * Resolves once the user closes the sheet, or right away when `id` isn't open or timed out. Only
   * the first result shows, once the loading has been on screen long enough.
   */
  report: (id: number, result: Result) => Promise<Answer>;
  /** The open request came on screen: its minimum loading time starts now. */
  markPresented: () => void;
  /** Closes the sheet and answers whoever waits for it. */
  close: (answer: Answer) => void;
  dismiss: () => void;
  /** Closes the sheet with `answer` when `id` is still the open request. */
  closeIfShown: (id: number, answer: Answer) => void;
  dismissIfShown: (id: number) => void;
  /** Once closed, the last state stays rendered so the sheet doesn't animate out empty. */
  useShownResult: () => Readonly<{
    isOpen: boolean;
    shownResult: ShownResult<Result, Context> | null;
  }>;
}>;

/**
 * A sheet that loads until the live app reports a result, then shows it until the user closes it.
 * Module-level instances let the Wallet API handlers of any live app player drive the one globally
 * mounted sheet.
 */
export function createPendingResultStore<Result, Answer, Context = void>({
  dismissedAnswer,
  timeout,
}: Readonly<{
  dismissedAnswer: Answer;
  timeout?: Readonly<{ ms: number; result: Result }>;
}>): PendingResultStore<Result, Answer, Context> {
  let currentRequest: ResultRequest<Result, Answer, Context> | null = null;
  let lastRequestId = 0;
  const listeners = new Set<() => void>();

  const setCurrentRequest = (request: ResultRequest<Result, Answer, Context> | null) => {
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

  const showResultOnceSeenLongEnough = ({
    id,
    presentedAt,
    reportedResult,
  }: ResultRequest<Result, Answer, Context>) => {
    if (presentedAt === null || reportedResult === null) return;

    const remainingMs = Math.max(0, presentedAt + MIN_LOADING_DISPLAY_MS - Date.now());
    setTimeout(() => {
      if (currentRequest?.id !== id || currentRequest.result !== null) return;
      setCurrentRequest({ ...currentRequest, result: reportedResult });
    }, remainingMs);
  };

  const timeOut = (id: number, result: Result) => {
    const request = currentRequest;
    if (request?.id !== id || request.reportedResult !== null) return;

    const timedOutRequest = { ...request, reportedResult: result, isTimedOut: true };
    setCurrentRequest(timedOutRequest);
    showResultOnceSeenLongEnough(timedOutRequest);
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
        reportedResult: null,
        result: null,
        isTimedOut: false,
        timeoutTimer: timeout && setTimeout(() => timeOut(id, timeout.result), timeout.ms),
        closed,
        resolveClosed,
      });
      if (displacedRequest) {
        clearTimeout(displacedRequest.timeoutTimer);
        displacedRequest.resolveClosed(dismissedAnswer);
      }
      return id;
    },
    report: (id, result) => {
      const request = currentRequest;
      if (request?.id !== id || request.isTimedOut) return Promise.resolve(dismissedAnswer);

      if (request.reportedResult === null) {
        const reportedRequest = { ...request, reportedResult: result };
        setCurrentRequest(reportedRequest);
        showResultOnceSeenLongEnough(reportedRequest);
      }
      return request.closed;
    },
    markPresented: () => {
      const request = currentRequest;
      if (request?.presentedAt !== null) return;

      const presentedRequest = { ...request, presentedAt: Date.now() };
      setCurrentRequest(presentedRequest);
      showResultOnceSeenLongEnough(presentedRequest);
    },
    close,
    dismiss,
    closeIfShown: (id, answer) => {
      if (currentRequest?.id === id) close(answer);
    },
    dismissIfShown: id => {
      if (currentRequest?.id === id) dismiss();
    },
    useShownResult: () => {
      const request = useSyncExternalStore(subscribe, getCurrentRequest, getCurrentRequest);
      const currentResult =
        request === null
          ? null
          : {
              id: request.id,
              key: `${request.id}-${request.result === null ? "loading" : "result"}`,
              context: request.context,
              result: request.result,
            };
      const [lastShownResult, setLastShownResult] = useState(currentResult);

      if (currentResult !== null && currentResult.key !== lastShownResult?.key) {
        setLastShownResult(currentResult);
      }

      return { isOpen: currentResult !== null, shownResult: currentResult ?? lastShownResult };
    },
  };
}
