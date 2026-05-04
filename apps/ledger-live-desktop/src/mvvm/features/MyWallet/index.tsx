import React from "react";
import { ContextMenu } from "./components/ContextMenu";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";

export function MyWallet() {
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("desktop");
  if (!shouldDisplayMyWallet) return null;
  return <ContextMenu />;
}
