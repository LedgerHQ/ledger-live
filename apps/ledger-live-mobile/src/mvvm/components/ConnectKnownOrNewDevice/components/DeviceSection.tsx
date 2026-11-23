import React, { useState } from "react";
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
  LinearTransition,
} from "react-native-reanimated";
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
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Plus, PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { DeviceMenuSheet } from "./DeviceMenuSheet";
import { DeviceRow, hasMenuActions, type DeviceRowItem } from "./DeviceRow";

const COLLAPSED_DEVICE_COUNT = 3;
const ANIMATION_DURATION_MS = 200;
const layoutTransition = LinearTransition.duration(ANIMATION_DURATION_MS);
const rowEntering = FadeIn.duration(ANIMATION_DURATION_MS);
const rowExiting = FadeOut.duration(ANIMATION_DURATION_MS);

type DeviceSectionProps = {
  /** Only the rows of `Discovering` have actions. */
  devices: Array<DeviceRowItem>;
  /** Only set in `Discovering`. */
  onAddNewDevice?: () => void;
  /** Set while discovery is paused: the rows and the Add button show greyed out. */
  disabled?: boolean;
  /** Shown right under the list, only when the list has devices. */
  listFooter?: React.ReactNode;
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
  listFooter,
  children,
}: Readonly<DeviceSectionProps>): React.JSX.Element {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuDeviceKey, setMenuDeviceKey] = useState<string | null>(null);
  const styles = useStyleSheet(
    theme => ({
      card: {
        backgroundColor: theme.colors.bg.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacings.s4,
        gap: theme.spacings.s4,
      },
      showAll: {
        padding: theme.spacings.s8,
      },
    }),
    [],
  );

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
            underline={false}
            icon={PlusCircleFill}
            onPress={onAddNewDevice}
          >
            {t("connectKnownOrNewDevice.add")}
          </Link>
        )}
      </Box>
      <LayoutAnimationConfig skipEntering skipExiting>
        <Animated.View layout={layoutTransition} style={styles.card}>
          {isEmpty ? (
            <AddDeviceRow onAddNewDevice={onAddNewDevice} disabled={disabled} />
          ) : (
            shownDevices.map(item => (
              <Animated.View
                key={item.key}
                entering={rowEntering}
                exiting={rowExiting}
                layout={layoutTransition}
              >
                <DeviceRow
                  item={item}
                  disabled={disabled}
                  onOpenMenu={() => setMenuDeviceKey(item.key)}
                />
              </Animated.View>
            ))
          )}
          {isCollapsible && (
            <Animated.View layout={layoutTransition} style={styles.showAll}>
              <Button
                appearance="transparent"
                size="sm"
                isFull
                onPress={() => setIsExpanded(expanded => !expanded)}
              >
                {isExpanded
                  ? t("connectKnownOrNewDevice.showLess")
                  : t("connectKnownOrNewDevice.showAll", { count: devices.length })}
              </Button>
            </Animated.View>
          )}
        </Animated.View>
      </LayoutAnimationConfig>
      {!isEmpty && listFooter}
      {children}
      <DeviceMenuSheet item={menuDevice} onClose={() => setMenuDeviceKey(null)} />
    </Box>
  );
}
