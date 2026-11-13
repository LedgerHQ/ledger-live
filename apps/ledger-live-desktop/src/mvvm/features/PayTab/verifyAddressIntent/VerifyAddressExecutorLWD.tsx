import React, { useCallback, useMemo } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { payVerifyAddressOutcomes } from "@features/flow-pay-request";
import { createIntent } from "@features/platform-device-intent";
import {
  useDeviceIntentSession,
  type DeviceIntentSessionEvent,
} from "@features/platform-device-intent-session";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-intent-verify-address";
import { trackEvent } from "@features/platform-pay-analytics";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import type { PayVerifyOutcome, PayVerifySelection } from "../hooks/usePayTabVerifyAddress";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWDDefinition } from "./intentLWDDefinition";

const JOB_TRACK_EVENT: Partial<Record<VerifyAddressIntentJobState["type"], string>> = {
  verified: "request_verification_complete",
  cancelled: "request_verification_cancelled",
  mismatch: "request_verification_mismatch",
  unsupported: "request_verification_unsupported",
};

type Props = Readonly<{
  selection: PayVerifySelection;
  onReady: () => void;
  onExit: (outcome: PayVerifyOutcome) => void;
}>;

export function VerifyAddressExecutorLWD({
  selection,
  onReady,
  onExit,
}: Props): React.ReactElement | null {
  const { account, parentAccount } = selection;

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const buildSetupInput = useCallback(
    () =>
      buildDeviceInitializationInput({
        appRequest: {
          account: mainAccount,
          currency: mainAccount.currency,
          tokenCurrency: account.type === "TokenAccount" ? account.token : undefined,
        },
        flow: FlowName.receive,
      }),
    [mainAccount, account],
  );

  const intent = useMemo(
    () =>
      createIntent(verifyAddressIntentLWDDefinition, buildVerifyAddressIntentInput(mainAccount)),
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
        page: "Request Address Verification",
        flow: "request",
        asset: account.type === "TokenAccount" ? account.token.ticker : account.currency.ticker,
        network: mainAccount.currency.id,
      });
    },
    [account, mainAccount.currency.id],
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
