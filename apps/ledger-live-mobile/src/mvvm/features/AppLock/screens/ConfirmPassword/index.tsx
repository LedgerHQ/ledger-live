import { ConfirmPasswordView } from "@features/flow-app-lock";
import React from "react";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import useConfirmPasswordScreenViewModel from "./useConfirmPasswordScreenViewModel";

export function ConfirmPasswordScreen(): React.JSX.Element {
  const keyboardInset = useKeyboardInset();
  const viewModel = useConfirmPasswordScreenViewModel();

  return <ConfirmPasswordView {...viewModel} keyboardHeight={keyboardInset} />;
}
