import React from "react";
import { SignatureScreenView } from "./components/SignatureScreenView";
import { useSignatureViewModel } from "./hooks/useSignatureViewModel";

export function SignatureScreen() {
  const {
    account,
    transaction,
    request,
    deviceInitializationInput,
    signatureIntent,
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
      onIntentJobStateChanged={onIntentJobStateChanged}
      onIntentJobError={onIntentJobError}
      onUserCancel={onUserCancel}
    />
  );
}
