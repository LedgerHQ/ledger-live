import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  PredictionsSigningIntentInput,
  PredictionsSigningJobState,
  PredictionsSigningPrompt,
  PredictionsSigningResult,
} from "@features/platform-predictions";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import type { PredictionsSigningRequest } from "./signingRequests";
import { signPredictionsTypedData } from "./signingSigner";
import { predictionsSigningIntentLWDDefinition } from "./intentLWDDefinition";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => undefined;

type Props = PredictionsSigningRequest & Readonly<{ onDone: () => void }>;

/** Once signed, it answers and closes: the sheet the live app reports to takes over. */
export function PredictionsSigningExecutorLWD({
  account,
  purpose,
  typedData,
  onSuccess,
  onError,
  onCancel,
  onDone,
}: Props): React.ReactElement | null {
  const [initInput, setInitInput] = useState<InitializationInput | null>(null);
  const isFinishedRef = useRef(false);

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
    (result: PredictionsSigningResult) => {
      switch (result.type) {
        case "mismatch":
          // The live app raises its alert right away; the executor keeps showing the mismatch.
          onError(result.error);
          return;
        case "expired":
          isFinishedRef.current = true;
          onError(result.error);
          return;
        case "signed":
          isFinishedRef.current = true;
          onSuccess(result.signature);
      }
    },
    [onError, onSuccess],
  );

  const intent = useMemo(
    () =>
      createIntent(
        predictionsSigningIntentLWDDefinition,
        {
          purpose,
          address: account.freshAddress,
          typedData,
          signTypedData: (connection, typedDataToSign) =>
            signPredictionsTypedData(connection, account, typedDataToSign, purpose),
        },
        { onResult },
      ),
    [account, purpose, typedData, onResult],
  );

  const prompt = useMemo<PredictionsSigningPrompt>(() => ({ purpose }), [purpose]);

  const onIntentJobComplete = useCallback(() => {
    if (isFinishedRef.current) onDone();
  }, [onDone]);

  const onUserCancel = useCallback(() => {
    onCancel();
    onDone();
  }, [onCancel, onDone]);

  if (!initInput) return null;

  return (
    <DeviceIntentExecutor<
      PredictionsSigningJobState,
      PredictionsSigningIntentInput,
      PredictionsSigningPrompt,
      PredictionsSigningResult
    >
      enabled
      sourceFlow="wallet_api"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initInput}
      intent={intent}
      intentComponentExtraProps={prompt}
      onExecutorStateChanged={noop}
      onIntentJobComplete={onIntentJobComplete}
      onIntentJobError={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
