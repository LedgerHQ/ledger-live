import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  failOperation,
  isOperationActive,
  startOperation,
  succeedOperation,
  type OperationAttributes,
  type OperationFailureReason,
  type OperationId,
  type OperationTracker,
} from "@shared/observability-operations";

export type UseOperationOptions = {
  operationKey?: string;
  /** Fails the operation as `ABANDONED` on unmount when this component started it. */
  abandonOnUnmount?: boolean;
};

export type OperationHandle = {
  /** @returns whether a start event was sent. */
  start: (attributes?: OperationAttributes) => boolean;
  /** @returns whether a success event was sent. */
  succeed: (attributes?: OperationAttributes) => boolean;
  /** @returns whether a failure event was sent. */
  fail: (reason: OperationFailureReason, attributes?: OperationAttributes) => boolean;
  /** Whether the operation this component started is still active. */
  isActive: () => boolean;
};

/** The operations a hook drives: the app-wide tracker, or one a test builds. */
export type OperationHookTracker = Pick<
  OperationTracker,
  "start" | "succeed" | "fail" | "isActive"
>;

/** The operation a component started, as it was started. */
type StartedOperation = { name: string; operationKey?: string; id: OperationId };

/**
 * Builds a `useOperation` hook on a tracker. The hook drives one operation from a component:
 * - it acts on the operation it started, with the name and key it was started with, and does
 *   nothing once that operation ended, even when another one of the same name and key started since;
 * - it starts one operation at a time: `start` returns false while its operation is still active;
 * - on unmount, it fails its still active operation as `ABANDONED` with `{ trigger: "unmount" }`.
 * To end an operation started elsewhere, call the tracker. The handlers keep their identity across
 * renders, so they can go in dependency lists.
 */
export function createUseOperation(tracker: OperationHookTracker) {
  const isStillActive = (operation: StartedOperation | null): operation is StartedOperation =>
    operation !== null &&
    tracker.isActive(operation.name, {
      operationKey: operation.operationKey,
      expectedId: operation.id,
    });

  return function useOperation(
    name: string,
    { operationKey, abandonOnUnmount = true }: UseOperationOptions = {},
  ): OperationHandle {
    const options = useRef({ name, operationKey, abandonOnUnmount });
    const started = useRef<StartedOperation | null>(null);

    // A layout effect runs before the passive effects that may call `start`.
    useLayoutEffect(() => {
      options.current = { name, operationKey, abandonOnUnmount };
    }, [name, operationKey, abandonOnUnmount]);

    const start = useCallback((attributes?: OperationAttributes) => {
      if (isStillActive(started.current)) return false;
      // The latest options: the name and key may have changed since the first render.
      const latest = options.current;
      const id = tracker.start(latest.name, { operationKey: latest.operationKey, attributes });
      if (id === null) return false;
      started.current = { name: latest.name, operationKey: latest.operationKey, id };
      return true;
    }, []);

    const succeed = useCallback((attributes?: OperationAttributes) => {
      const operation = started.current;
      if (!operation) return false;
      started.current = null;
      return tracker.succeed(operation.name, {
        operationKey: operation.operationKey,
        attributes,
        expectedId: operation.id,
      });
    }, []);

    const fail = useCallback((reason: OperationFailureReason, attributes?: OperationAttributes) => {
      const operation = started.current;
      if (!operation) return false;
      started.current = null;
      return tracker.fail(operation.name, reason, {
        operationKey: operation.operationKey,
        attributes,
        expectedId: operation.id,
      });
    }, []);

    const isActive = useCallback(() => isStillActive(started.current), []);

    useEffect(
      () => () => {
        const operation = started.current;
        started.current = null;
        if (!operation || !options.current.abandonOnUnmount) return;
        tracker.fail(operation.name, "ABANDONED", {
          operationKey: operation.operationKey,
          attributes: { trigger: "unmount" },
          expectedId: operation.id,
        });
      },
      [],
    );

    return useMemo(() => ({ start, succeed, fail, isActive }), [start, succeed, fail, isActive]);
  };
}

/** Drives one operation of the app-wide tracker from a component: see `createUseOperation`. */
export const useOperation = createUseOperation({
  start: startOperation,
  succeed: succeedOperation,
  fail: failOperation,
  isActive: isOperationActive,
});
