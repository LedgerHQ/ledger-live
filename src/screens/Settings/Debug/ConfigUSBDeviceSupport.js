/* @flow */
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import Switch from "../../../components/Switch";
import SettingsRow from "../../../components/SettingsRow";
import { setExperimentalUSBSupport } from "../../../actions/settings";
import { experimentalUSBEnabledSelector } from "../../../reducers/settings";

export default function ConfigUSBDeviceSupport() {
  const dispatch = useDispatch();
  const experimentalUSBEnabled = useSelector(experimentalUSBEnabledSelector);

  return (
    <>
      <SettingsRow
        title="Enable Experimental USB Support"
        onPress={null}
        alignedTop
      >
        <Switch
          value={experimentalUSBEnabled}
          onValueChange={(...args) =>
            dispatch(setExperimentalUSBSupport(...args))
          }
        />
      </SettingsRow>
    </>
  );
}
