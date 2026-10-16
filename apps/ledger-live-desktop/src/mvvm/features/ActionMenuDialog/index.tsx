import React from "react";
import useActionMenuDialogViewModel from "./useActionMenuDialogViewModel";
import ActionMenuDialogView from "./ActionMenuDialogView";

const ActionMenuDialog = () => <ActionMenuDialogView {...useActionMenuDialogViewModel()} />;

export default ActionMenuDialog;
