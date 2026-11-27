import React from "react";
import { HelpPage } from "@features/flow-settings-help";
import { useMobileHelpPort } from "./useMobileHelpPort";

export function MyWalletHelpScreen() {
  return <HelpPage port={useMobileHelpPort()} testID="my-wallet-help-screen" />;
}
