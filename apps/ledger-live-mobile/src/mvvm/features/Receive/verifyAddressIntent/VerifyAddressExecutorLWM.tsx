import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { track } from "@shared/analytics";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-intent-verify-address";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import type { VerifyAddressOutcome, VerifyAddressSelection } from "./useVerifyAddressFlow";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWMDefinition } from "./intentLWMDefinition";

const ALL_DEVICE_MODELS: DeviceConnectionParams["acceptedDeviceModelIds"] = [];

const TRACKING = { flow: "receive", page: "Receive Address Verification" } as const;

/** Suffix of the `receive_verification_<suffix>` event sent for each job state. */
const JOB_TRACK_EVENT: Partial<Record<VerifyAddressIntentJobState["type"], string>> = {
  verified: "complete",
  cancelled: "cancelled",
  mismatch: "mismatch",
  unsupported: "unsupported",
};

export type VerifyAddressExecutorLWMProps = VerifyAddressSelection &
  Readonly<{
    onReady: () => void;
    onExit: (outcome: VerifyAddressOutcome) => void;
    /** Restricts the device models the verification accepts; empty or omitted means all. */
    acceptedDeviceModelIds?: DeviceConnectionParams["acceptedDeviceModelIds"];
  }>;

const noop = () => undefined;

function outcomeFromLastState(
  state: VerifyAddressIntentJobState | undefined,
): VerifyAddressOutcome {
  switch (state?.type) {
    case "mismatch":
      return "mismatch";
    case "unsupported":
      return "unsupported";
    case "cancelled":
      return "cancelled";
    case "verified":
      return "verified";
    default:
      return "dismissed";
  }
}

export function VerifyAddressExecutorLWM({
  account,
  verification,
  network,
  tokenCurrency,
  onReady,
  onExit,
  acceptedDeviceModelIds = ALL_DEVICE_MODELS,
}: VerifyAddressExecutorLWMProps): React.ReactElement | null {
  const connectionParams = useMemo<DeviceConnectionParams>(
    () => ({ acceptedDeviceModelIds }),
    [acceptedDeviceModelIds],
  );
  const [initInput, setInitInput] = useState<InitializationInput | null>(null);
  const lastJobStateRef = useRef<VerifyAddressIntentJobState | undefined>(undefined);
  const exitedRef = useRef(false);

  const exit = useCallback(
    (outcome: VerifyAddressOutcome) => {
      if (exitedRef.current) return;
      exitedRef.current = true;
      onExit(outcome);
    },
    [onExit],
  );

  useEffect(() => {
    let cancelled = false;
    buildDeviceInitializationInput({
      appRequest: {
        currency: network,
        tokenCurrency,
      },
      flow: FlowName.receive,
    })
      .then(input => {
        if (cancelled) return;
        setInitInput(input);
        onReady();
      })
      .catch(() => {
        if (!cancelled) exit("initFailed");
      });
    return () => {
      cancelled = true;
    };
  }, [network, tokenCurrency, onReady, exit]);

  const onJobStateChanged = useCallback(
    (jobState: VerifyAddressIntentJobState) => {
      if (exitedRef.current) return;
      lastJobStateRef.current = jobState;
      const event = JOB_TRACK_EVENT[jobState.type];
      if (event) {
        void track(`receive_verification_${event}`, {
          ...TRACKING,
          asset: tokenCurrency?.ticker ?? network.ticker,
          network: network.id,
        });
      }
    },
    [network.id, network.ticker, tokenCurrency],
  );

  // Leaving after the device confirmation ends a verified flow; any earlier close is a dismissal.
  const onUserCancel = useCallback(() => {
    if (exitedRef.current) return;
    const outcome = outcomeFromLastState(lastJobStateRef.current);
    if (outcome === "verified") {
      exit(outcome);
      return;
    }
    void track("receive_verification_dismiss", {
      ...TRACKING,
      asset: tokenCurrency?.ticker ?? network.ticker,
      network: network.id,
    });
    exit(outcome);
  }, [exit, network.id, network.ticker, tokenCurrency]);

  const intent = useMemo(
    () =>
      createIntent(
        verifyAddressIntentLWMDefinition,
        buildVerifyAddressIntentInput({ account, verification }),
      ),
    [account, verification],
  );

  if (!initInput) return null;

  return (
    <DeviceIntentExecutor<VerifyAddressIntentJobState, VerifyAddressIntentInput, undefined>
      enabled
      sourceFlow="receive"
      deviceConnectionParams={connectionParams}
      deviceInitializationInput={initInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      onIntentJobStateChanged={onJobStateChanged}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
