import React from "react";
import useAccountPublicKeyUnavailableDialogViewModel from "./useAccountPublicKeyUnavailableDialogViewModel";
import AccountPublicKeyUnavailableDialogView from "./AccountPublicKeyUnavailableDialogView";

const AccountPublicKeyUnavailableDialog = () => (
  <AccountPublicKeyUnavailableDialogView {...useAccountPublicKeyUnavailableDialogViewModel()} />
);

export default AccountPublicKeyUnavailableDialog;
