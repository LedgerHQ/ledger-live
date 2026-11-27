import React from "react";
import { useIsFocused } from "@react-navigation/native";
import { useFeature } from "@features/platform-feature-flags";
import { useAutoRedirectToPostOnboarding } from "~/hooks/useAutoRedirectToPostOnboarding";
import { MyWalletDeviceList } from "./MyWalletDeviceList";
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
  const isDeviceListEnabled = useFeature("lwmMyWalletDeviceList")?.enabled ?? false;
  return (
    <>
      {isFocused && <PostOnboardingRedirect />}
      {isDeviceListEnabled && <MyWalletDeviceList onAddModeChange={onPairingStateChanged} />}
      {!isDeviceListEnabled && isFocused && (
        <MyWalletDeviceListLegacy onPairingStateChanged={onPairingStateChanged} />
      )}
    </>
  );
}
