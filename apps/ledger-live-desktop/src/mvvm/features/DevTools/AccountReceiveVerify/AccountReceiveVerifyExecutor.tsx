import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-intent-verify-address";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import { receiveVerifyIntentDefinition } from "./intentDefinition";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const noop = () => {};

function describeJobState(state: VerifyAddressIntentJobState | undefined): string {
  switch (state?.type) {
    case "verified":
      return `verified on device: ${state.address}`;
    case "mismatch":
      return `mismatch: device showed ${state.reportedAddress}`;
    case "cancelled":
      return "cancelled on device";
    case "unsupported":
      return `unsupported: ${state.error.message}`;
    default:
      return "dismissed";
  }
}

type Props = Readonly<{
  options: GetAddressOptions;
  input: VerifyAddressIntentInput;
  onOutcome: (outcome: string) => void;
}>;

/** Opens the app of the request's currency, then runs the verify-address intent through the DIE; the outcome is the last state once the job completes, or the user closes it. */
export function AccountReceiveVerifyExecutor({
  options,
  input,
  onOutcome,
}: Props): React.ReactElement | null {
  const [initInput, setInitInput] = useState<InitializationInput | null>(null);
  const lastJobStateRef = useRef<VerifyAddressIntentJobState | undefined>(undefined);
  const doneRef = useRef(false);

  const finish = useCallback(
    (outcome: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      onOutcome(outcome);
    },
    [onOutcome],
  );

  useEffect(() => {
    let cancelled = false;
    buildDeviceInitializationInput({
      appRequest: { currency: options.currency },
      flow: FlowName.receive,
    })
      .then(next => {
        if (!cancelled) setInitInput(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) finish(`init failed: ${String(error)}`);
      });
    return () => {
      cancelled = true;
    };
  }, [options.currency, finish]);

  // Emissions only update the UI: `cancelled` keeps the job open for its retry.
  const onJobStateChanged = useCallback((jobState: VerifyAddressIntentJobState) => {
    lastJobStateRef.current = jobState;
  }, []);

  const onJobComplete = useCallback(
    () => finish(describeJobState(lastJobStateRef.current)),
    [finish],
  );

  const onUserCancel = useCallback(
    () => finish(describeJobState(lastJobStateRef.current)),
    [finish],
  );

  const intent = useMemo(() => createIntent(receiveVerifyIntentDefinition, input), [input]);

  if (!initInput) return null;

  return (
    <DeviceIntentExecutor<VerifyAddressIntentJobState, VerifyAddressIntentInput, undefined>
      enabled
      sourceFlow="receive"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      onIntentJobStateChanged={onJobStateChanged}
      onIntentJobComplete={onJobComplete}
      onIntentJobError={(error: unknown) => finish(`error: ${String(error)}`)}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
