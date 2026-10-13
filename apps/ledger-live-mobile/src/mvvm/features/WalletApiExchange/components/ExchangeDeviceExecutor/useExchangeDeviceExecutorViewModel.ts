import { useCallback, useMemo } from "react";
import { createIntent, type ExecutorState } from "@features/platform-device-intent";
import { normalizeError } from "@ledgerhq/live-common/exchange/intents/index";
import { ExchangeType } from "@ledgerhq/live-common/wallet-api/Exchange/server";
import type { SourceFlow } from "LLM/components/DeviceIntentExecutor";
import {
  exchangeDeviceSession,
  type ExchangeDeviceSession,
  type ExchangeSession,
  type ExchangeSessionJobPhase,
} from "../../session";
import { useExchangeBroadcast } from "../../hooks/useExchangeBroadcast";
import { completeExchangeIntentPlatformDefinition } from "../../deviceIntents/completeExchangeIntent/intentPlatformDefinition";
import { showExchangeErrorIntentPlatformDefinition } from "../../deviceIntents/showExchangeErrorIntent/intentPlatformDefinition";
import { startExchangeIntentPlatformDefinition } from "../../deviceIntents/startExchangeIntent/intentPlatformDefinition";
import type { ExchangeDeviceIntent, ExchangeIntentDefinitions } from "./types";

const defaultDefinitions: ExchangeIntentDefinitions = {
  start: startExchangeIntentPlatformDefinition,
  complete: completeExchangeIntentPlatformDefinition,
  error: showExchangeErrorIntentPlatformDefinition,
};

type Props = Readonly<{
  session: ExchangeSession;
  store?: ExchangeDeviceSession;
  definitions?: ExchangeIntentDefinitions;
}>;

/**
 * Builds the intent of a phase that runs a job in the executor. The intent reports to the store with
 * the phase it was built for, so a late report from an intent the flow has already left is ignored.
 */
function createPhaseIntent(
  phase: ExchangeSessionJobPhase,
  definitions: ExchangeIntentDefinitions,
  store: ExchangeDeviceSession,
): ExchangeDeviceIntent {
  // The casts below are the only place the three intents are widened to the executor's props.
  switch (phase.step) {
    case "start": {
      const { exchangeParams } = phase.request;
      return createIntent(
        definitions.start,
        {
          exchangeType: ExchangeType[exchangeParams.exchangeType],
          provider: exchangeParams.provider,
          exchange: exchangeParams.exchange,
        },
        { onResult: result => store.recordStartResult(phase, result) },
      ) as unknown as ExchangeDeviceIntent;
    }
    case "confirm": {
      const { exchangeParams } = phase.request;
      return createIntent(
        definitions.complete,
        {
          exchangeType: exchangeParams.exchangeType,
          provider: exchangeParams.provider,
          exchange: exchangeParams.exchange,
          transaction: exchangeParams.transaction,
          binaryPayload: exchangeParams.binaryPayload,
          signature: exchangeParams.signature,
          sponsored: exchangeParams.sponsored,
        },
        { onResult: result => store.recordConfirmResult(phase, result) },
      ) as unknown as ExchangeDeviceIntent;
    }
    case "error":
      return createIntent(definitions.error, phase.details) as unknown as ExchangeDeviceIntent;
  }
}

/** Fund has no flow of its own in the device analytics, so it stays a generic wallet-api flow. */
function getSourceFlow(exchangeType: number): SourceFlow {
  switch (exchangeType) {
    case ExchangeType.SWAP:
      return "swap";
    case ExchangeType.SELL:
      return "buy/sell";
    default:
      return "wallet_api";
  }
}

export function useExchangeDeviceExecutorViewModel({
  session,
  store = exchangeDeviceSession,
  definitions = defaultDefinitions,
}: Props) {
  const { manifest, exchangeType, phase, jobPhase, initializationInput } = session;

  useExchangeBroadcast(phase, store);

  const sourceFlow = getSourceFlow(exchangeType);

  const analyticsProperties = useMemo(
    () => ({ manifestId: manifest.id, manifestName: manifest.name }),
    [manifest.id, manifest.name],
  );

  // One intent per job phase: it stays the same while the session waits between two jobs.
  const intent = useMemo(
    () => createPhaseIntent(jobPhase, definitions, store),
    [jobPhase, definitions, store],
  );

  // The flow only moves on once the job of the phase has completed.
  const onIntentJobComplete = useCallback(() => store.completePhase(phase), [store, phase]);

  // The jobs report their failures as states, so an error here is a bug rather than a device
  // outcome: end the flow instead of showing the executor's retry, which would reuse a spent nonce.
  const onIntentJobError = useCallback(
    (error: unknown) => store.failPhase(phase, normalizeError(error)),
    [store, phase],
  );

  // Tied to this session: a sheet that reports its close after it went away must not end the next.
  const onUserCancel = useCallback(() => store.userClosed(session.id), [store, session.id]);

  const onExecutorStateChanged = useCallback(
    (state: ExecutorState) => {
      if (state.type === "deviceDisconnected") store.deviceDisconnected(session.id);
    },
    [store, session.id],
  );

  return {
    sourceFlow,
    analyticsProperties,
    deviceInitializationInput: initializationInput,
    intent,
    onExecutorStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onUserCancel,
  };
}
