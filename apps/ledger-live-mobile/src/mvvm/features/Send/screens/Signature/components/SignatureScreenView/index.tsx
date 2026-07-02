import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import {
  DeviceIntentExecutorLWM,
  type InitializationInput,
} from "LLM/components/DeviceIntentExecutor";
import type {
  SignTransactionIntent,
  SignTransactionIntentJobState,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useAnalytics } from "~/analytics";
import { getSendFlowTrackingProperties } from "@ledgerhq/ledger-wallet-framework/tracking/send";

const deviceConnectionParams = { acceptedDeviceModelIds: [] };
const noop = () => undefined;

type SignatureScreenViewProps = Readonly<{
  deviceInitializationInput: InitializationInput;
  signatureIntent: SignTransactionIntent;
  onIntentJobStateChanged: (jobState: SignTransactionIntentJobState) => void;
  onIntentJobError: (error: unknown) => void;
  onUserCancel: () => void;
  account?: AccountLike;
  parentAccount?: Account;
}>;

export function SignatureScreenView({
  deviceInitializationInput,
  signatureIntent,
  onIntentJobStateChanged,
  onIntentJobError,
  onUserCancel,
  account,
  parentAccount,
}: SignatureScreenViewProps) {
  const { track } = useAnalytics();
  const trackingProperties = useMemo(() => {
    return getSendFlowTrackingProperties(account ?? null, parentAccount);
  }, [account, parentAccount]);

  useEffect(() => {
    track("send_modal", {
      ...trackingProperties,
      name: "step review device",
      flow: "send",
    });
  }, [track, trackingProperties]);

  return (
    <View style={{ flex: 1 }} testID="send-signature-step">
      <DeviceIntentExecutorLWM
        enabled
        sourceFlow="send"
        deviceConnectionParams={deviceConnectionParams}
        deviceInitializationInput={deviceInitializationInput}
        intent={signatureIntent}
        intentComponentExtraProps={undefined}
        onExecutorStateChanged={noop}
        onIntentJobStateChanged={onIntentJobStateChanged}
        onIntentJobComplete={noop}
        onIntentJobError={onIntentJobError}
        cancelIntentRequestId={undefined}
        onUserCancel={onUserCancel}
      />
    </View>
  );
}
