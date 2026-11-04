import React from "react";
import { SignatureScreenView } from "./components/SignatureScreenView";
import { useSignatureViewModel } from "./hooks/useSignatureViewModel";

export function SignatureExecutorScreen() {
  const {
    account,
    transaction,
    request,
    deviceInitializationInput,
    signatureIntent,
    intentExtraProps,
    onIntentJobStateChanged,
    onIntentJobError,
    onUserCancel,
  } = useSignatureViewModel();

  if (!account || !transaction || !request || !deviceInitializationInput || !signatureIntent) {
    return null;
  }

  return (
    <SignatureScreenView
      deviceInitializationInput={deviceInitializationInput}
      signatureIntent={signatureIntent}
      intentExtraProps={intentExtraProps}
      onIntentJobStateChanged={onIntentJobStateChanged}
      onIntentJobError={onIntentJobError}
      onUserCancel={onUserCancel}
    />
  );
}
