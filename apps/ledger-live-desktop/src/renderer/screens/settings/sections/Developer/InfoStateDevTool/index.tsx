import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

const COPY = {
  rowTitle: "InfoState playground",
  rowDesc: "Open a screen to test the shared desktop InfoState component.",
  open: "Open",
} as const;

export default function InfoStateDevTool() {
  const navigate = useNavigate();
  const onOpen = useCallback(() => {
    navigate("/settings/developer/info-state-qa");
  }, [navigate]);

  return (
    <SettingsSectionRow title={COPY.rowTitle} desc={COPY.rowDesc}>
      <Button size="sm" appearance="accent" onClick={onOpen}>
        {COPY.open}
      </Button>
    </SettingsSectionRow>
  );
}
