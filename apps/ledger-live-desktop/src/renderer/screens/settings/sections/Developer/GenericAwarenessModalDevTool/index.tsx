import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { COPY } from "./utils/copy";
import { useGenericAwarenessModalDevToolRowViewModel } from "./hooks/useGenericAwarenessModalDevToolRowViewModel";

export default function GenericAwarenessModalDevTool() {
  const { onOpen } = useGenericAwarenessModalDevToolRowViewModel();

  return (
    <SettingsSectionRow title={COPY.rowTitle} desc={COPY.rowDesc}>
      <Button size="sm" appearance="accent" onClick={onOpen}>
        {COPY.open}
      </Button>
    </SettingsSectionRow>
  );
}
