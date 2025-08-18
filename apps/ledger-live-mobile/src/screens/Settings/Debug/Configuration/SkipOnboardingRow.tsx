import React from "react";
import { useDispatch } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "~/actions/settings";
import { useReboot } from "~/context/Reboot";
import { useAcceptGeneralTerms } from "~/logic/terms";

export default function SkipOnboardingRow() {
  const dispatch = useDispatch();
  const reboot = useReboot();
  const acceptGeneralTerms = useAcceptGeneralTerms();
  return (
    <SettingsRow
      title="Skip onboarding"
      desc="Sets the app as if the onboarding has been completed"
      onPress={() => {
        dispatch(setReadOnlyMode(false));
        dispatch(setHasOrderedNano(false));
        dispatch(completeOnboarding(true));
        acceptGeneralTerms();
        requestAnimationFrame(() => {
          reboot();
        });
      }}
    />
  );
}
