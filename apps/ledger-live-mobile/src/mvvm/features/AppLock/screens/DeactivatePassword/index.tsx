import { DeactivatePasswordView } from "@features/flow-app-lock";
import React from "react";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import useDeactivatePasswordScreenViewModel from "./useDeactivatePasswordScreenViewModel";

export function DeactivatePasswordScreen(): React.JSX.Element {
  const keyboardInset = useKeyboardInset();
  const viewModel = useDeactivatePasswordScreenViewModel();

  return <DeactivatePasswordView {...viewModel} keyboardHeight={keyboardInset} />;
}
