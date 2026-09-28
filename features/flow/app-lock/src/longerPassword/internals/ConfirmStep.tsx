import React from "react";
import { ConfirmPasswordView, useConfirmPasswordViewModel } from "../../screens/ConfirmPassword";

export function ConfirmStep({
  onConfirmed,
  hasSaveFailed,
  keyboardHeight,
  bottomInset,
}: Readonly<{
  onConfirmed: (password: string) => Promise<void>;
  hasSaveFailed: boolean;
  keyboardHeight?: number;
  bottomInset?: number;
}>): React.JSX.Element {
  const viewModel = useConfirmPasswordViewModel({ onConfirmed });

  return (
    <ConfirmPasswordView
      {...viewModel}
      hasSaveFailed={hasSaveFailed}
      keyboardHeight={keyboardHeight}
      bottomInset={bottomInset}
    />
  );
}
