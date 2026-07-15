import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

const COPY = {
  rowTitle: "Device Intent Executor playground",
  rowDesc:
    "Open a screen to test the desktop Device Intent Executor dialog orchestration and initialization scenarios.",
  open: "Open",
} as const;

export default function DeviceIntentExecutorDevTool() {
  const navigate = useNavigate();
  const onOpen = useCallback(() => {
    navigate("/settings/developer/device-intent-executor-qa");
  }, [navigate]);

  return (
    <SettingsSectionRow title={COPY.rowTitle} desc={COPY.rowDesc}>
      <Button size="sm" appearance="accent" onClick={onOpen}>
        {COPY.open}
      </Button>
    </SettingsSectionRow>
  );
}
