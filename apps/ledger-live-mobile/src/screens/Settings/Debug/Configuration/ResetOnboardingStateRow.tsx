import React from "react";
import { useSelector, useDispatch } from "~/context/store";
import SettingsRow from "~/components/SettingsRow";
import {
  completeOnboarding,
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setHasOrderedNano,
  setIsReborn,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { reboot } from "~/actions/appstate";
import { bleDevicesSelector } from "~/reducers/ble";
import { removeKnownDevices } from "~/actions/ble";
import { useUnacceptGeneralTerms } from "~/logic/terms";

export default function ResetOnboardingStateRow() {
  const dispatch = useDispatch();
  const knownDevices = useSelector(bleDevicesSelector);
  const unacceptGeneralTerms = useUnacceptGeneralTerms();
  return (
    <SettingsRow
      hasBorderTop
      title="Reset onboarding state"
      desc="Sets the app as if the onboarding was never completed"
      onPress={() => {
        dispatch(setReadOnlyMode(true));
        dispatch(setHasOrderedNano(false));
        dispatch(completeOnboarding(false));
        dispatch(removeKnownDevices(knownDevices.map(d => d.id)));
        dispatch(setHasBeenUpsoldProtect(false));
        dispatch(setHasBeenRedirectedToPostOnboarding(false));
        dispatch(setIsReborn(null));
        dispatch(setOnboardingHasDevice(null));
        unacceptGeneralTerms();
        requestAnimationFrame(() => {
          dispatch(reboot());
        });
      }}
    />
  );
}
