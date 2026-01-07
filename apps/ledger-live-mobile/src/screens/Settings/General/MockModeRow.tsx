import React, { memo, useCallback } from "react";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import SettingsRow from "~/components/SettingsRow";
import Track from "~/analytics/Track";
import { reboot } from "~/actions/appstate";
import { useDispatch } from "~/context/hooks";
import Switch from "~/components/Switch";

function MockModeRow() {
  const dispatch = useDispatch();
  const isMock = getEnv("MOCK");
  const setReadOnlyModeAndReset = useCallback(
    (enabled: boolean) => {
      setEnvUnsafe("MOCK", enabled ? "1" : "");
      dispatch(reboot());
    },
    [dispatch],
  );

  return (
    <SettingsRow
      event="MockModeRow"
      title="Mock mode"
      desc="Toggle Mock mode for testing, relaunch to refresh"
    >
      <Track event={isMock ? "EnableReadOnlyMode" : "DisableReadOnlyMode"} onUpdate />
      <Switch value={!!isMock} onValueChange={setReadOnlyModeAndReset} />
    </SettingsRow>
  );
}

export default memo(MockModeRow);
