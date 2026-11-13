import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-rnative";
import { DeviceListItemStatuses, type DeviceListItem } from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";

type TagAppearance = NonNullable<React.ComponentProps<typeof Tag>["appearance"]>;

const tags: Record<DeviceListItem["status"], { appearance: TagAppearance; labelKey: string }> = {
  [DeviceListItemStatuses.Unavailable]: {
    appearance: "gray",
    labelKey: "connectKnownOrNewDevice.status.unavailable",
  },
  [DeviceListItemStatuses.Available]: {
    appearance: "accent-subtle",
    labelKey: "connectKnownOrNewDevice.status.available",
  },
  [DeviceListItemStatuses.Connected]: {
    appearance: "success",
    labelKey: "connectKnownOrNewDevice.status.connected",
  },
};

export function DeviceStatusTag({
  status,
}: Readonly<{ status: DeviceListItem["status"] }>): React.JSX.Element {
  const { t } = useTranslation();
  const { appearance, labelKey } = tags[status];

  return <Tag size="sm" appearance={appearance} label={t(labelKey)} />;
}
