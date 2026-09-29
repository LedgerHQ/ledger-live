import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-verify-address-intent";
import { trackEvent } from "@features/platform-pay-analytics";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutorLWD,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import type { PayVerifyOutcome, PayVerifySelection } from "../hooks/usePayTabVerifyAddress";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWDDefinition } from "./intentLWDDefinition";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

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

const noop = () => {};

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

export function VerifyAddressExecutorLWD({
  selection,
  onReady,
  onExit,
}: Props): React.ReactElement | null {
  const { account, parentAccount } = selection;
  const [initInput, setInitInput] = useState<InitializationInput | null>(null);
  const lastJobStateRef = useRef<VerifyAddressIntentJobState | undefined>(undefined);
  const exitedRef = useRef(false);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

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
        tokenCurrency: account.type === "TokenAccount" ? account.token : undefined,
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
  }, [mainAccount, account, onReady, exit]);

  const onJobStateChanged = useCallback(
    (jobState: VerifyAddressIntentJobState) => {
      if (exitedRef.current) return;
      lastJobStateRef.current = jobState;
      const event = JOB_TRACK_EVENT[jobState.type];
      if (event) {
        trackEvent(event, {
          page: "Request Address Verification",
          flow: "request",
          asset: account.type === "TokenAccount" ? account.token.ticker : account.currency.ticker,
          network: mainAccount.currency.id,
        });
      }
      if (jobState.type === "verified") exit("verified");
    },
    [account, exit, mainAccount.currency.id],
  );

  const onUserCancel = useCallback(() => {
    if (exitedRef.current) return;
    trackEvent("request_verification_dismiss", {
      page: "Request Address Verification",
      flow: "request",
      asset: account.type === "TokenAccount" ? account.token.ticker : account.currency.ticker,
      network: mainAccount.currency.id,
    });
    exit(outcomeFromLastState(lastJobStateRef.current));
  }, [account, exit, mainAccount.currency.id]);

  const intent = useMemo(
    () =>
      createIntent(verifyAddressIntentLWDDefinition, buildVerifyAddressIntentInput(mainAccount)),
    [mainAccount],
  );

  if (!initInput) return null;

  return (
    <DeviceIntentExecutorLWD<VerifyAddressIntentJobState, VerifyAddressIntentInput, undefined>
      enabled
      sourceFlow="receive"
      deviceConnectionParams={CONNECTION_PARAMS}
      deviceInitializationInput={initInput}
      intent={intent}
      intentComponentExtraProps={undefined}
      onExecutorStateChanged={noop}
      onIntentJobStateChanged={onJobStateChanged}
      onIntentJobComplete={noop}
      onIntentJobError={noop}
      cancelIntentRequestId={undefined}
      onUserCancel={onUserCancel}
    />
  );
}
