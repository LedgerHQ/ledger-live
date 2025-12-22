import React from "react";
import { useSelector, useDispatch } from "~/context/store";
import SettingsRow from "~/components/SettingsRow";
import { setReadOnlyMode } from "~/actions/settings";
import { reboot } from "~/actions/appstate";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import Track from "~/analytics/Track";
import Switch from "~/components/Switch";

const ReadOnlyModeRow = () => {
  const dispatch = useDispatch();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);

  const setReadOnlyModeAndReset = (enabled: boolean) => {
    dispatch(setReadOnlyMode(enabled));
    dispatch(reboot());
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
