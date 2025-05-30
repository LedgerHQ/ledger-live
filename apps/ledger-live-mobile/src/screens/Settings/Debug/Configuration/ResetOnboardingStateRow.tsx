import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { RebootContext } from "~/context/Reboot";
import { bleDevicesSelector } from "~/reducers/ble";
import { removeKnownDevices } from "~/actions/ble";
import { useUnacceptGeneralTerms } from "~/logic/terms";

export default function ResetOnboardingStateRow() {
  const dispatch = useDispatch();
  const reboot = useContext(RebootContext);
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
          reboot();
        });
      }}
    />
  );
}
