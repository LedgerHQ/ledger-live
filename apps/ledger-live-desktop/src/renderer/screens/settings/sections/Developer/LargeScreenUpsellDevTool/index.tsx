import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useNavigate } from "react-router";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

const COPY = {
  rowTitle: "Large-screen upsell (QA)",
  rowDesc: "Debug would-show, gates, and frequency for the large-screen upsell.",
  open: "Open",
} as const;

export default function LargeScreenUpsellDevTool() {
  const navigate = useNavigate();

  return (
    <SettingsSectionRow title={COPY.rowTitle} desc={COPY.rowDesc}>
      <Button
        size="sm"
        appearance="accent"
        onClick={() => navigate("/settings/developer/large-screen-upsell-qa")}
      >
        {COPY.open}
      </Button>
    </SettingsSectionRow>
  );
}
