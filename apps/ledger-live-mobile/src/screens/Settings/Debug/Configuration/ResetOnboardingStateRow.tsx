import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsRow from "../../../../components/SettingsRow";
import {
  completeOnboarding,
  setHasOrderedNano,
  setReadOnlyMode,
} from "../../../../actions/settings";
import { RebootContext } from "../../../../context/Reboot";
import { knownDevicesSelector } from "../../../../reducers/ble";
import { removeKnownDevices } from "../../../../actions/ble";

export default function ResetOnboardingStateRow() {
  const dispatch = useDispatch();
  const reboot = useContext(RebootContext);
  const knownDevices = useSelector(knownDevicesSelector);
  return (
    <SettingsRow
      title="Reset onboarding state"
      desc="Sets the app as if the onboarding was never completed"
      onPress={() => {
        dispatch(setReadOnlyMode(true));
        dispatch(setHasOrderedNano(false));
        dispatch(completeOnboarding(false));
        dispatch(removeKnownDevices(knownDevices.map(d => d.id)));
        requestAnimationFrame(() => {
          reboot();
        });
      }}
    />
  );
}
