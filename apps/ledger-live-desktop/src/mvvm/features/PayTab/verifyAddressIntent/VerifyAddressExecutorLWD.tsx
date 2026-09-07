import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import { createIntent, type DeviceConnectionParams } from "@features/platform-device-intent";
import type {
  VerifyAddressIntentInput,
  VerifyAddressIntentJobState,
} from "@features/platform-verify-address-intent";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutorLWD,
  type InitializationInput,
} from "LLD/components/DeviceIntentExecutor";
import type { PayVerifyOutcome, PayVerifySelection } from "../hooks/usePayTabVerifyAddress";
import { buildVerifyAddressIntentInput } from "./buildVerifyAddressIntentInput";
import { verifyAddressIntentLWDDefinition } from "./intentLWDDefinition";

const CONNECTION_PARAMS: DeviceConnectionParams = { acceptedDeviceModelIds: [] };

type Props = Readonly<{
  selection: PayVerifySelection;
  /** Called once the executor dialog is actually showing, so the intro can step aside. */
  onReady: () => void;
  /** Called once when the executor leaves, with the outcome that drives navigation. */
  onExit: (outcome: PayVerifyOutcome) => void;
}>;

const noop = () => {};

/** Maps the last observed job state to the outcome a user dismissal should report. */
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
        // Fail closed and restore the request card so the flow never hangs on a broken init.
        if (!cancelled) exit("initFailed");
      });
    return () => {
      cancelled = true;
    };
  }, [mainAccount, account, onReady, exit]);

  const onJobStateChanged = useCallback(
    (jobState: VerifyAddressIntentJobState) => {
      lastJobStateRef.current = jobState;
      // Confirming on the device ends the flow: no extra acknowledgement needed.
      if (jobState.type === "verified") exit("verified");
    },
    [exit],
  );

  const onUserCancel = useCallback(
    () => exit(outcomeFromLastState(lastJobStateRef.current)),
    [exit],
  );

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
