import React from "react";
import { ContextMenu } from "./components/ContextMenu";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

export function MyWallet() {
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("desktop");
  if (!shouldDisplayMyWallet) return null;
  return <ContextMenu />;
}
