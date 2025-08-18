import React from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import { setReadOnlyMode } from "~/actions/settings";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import { useReboot } from "~/context/Reboot";
import Switch from "~/components/Switch";

const ReadOnlyModeRow = () => {
  const reboot = useReboot();
  const dispatch = useDispatch();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const setReadOnlyModeAndReset = (enabled: boolean) => {
    dispatch(setReadOnlyMode(enabled));
    reboot();
  };

  return (
    <SettingsRow
      event="ReadOnlyModeRow"
      title="ReadOnly mode"
      desc="Readonly mode for testing, relaunch to refresh topbar"
    >
      <Track event={readOnlyModeEnabled ? "EnableReadOnlyMode" : "DisableReadOnlyMode"} onUpdate />
      <Switch value={readOnlyModeEnabled} onValueChange={setReadOnlyModeAndReset} />
    </SettingsRow>
  );
};

export default ReadOnlyModeRow;
