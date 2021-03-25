// @flow
import React from "react";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { addMockAnnouncement } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider/api/api.mock";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";

import SettingsRow from "../../../components/SettingsRow";

export default function AddMockAnnouncementButton({
  title,
}: {
  title: string,
}) {
  const { updateCache } = useAnnouncements();
  return getEnv("MOCK") ? (
    <SettingsRow
      title={title}
      onPress={() => {
        addMockAnnouncement();
        updateCache();
      }}
    />
  ) : null;
}
