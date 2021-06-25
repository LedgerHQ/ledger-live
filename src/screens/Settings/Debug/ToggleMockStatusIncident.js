// @flow
import React from "react";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { useServiceStatus } from "@ledgerhq/live-common/lib/notifications/ServiceStatusProvider";
import { toggleMockIncident } from "./__mocks__/serviceStatus";
import Switch from "../../../components/Switch";
import SettingsRow from "../../../components/SettingsRow";

export default function ToggleMockServiceStatusButton({
  title,
}: {
  title: string,
}) {
  const { updateData, incidents } = useServiceStatus();
  return getEnv("MOCK") ? (
    <SettingsRow title={title} onPress={null}>
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
