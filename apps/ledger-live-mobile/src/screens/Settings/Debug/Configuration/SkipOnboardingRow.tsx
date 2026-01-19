import React from "react";
import { useDispatch } from "~/context/hooks";
import SettingsRow from "~/components/SettingsRow";
import { completeOnboarding, setHasOrderedNano, setReadOnlyMode } from "~/actions/settings";
import { reboot } from "~/actions/appstate";
import { useAcceptGeneralTerms } from "~/logic/terms";

export default function SkipOnboardingRow() {
  const dispatch = useDispatch();
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
          dispatch(reboot());
        });
      }}
    />
  );
}
