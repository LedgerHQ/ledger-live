import React, { memo, useCallback } from "react";
import { getEnv, setEnvUnsafe } from "@ledgerhq/live-env";
import SettingsRow from "~/components/SettingsRow";
import Track from "~/analytics/Track";
import { withReboot } from "~/context/Reboot";
import Switch from "~/components/Switch";

type Props = {
  reboot: () => void;
};

function MockModeRow({ reboot }: Props) {
  const isMock = getEnv("MOCK");
  const setReadOnlyModeAndReset = useCallback(
    (enabled: boolean) => {
      setEnvUnsafe("MOCK", enabled ? "1" : "");
      reboot();
    },
    [reboot],
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

const m = withReboot(MockModeRow);

export default memo(m);
