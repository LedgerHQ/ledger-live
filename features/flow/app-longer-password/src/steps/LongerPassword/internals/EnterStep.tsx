import React from "react";
import { SetupPasswordView, useSetupPasswordViewModel } from "@features/flow-app-password-setup";

export function EnterStep({
  onValid,
  keyboardHeight,
  bottomInset,
}: Readonly<{
  onValid: () => void;
  keyboardHeight?: number;
  bottomInset?: number;
}>): React.JSX.Element {
  const viewModel = useSetupPasswordViewModel({ onValid });

  return (
    <SetupPasswordView {...viewModel} keyboardHeight={keyboardHeight} bottomInset={bottomInset} />
  );
}
