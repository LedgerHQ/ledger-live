import { EnableProtectionSheet, ProtectionEnabledSheet } from "@features/flow-app-lock";
import React from "react";
import { useAppProtectionPromptViewModel } from "./useAppProtectionPromptViewModel";

export { AppProtectionPromptProvider, useAppProtectionPrompt } from "./AppProtectionPromptProvider";
export type { AppProtectionRequest } from "./types";

export function AppProtectionPromptWrapper(): React.JSX.Element {
  const { enableProtection, protectionEnabled } = useAppProtectionPromptViewModel();

  return (
    <>
      <EnableProtectionSheet {...enableProtection} />
      <ProtectionEnabledSheet {...protectionEnabled} />
    </>
  );
}
