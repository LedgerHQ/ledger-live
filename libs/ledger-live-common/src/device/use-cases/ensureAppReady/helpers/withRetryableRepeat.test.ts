import {
  FinalStateType,
  LoadingStateType,
  RetryableStateType,
  type EnsureAppReadyState,
} from "@ledgerhq/live-dmk-shared";
import { Observable } from "rxjs";
import { withRetryableRepeat } from "./withRetryableRepeat";

function makeLoadingState(): EnsureAppReadyState {
  return { type: LoadingStateType.Loading };
}

function makeSuccessState(): EnsureAppReadyState {
  return {
    type: FinalStateType.Success,
    extractedContext: {
      currentOsVersion: "1.0.0",
      osUpdateAvailable: false,
      currentAppName: "Ethereum",
      currentAppVersion: "1.0.0",
      derivedAddress: undefined,
    },
  };
}

function makeRetryableState(retry: () => void): EnsureAppReadyState {
  return {
    type: RetryableStateType.DeviceLocked,
    retry,
  };
}

function getRetry(state: EnsureAppReadyState): () => void {
  if ("retry" in state) {
    return state.retry;
  }

  throw new Error(`Expected retryable state, got ${state.type}`);
}

function subscribeToRetryableRepeat(
  attemptFactory: (retry: () => void, attemptIndex: number) => EnsureAppReadyState[],
) {
  const states: EnsureAppReadyState[] = [];
  const errors: unknown[] = [];
  let completed = false;
  let attemptCount = 0;

  const subscription = withRetryableRepeat(
    retry =>
      new Observable<EnsureAppReadyState>(observer => {
        const attemptStates = attemptFactory(retry, attemptCount);
        attemptCount += 1;

        attemptStates.forEach(state => observer.next(state));
        observer.complete();
      }),
  ).subscribe({
    next: state => states.push(state),
    error: error => errors.push(error),
    complete: () => {
      completed = true;
    },
  });

  return {
    attemptCount: () => attemptCount,
    completed: () => completed,
    errors,
    states,
    subscription,
  };
}

describe("withRetryableRepeat", () => {
  it("should complete without repeating when the attempt completes after a non-retryable state", () => {
    // WHEN
    const harness = subscribeToRetryableRepeat(() => [makeLoadingState(), makeSuccessState()]);

    // THEN
    expect(harness.states).toEqual([makeLoadingState(), makeSuccessState()]);
    expect(harness.completed()).toBe(true);
    expect(harness.attemptCount()).toBe(1);
    expect(harness.errors).toEqual([]);
    harness.subscription.unsubscribe();
  });

  it("should wait when the attempt completes after a retryable state", () => {
    // WHEN
    const harness = subscribeToRetryableRepeat(retry => [makeRetryableState(retry)]);

    // THEN
    expect(harness.states).toHaveLength(1);
    expect(harness.completed()).toBe(false);
    expect(harness.attemptCount()).toBe(1);
    harness.subscription.unsubscribe();
  });

  it("should repeat the attempt when retry is called", () => {
    // GIVEN
    const harness = subscribeToRetryableRepeat((retry, attemptIndex) =>
      attemptIndex === 0 ? [makeRetryableState(retry)] : [makeSuccessState()],
    );
    const retry = getRetry(harness.states[0]);

    // WHEN
    retry();

    // THEN
    expect(harness.states).toEqual([harness.states[0], makeSuccessState()]);
    expect(harness.completed()).toBe(true);
    expect(harness.attemptCount()).toBe(2);
    harness.subscription.unsubscribe();
  });

  it("should allow multiple retries across attempts", () => {
    // GIVEN
    const harness = subscribeToRetryableRepeat((retry, attemptIndex) =>
      attemptIndex < 2 ? [makeRetryableState(retry)] : [makeSuccessState()],
    );

    // WHEN
    const firstRetry = getRetry(harness.states[0]);
    firstRetry();
    const secondRetry = getRetry(harness.states[1]);
    secondRetry();

    // THEN
    expect(harness.states).toEqual([harness.states[0], harness.states[1], makeSuccessState()]);
    expect(harness.completed()).toBe(true);
    expect(harness.attemptCount()).toBe(3);
    harness.subscription.unsubscribe();
  });

  it("should ignore duplicate retry calls for the same attempt", () => {
    // GIVEN
    const harness = subscribeToRetryableRepeat((retry, attemptIndex) =>
      attemptIndex === 0 ? [makeRetryableState(retry)] : [makeSuccessState()],
    );
    const retry = getRetry(harness.states[0]);

    // WHEN
    retry();
    retry();

    // THEN
    expect(harness.completed()).toBe(true);
    expect(harness.attemptCount()).toBe(2);
    expect(harness.states).toEqual([harness.states[0], makeSuccessState()]);
    harness.subscription.unsubscribe();
  });

  it("should ignore stale retry callbacks from previous attempts", () => {
    // GIVEN
    const harness = subscribeToRetryableRepeat(retry => [makeRetryableState(retry)]);
    const firstRetry = getRetry(harness.states[0]);
    firstRetry();
    const secondAttemptCount = harness.attemptCount();

    // WHEN
    firstRetry();

    // THEN
    expect(harness.attemptCount()).toBe(secondAttemptCount);
    expect(harness.completed()).toBe(false);
    harness.subscription.unsubscribe();
  });
});
