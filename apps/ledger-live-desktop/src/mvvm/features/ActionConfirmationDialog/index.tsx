import React from "react";
import useActionConfirmationDialogViewModel from "./useActionConfirmationDialogViewModel";
import ActionConfirmationDialogView from "./ActionConfirmationDialogView";

const ActionConfirmationDialog = () => (
  <ActionConfirmationDialogView {...useActionConfirmationDialogViewModel()} />
);

export default ActionConfirmationDialog;
