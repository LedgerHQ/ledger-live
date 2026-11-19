import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  failRumOperation,
  isRumOperationActive,
  startRumOperation,
  succeedRumOperation,
  type RumOperationAttributes,
  type RumOperationFailureReason,
  type RumOperationName,
} from "LLM/utils/rumOperation";

type UseRumOperationOptions = {
  operationKey?: string;
  /** Fails the operation as `ABANDONED` on unmount when this component started it. */
  abandonOnUnmount?: boolean;
};

export type RumOperationHandle = {
  start: (attributes?: RumOperationAttributes) => boolean;
  succeed: (attributes?: RumOperationAttributes) => boolean;
  fail: (reason: RumOperationFailureReason, attributes?: RumOperationAttributes) => boolean;
  isActive: () => boolean;
};

/**
 * Drives one RUM feature operation from a component. The handlers keep their identity across
 * renders, so they can go in dependency lists.
 */
export function useRumOperation(
  name: RumOperationName,
  { operationKey, abandonOnUnmount = true }: UseRumOperationOptions = {},
): RumOperationHandle {
  const options = useRef({ name, operationKey, abandonOnUnmount });
  /** Whether this component started the operation it may abandon on unmount. */
  const owned = useRef(false);

  useEffect(() => {
    options.current = { name, operationKey, abandonOnUnmount };
  }, [name, operationKey, abandonOnUnmount]);

  const start = useCallback((attributes?: RumOperationAttributes) => {
    const { name, operationKey } = options.current;
    const started = startRumOperation(name, { operationKey, attributes });
    if (started) owned.current = true;
    return started;
  }, []);

  const succeed = useCallback((attributes?: RumOperationAttributes) => {
    const { name, operationKey } = options.current;
    owned.current = false;
    return succeedRumOperation(name, { operationKey, attributes });
  }, []);

  const fail = useCallback(
    (reason: RumOperationFailureReason, attributes?: RumOperationAttributes) => {
      const { name, operationKey } = options.current;
      owned.current = false;
      return failRumOperation(name, reason, { operationKey, attributes });
    },
    [],
  );

  const isActive = useCallback(() => {
    const { name, operationKey } = options.current;
    return isRumOperationActive(name, operationKey);
  }, []);

  useEffect(
    () => () => {
      const { name, operationKey, abandonOnUnmount } = options.current;
      if (!abandonOnUnmount || !owned.current || !isRumOperationActive(name, operationKey)) return;
      failRumOperation(name, "ABANDONED", { operationKey, attributes: { trigger: "unmount" } });
    },
    [],
  );

  return useMemo(() => ({ start, succeed, fail, isActive }), [start, succeed, fail, isActive]);
}
