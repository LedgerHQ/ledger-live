import React from "react";
import { Icons } from "@ledgerhq/native-ui";
import { useServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import Switch from "../../../../components/Switch";
import { toggleMockIncident } from "../__mocks__/serviceStatus";
import SettingsRow from "../../../../components/SettingsRow";

export default function ToggleServiceStatusIncident() {
  const { updateData, incidents } = useServiceStatus();
  return (
    <SettingsRow
      title={"Toggle Service status incident"}
      iconLeft={<Icons.MegaphoneMedium size={24} color="black" />}
    >
      <Switch
        value={incidents.length > 0}
        onValueChange={() => {
          toggleMockIncident();
          updateData();
        }}
      />
    </SettingsRow>
  );
}
