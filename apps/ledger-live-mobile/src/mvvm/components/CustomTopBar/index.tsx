import React, { useCallback } from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Stax, Apex, Flex, Nano } from "@ledgerhq/lumen-ui-rnative/symbols";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ICON_SIZE } from "LLM/components/TopBar/const";

type IconComponent = NonNullable<React.ComponentProps<typeof IconButton>["icon"]>;

export type TopBarActionIcon = {
  id: string;
  icon: IconComponent;
  callback: () => void;
  testID: string;
  accessibilityLabel: string;
};

type CustomTopBarProps = {
  onMyLedgerPress: () => void;
  customIcons: readonly TopBarActionIcon[];
};

export function CustomTopBar({ onMyLedgerPress, customIcons }: Readonly<CustomTopBarProps>) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");

  const deviceIcon: IconComponent = useCallback(
    ({ size, style }) => {
      switch (lastConnectedDevice?.modelId) {
        case DeviceModelId.nanoS:
        case DeviceModelId.nanoSP:
        case DeviceModelId.nanoX:
          return <Nano size={size ?? ICON_SIZE} style={style} color="base" />;
        case DeviceModelId.europa:
          return <Flex size={size ?? ICON_SIZE} style={style} color="base" />;
        case DeviceModelId.apex:
          return <Apex size={size ?? ICON_SIZE} style={style} color="base" />;
        case DeviceModelId.stax:
        default:
          return <Stax size={size ?? ICON_SIZE} style={style} color="base" />;
      }
    },
    [lastConnectedDevice?.modelId],
  );

  return (
    <Box lx={rowLx}>
      <IconButton
        onPress={onMyLedgerPress}
        testID="topbar-myledger"
        accessibilityLabel="My Ledger"
        appearance="transparent"
        icon={deviceIcon}
        size="md"
      />

      <Box lx={rightGroupLx}>
        {customIcons.map(item => (
          <IconButton
            key={item.id}
            onPress={item.callback}
            testID={item.testID}
            accessibilityLabel={item.accessibilityLabel}
            appearance="transparent"
            icon={item.icon}
            size="md"
          />
        ))}
      </Box>
    </Box>
  );
}

const rowLx: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  width: "full",
  justifyContent: "space-between",
};

const rightGroupLx: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
};
