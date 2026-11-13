import React, { useCallback, useMemo } from "react";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import type { Account } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { payVerifyAddressOutcomes } from "@features/flow-pay-request";
import { trackEvent } from "@features/platform-pay-analytics";
import { createIntent } from "@features/platform-device-intent";
import {
  useDeviceIntentSession,
  type DeviceIntentSessionEvent,
} from "@features/platform-device-intent-session";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-intent-verify-address";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLM/components/DeviceIntentExecutor";
import type { PayVerifyOutcome } from "../hooks/usePayTabVerifyAddress";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWMDefinition } from "./intentLWMDefinition";

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
}>;

export function VerifyAddressExecutorLWM({
  mainAccount,
  tokenCurrency,
  page,
  onReady,
  onExit,
}: VerifyAddressExecutorLWMProps): React.ReactElement | null {
  const buildSetupInput = useCallback(
    () =>
      buildDeviceInitializationInput({
        appRequest: {
          account: mainAccount,
          currency: mainAccount.currency,
          tokenCurrency,
        },
        flow: FlowName.receive,
      }),
    [mainAccount, tokenCurrency],
  );

  const intent = useMemo(
    () =>
      createIntent(verifyAddressIntentLWMDefinition, buildVerifyAddressIntentInput(mainAccount)),
    [mainAccount],
  );

  const onTrack = useCallback(
    (event: DeviceIntentSessionEvent<VerifyAddressIntentJobState>) => {
      const trackedEvent =
        event.type === "userCancelled"
          ? "request_verification_dismiss"
          : JOB_TRACK_EVENT[event.jobState.type];
      if (!trackedEvent) return;
      trackEvent(trackedEvent, {
        page,
        flow: "request",
        asset: tokenCurrency?.ticker ?? mainAccount.currency.ticker,
        network: mainAccount.currency.id,
      });
    },
    [mainAccount.currency.id, mainAccount.currency.ticker, page, tokenCurrency],
  );

  const session = useDeviceIntentSession({
    buildSetupInput,
    intent,
    intentComponentExtraProps: undefined,
    outcomes: payVerifyAddressOutcomes,
    onTrack,
    onReady,
    onExit,
  });

  if (!session) return null;

  return (
    <DeviceIntentExecutor<VerifyAddressIntentJobState, VerifyAddressIntentInput, undefined>
      sourceFlow="receive"
      {...session}
    />
  );
}
