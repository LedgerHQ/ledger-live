import React from "react";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { SettingsRow } from "@features/flow-settings";
import { TrackScreen } from "@shared/analytics-react";
import { NotificationRowIcon } from "./components/NotificationRowIcon/NotificationRowIcon";
import type { NotificationsSettingsViewProps } from "./NotificationsSettings.types";

export function NotificationsSettingsView({
  rows,
  osPermissionBanner,
  testID,
}: NotificationsSettingsViewProps) {
  return (
    <Box lx={{ gap: "s8", paddingTop: "s16" }} testID={testID}>
      <TrackScreen category="Settings" name="Notifications" />
      {osPermissionBanner ? (
        <Box lx={{ paddingHorizontal: "s16" }}>
          <Banner
            appearance="warning"
            title={osPermissionBanner.title}
            description={osPermissionBanner.description}
            primaryAction={
              <Button appearance="gray" size="sm" onPress={osPermissionBanner.onPressAction}>
                {osPermissionBanner.action}
              </Button>
            }
            testID="settings-notifications-os-permission-banner"
          />
        </Box>
      ) : null}
      <Box lx={{ paddingHorizontal: "s8", gap: "s20" }}>
        {rows.map(({ id, ...row }) => (
          <SettingsRow
            key={id}
            {...row}
            icon={<NotificationRowIcon id={id} disabled={row.disabled} />}
          />
        ))}
      </Box>
    </Box>
  );
}
