// @flow
import React from "react";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { addMockAnnouncement } from "./__mocks__/announcements";

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
