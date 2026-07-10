/**
 * Bridges a UI hook that reports its outcome through `onSuccess` / `onError` / `onCancel`
 * callbacks into a Promise, with a single-shot guard so the first callback wins.
 *
 * Extracting this out of each handler keeps the handler bodies flat (the inline
 * `new Promise(... onSuccess/onError ...)` bridge otherwise nests function literals more
 * than 4 levels deep — Sonar S2004).
 *
 * The caller wires the callbacks into the concrete UI hook via `invokeUi` (rather than the
 * helper spreading them), because the UI hooks have heterogeneous shapes (some have no
 * `onCancel`, some no `onError`); this keeps each call site type-safe.
 */
export type UiCallbacks<R> = {
  onSuccess: (value: R) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
};

export type PromisifyUiHandlerOptions<UiResult, Result> = {
  /** Invokes the concrete UI hook, wiring the provided guarded callbacks into it. */
  invokeUi: (callbacks: UiCallbacks<UiResult>) => void;
  /** Called once, right before resolving (e.g. tracking success). */
  onSuccess?: () => void;
  /** Called once on error or cancel, right before rejecting (e.g. tracking failure). */
  onFail?: () => void;
  /** Maps the UI result to the resolved value. Defaults to identity. */
  mapResult?: (value: UiResult) => Result;
  /** Error to reject with on cancel. Defaults to `new Error("User cancelled")`. */
  cancelError?: () => Error;
};

export function promisifyUiHandler<UiResult, Result = UiResult>({
  invokeUi,
  onSuccess,
  onFail,
  mapResult,
  cancelError,
}: PromisifyUiHandlerOptions<UiResult, Result>): Promise<Result> {
  return new Promise<Result>((resolve, reject) => {
    let done = false;
    const settle = (action: () => void) => {
      if (done) return;
      done = true;
      action();
    };

    invokeUi({
      onSuccess: value =>
        settle(() => {
          onSuccess?.();
          resolve(mapResult ? mapResult(value) : (value as unknown as Result));
        }),
      onError: error =>
        settle(() => {
          onFail?.();
          reject(error);
        }),
      onCancel: () =>
        settle(() => {
          onFail?.();
          reject(cancelError ? cancelError() : new Error("User cancelled"));
        }),
    });
  });
}
