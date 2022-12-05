import React from "react";
import { getEnv } from "@ledgerhq/live-common/env";
import { useServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import Switch from "../../../components/Switch";
import SettingsRow from "../../../components/SettingsRow";
import { toggleMockIncident } from "./__mocks__/serviceStatus";

export default function ToggleMockServiceStatusButton({
  title,
}: {
  title: string;
}) {
  const { updateData, incidents } = useServiceStatus();
  return getEnv("MOCK") ? (
    <SettingsRow title={title}>
      <Switch
        value={incidents.length > 0}
        onValueChange={() => {
          toggleMockIncident();
          updateData();
        }}
      />
    </SettingsRow>
  ) : null;
}
