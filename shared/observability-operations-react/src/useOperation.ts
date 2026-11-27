import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  annotateOperation,
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
  abandonOnUnmount?: boolean;
};

export type OperationHandle = {
  start: (attributes?: OperationAttributes) => boolean;
  annotate: (attributes: OperationAttributes) => boolean;
  succeed: (attributes?: OperationAttributes) => boolean;
  fail: (reason: OperationFailureReason, attributes?: OperationAttributes) => boolean;
  isActive: () => boolean;
};

export type OperationHookTracker = Pick<
  OperationTracker,
  "start" | "annotate" | "succeed" | "fail" | "isActive"
>;

type StartedOperation = { name: string; operationKey?: string; id: OperationId };

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
    const latestOptions = useRef({ name, operationKey, abandonOnUnmount });
    const started = useRef<StartedOperation | null>(null);

    // Runs before the passive effects that may call `start`.
    useLayoutEffect(() => {
      latestOptions.current = { name, operationKey, abandonOnUnmount };
      const operation = started.current;
      const identityChanged =
        operation !== null && (operation.name !== name || operation.operationKey !== operationKey);
      if (!operation || !identityChanged) return;
      started.current = null;
      tracker.fail(operation.name, "ABANDONED", {
        operationKey: operation.operationKey,
        attributes: { trigger: "identity_change" },
        expectedId: operation.id,
      });
    }, [name, operationKey, abandonOnUnmount]);

    const start = useCallback((attributes?: OperationAttributes) => {
      if (isStillActive(started.current)) return false;
      const latest = latestOptions.current;
      const id = tracker.start(latest.name, { operationKey: latest.operationKey, attributes });
      if (id === null) return false;
      started.current = { name: latest.name, operationKey: latest.operationKey, id };
      return true;
    }, []);

    const annotate = useCallback((attributes: OperationAttributes) => {
      const operation = started.current;
      if (!operation) return false;
      return tracker.annotate(operation.name, {
        operationKey: operation.operationKey,
        attributes,
        expectedId: operation.id,
      });
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
        if (!operation || !latestOptions.current.abandonOnUnmount) return;
        tracker.fail(operation.name, "ABANDONED", {
          operationKey: operation.operationKey,
          attributes: { trigger: "unmount" },
          expectedId: operation.id,
        });
      },
      [],
    );

    return useMemo(
      () => ({ start, annotate, succeed, fail, isActive }),
      [start, annotate, succeed, fail, isActive],
    );
  };
}

export const useOperation = createUseOperation({
  start: startOperation,
  annotate: annotateOperation,
  succeed: succeedOperation,
  fail: failOperation,
  isActive: isOperationActive,
});
