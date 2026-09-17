import { SetupPasswordView } from "@features/flow-app-lock";
import React from "react";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import useSetupPasswordScreenViewModel from "./useSetupPasswordScreenViewModel";

export function SetupPasswordScreen(): React.JSX.Element {
  const keyboardInset = useKeyboardInset();
  const viewModel = useSetupPasswordScreenViewModel();

  return <SetupPasswordView {...viewModel} keyboardHeight={keyboardInset} />;
}
