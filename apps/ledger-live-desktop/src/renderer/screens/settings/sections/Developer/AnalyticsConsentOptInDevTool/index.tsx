import React from "react";
import { Link } from "react-router";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

export default function AnalyticsConsentOptInDevTool() {
  return (
    <SettingsSectionRow
      title="Analytics consent QA"
      desc="Policy bumps, consent state, drawer preview"
    >
      <Button asChild size="sm" appearance="accent">
        <Link to="/settings/developer/analytics-consent-opt-in-qa">Open</Link>
      </Button>
    </SettingsSectionRow>
  );
}
