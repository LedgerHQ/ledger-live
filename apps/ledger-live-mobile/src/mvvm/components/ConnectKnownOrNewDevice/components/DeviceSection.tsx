import React, { useState } from "react";
import {
  Box,
  Button,
  Link,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus, PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { DeviceMenuSheet } from "./DeviceMenuSheet";
import { DeviceRow, hasMenuActions, type DeviceRowItem } from "./DeviceRow";

const COLLAPSED_DEVICE_COUNT = 3;

type DeviceSectionProps = {
  /** Only the rows of `Discovering` have actions. */
  devices: Array<DeviceRowItem>;
  /** Only set in `Discovering`. */
  onAddNewDevice?: () => void;
  /** Set while discovery is paused: the rows and the Add button show greyed out. */
  disabled?: boolean;
  children?: React.ReactNode;
};

function AddDeviceRow({
  onAddNewDevice,
  disabled,
}: Readonly<{ onAddNewDevice?: () => void; disabled?: boolean }>) {
  const { t } = useTranslation();

  return (
    <ListItem
      density="expanded"
      disabled={disabled}
      onPress={onAddNewDevice}
      testID="connect-known-or-new-device-add-device"
    >
      <ListItemLeading>
        <Spot size={48} icon={Plus} disabled={disabled} />
        <ListItemContent>
          <ListItemTitle>{t("connectKnownOrNewDevice.addDevice")}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function DeviceSection({
  devices,
  onAddNewDevice,
  disabled,
  children,
}: Readonly<DeviceSectionProps>): React.JSX.Element {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuDeviceKey, setMenuDeviceKey] = useState<string | null>(null);

  const isEmpty = devices.length === 0;
  const isCollapsible = devices.length > COLLAPSED_DEVICE_COUNT;
  const shownDevices =
    isCollapsible && !isExpanded ? devices.slice(0, COLLAPSED_DEVICE_COUNT) : devices;
  const menuDevice =
    devices.filter(hasMenuActions).find(item => item.key === menuDeviceKey) ?? null;

  return (
    <Box lx={{ gap: "s12" }}>
      <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text typography="heading5SemiBold" lx={{ color: "base" }}>
          {t("connectKnownOrNewDevice.title")}
        </Text>
        {!isEmpty && (onAddNewDevice || disabled) && (
          <Link
            appearance={disabled ? "gray" : "accent"}
            size="md"
            icon={PlusCircleFill}
            onPress={onAddNewDevice}
          >
            {t("connectKnownOrNewDevice.add")}
          </Link>
        )}
      </Box>
      <Box lx={{ backgroundColor: "surface", borderRadius: "md", padding: "s4", gap: "s4" }}>
        {isEmpty ? (
          <AddDeviceRow onAddNewDevice={onAddNewDevice} disabled={disabled} />
        ) : (
          shownDevices.map(item => (
            <DeviceRow
              key={item.key}
              item={item}
              disabled={disabled}
              onOpenMenu={() => setMenuDeviceKey(item.key)}
            />
          ))
        )}
        {isCollapsible && (
          <Button
            appearance="gray"
            size="md"
            isFull
            onPress={() => setIsExpanded(expanded => !expanded)}
          >
            {isExpanded
              ? t("connectKnownOrNewDevice.showLess")
              : t("connectKnownOrNewDevice.showAll", { count: devices.length })}
          </Button>
        )}
      </Box>
      {children}
      <DeviceMenuSheet item={menuDevice} onClose={() => setMenuDeviceKey(null)} />
    </Box>
  );
}
