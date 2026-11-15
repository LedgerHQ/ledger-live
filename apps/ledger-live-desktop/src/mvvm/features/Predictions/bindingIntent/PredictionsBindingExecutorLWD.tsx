import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  PredictionsBindingIntentInput,
  PredictionsBindingJobState,
  PredictionsBindingResult,
} from "@features/platform-predictions";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import type { PredictionsBindingRequest } from "./bindingRequests";
import { signBindingTypedData } from "./bindingSigner";
import { predictionsBindingIntentLWDDefinition } from "./intentLWDDefinition";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type Props = PredictionsBindingRequest & Readonly<{ onDone: () => void }>;

/** Once signed, it answers and closes: the trading wallet setup dialog takes over. */
export function PredictionsBindingExecutorLWD({
  account,
  onSuccess,
  onError,
  onCancel,
  onDone,
}: Props): React.ReactElement | null {
  const [initInput, setInitInput] = useState<InitializationInput | null>(null);
  const isBoundRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;
    buildDeviceInitializationInput({
      appRequest: { account, currency: account.currency },
      flow: FlowName.unknown,
    }).then(
      input => {
        if (!isCancelled) setInitInput(input);
      },
      (error: unknown) => {
        if (isCancelled) return;
        onError(error instanceof Error ? error : new Error(String(error)));
        onDone();
      },
    );
    return () => {
      isCancelled = true;
    };
  }, [account, onError, onDone]);

  const onResult = useCallback(
    (result: PredictionsBindingResult) => {
      if (result.type === "mismatch") {
        // The live app raises its alert right away; the executor keeps showing the mismatch.
        onError(result.error);
        return;
      }
      isBoundRef.current = true;
      onSuccess(result.answer);
    },
    [onError, onSuccess],
  );

  const intent = useMemo(
    () =>
      createIntent(
        predictionsBindingIntentLWDDefinition,
        {
          address: account.freshAddress,
          signTypedData: (connection, typedData) =>
            signBindingTypedData(connection, account, typedData),
        },
        { onResult },
      ),
    [account, onResult],
  );

  const onIntentJobComplete = useCallback(() => {
    if (isBoundRef.current) onDone();
  }, [onDone]);

  const onUserCancel = useCallback(() => {
    onCancel();
    onDone();
  }, [onCancel, onDone]);

  if (!initInput) return null;

  return (
    <DeviceIntentExecutor<
      PredictionsBindingJobState,
      PredictionsBindingIntentInput,
      undefined,
      PredictionsBindingResult
    >
      enabled
      sourceFlow="wallet_api"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      onIntentJobComplete={onIntentJobComplete}
      onIntentJobError={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
