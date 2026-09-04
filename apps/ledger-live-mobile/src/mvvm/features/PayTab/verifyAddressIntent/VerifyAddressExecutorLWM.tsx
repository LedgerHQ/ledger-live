import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { PayRequestTrackEvent } from "@features/flow-pay-request";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-verify-address-intent";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutorLWM,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import type { PayVerifyOutcome } from "../hooks/usePayTabVerifyAddress";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWMDefinition } from "./intentLWMDefinition";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

const JOB_TRACK_EVENT: Partial<Record<VerifyAddressIntentJobState["type"], string>> = {
  verified: "request_verification_complete",
  cancelled: "request_verification_cancelled",
  mismatch: "request_verification_mismatch",
  unsupported: "request_verification_unsupported",
};

export type VerifyAddressExecutorLWMProps = Readonly<{
  mainAccount: Account;
  tokenCurrency?: TokenCurrency;
  page: string;
  onReady: () => void;
  onExit: (outcome: PayVerifyOutcome) => void;
  onTrackEvent?: PayRequestTrackEvent;
}>;

const noop = () => undefined;

function outcomeFromLastState(state: VerifyAddressIntentJobState | undefined): PayVerifyOutcome {
  switch (state?.type) {
    case "mismatch":
      return "mismatch";
    case "unsupported":
      return "unsupported";
    case "cancelled":
      return "cancelled";
    default:
      return "dismissed";
  }
}

export function VerifyAddressExecutorLWM({
  mainAccount,
  tokenCurrency,
  page,
  onReady,
  onExit,
  onTrackEvent,
}: VerifyAddressExecutorLWMProps): React.ReactElement | null {
  const [initInput, setInitInput] = useState<InitializationInput | null>(null);
  const lastJobStateRef = useRef<VerifyAddressIntentJobState | undefined>(undefined);
  const exitedRef = useRef(false);

  const exit = useCallback(
    (outcome: PayVerifyOutcome) => {
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
        account: mainAccount,
        currency: mainAccount.currency,
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
  }, [mainAccount, tokenCurrency, onReady, exit]);

  const onJobStateChanged = useCallback(
    (jobState: VerifyAddressIntentJobState) => {
      if (exitedRef.current) return;
      lastJobStateRef.current = jobState;
      const event = JOB_TRACK_EVENT[jobState.type];
      if (event) onTrackEvent?.(event, { page });
      if (jobState.type === "verified") exit("verified");
    },
    [exit, onTrackEvent, page],
  );

  const onUserCancel = useCallback(() => {
    if (exitedRef.current) return;
    onTrackEvent?.("request_verification_dismiss", { page });
    exit(outcomeFromLastState(lastJobStateRef.current));
  }, [exit, onTrackEvent, page]);

  const intent = useMemo(
    () =>
      createIntent(verifyAddressIntentLWMDefinition, buildVerifyAddressIntentInput(mainAccount)),
    [mainAccount],
  );

  if (!initInput) return null;

  return (
    <DeviceIntentExecutorLWM<VerifyAddressIntentJobState, VerifyAddressIntentInput, undefined>
      enabled
      sourceFlow="receive"
      deviceConnectionParams={CONNECTION_PARAMS}
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
