import React from "react";
import { SignatureScreenView } from "./components/SignatureScreenView";
import { useSignatureViewModel } from "./hooks/useSignatureViewModel";

export function SignatureExecutorScreen() {
  const {
    account,
    parentAccount,
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
      account={account}
      parentAccount={parentAccount ?? undefined}
    />
  );
}
