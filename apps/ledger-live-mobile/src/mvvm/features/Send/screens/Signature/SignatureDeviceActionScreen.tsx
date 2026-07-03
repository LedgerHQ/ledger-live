import React from "react";
import { SignatureDeviceActionView } from "./components/SignatureDeviceActionView";
import { useSignatureDeviceActionViewModel } from "./hooks/useSignatureDeviceActionViewModel";

export function SignatureDeviceActionScreen() {
  const {
    account,
    parentAccount,
    transaction,
    request,
    action,
    selectedDevice,
    setSelectedDevice,
    onDeviceActionResultCompleted,
    onUserCancel,
  } = useSignatureDeviceActionViewModel();

  if (!account || !transaction || !request) {
    return null;
  }

  return (
    <SignatureDeviceActionView
      account={account}
      parentAccount={parentAccount}
      request={request}
      action={action}
      selectedDevice={selectedDevice}
      setSelectedDevice={setSelectedDevice}
      onDeviceActionResultCompleted={onDeviceActionResultCompleted}
      onUserCancel={onUserCancel}
    />
  );
}
