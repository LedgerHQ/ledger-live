import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { toErrorAttributes } from "@shared/observability-operations";
import { useOperation } from "@shared/observability-operations-react";
import { RECEIVE_VERIFY_ADDRESS_OPERATION } from "../logic/receiveOperations";
import {
  toVerifyAddressOperationResult,
  type VerifyAddressStage,
} from "../logic/toVerifyAddressOperationResult";
import type { VerifyAddressDeviceFlowFailure, VerifyAddressOutcome } from "../types";

export type VerifyAddressEndCause = Readonly<{
  error?: unknown;
  failure?: VerifyAddressDeviceFlowFailure | null;
}>;

export type VerifyAddressOperation = Readonly<{
  annotateNetwork: (networkId: string) => void;
  noteAttemptStart: () => void;
  noteJobError: (error: unknown) => void;
  end: (
    outcome: VerifyAddressOutcome,
    stage: VerifyAddressStage,
    cause?: VerifyAddressEndCause,
  ) => void;
}>;

type CaughtError = Readonly<{ error: unknown }>;

export function useVerifyAddressOperation(
  assetId: CryptoOrTokenCurrencyId,
  networkId: string | undefined,
): VerifyAddressOperation {
  const operation = useOperation(RECEIVE_VERIFY_ADDRESS_OPERATION);
  const attemptsRef = useRef(0);
  const lastJobErrorRef = useRef<CaughtError | undefined>(undefined);

  useEffect(() => {
    operation.start({ currency_id: assetId });
  }, [operation, assetId]);

  const annotateNetwork = useCallback(
    (shownNetworkId: string) => {
      operation.annotate({ network_id: shownNetworkId });
    },
    [operation],
  );

  useEffect(() => {
    if (networkId) annotateNetwork(networkId);
  }, [annotateNetwork, networkId]);

  const noteAttemptStart = useCallback(() => {
    attemptsRef.current += 1;
    lastJobErrorRef.current = undefined;
    const retryCount = attemptsRef.current - 1;
    if (retryCount > 0) operation.annotate({ retry_count: retryCount });
  }, [operation]);

  const noteJobError = useCallback((error: unknown) => {
    lastJobErrorRef.current = { error };
  }, []);

  const end = useCallback(
    (
      outcome: VerifyAddressOutcome,
      stage: VerifyAddressStage,
      cause: VerifyAddressEndCause = {},
    ) => {
      const ending = toVerifyAddressOperationResult(outcome, stage);
      if (ending.type === "succeed") {
        operation.succeed(ending.attributes);
        return;
      }
      const lastError =
        cause.error === undefined ? lastJobErrorRef.current : { error: cause.error };
      const caught = outcome === "mismatch" ? undefined : lastError;
      operation.fail(ending.reason, {
        ...(caught && toErrorAttributes(caught.error)),
        failure_type: cause.failure?.failureType,
        ...ending.attributes,
      });
    },
    [operation],
  );

  return useMemo(
    () => ({ annotateNetwork, noteAttemptStart, noteJobError, end }),
    [annotateNetwork, noteAttemptStart, noteJobError, end],
  );
}
