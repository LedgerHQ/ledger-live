import React from "react";
import { useIsFocused } from "@react-navigation/native";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { MyWalletDeviceListLegacy } from "./MyWalletDeviceListLegacy";

type MyLedgerSectionProps = {
  onPairingStateChanged?: (isPairing: boolean) => void;
};

// Mounted only while focused: the Recover upsell state of the hook resets at each focus.
function PostOnboardingRedirect() {
  useAutoRedirectToPostOnboarding();
  return null;
}

export function MyLedgerSection({ onPairingStateChanged }: MyLedgerSectionProps) {
  const isFocused = useIsFocused();
  if (!isFocused) return null;
  return (
    <>
      <PostOnboardingRedirect />
      <MyWalletDeviceListLegacy onPairingStateChanged={onPairingStateChanged} />
    </>
  );
}
