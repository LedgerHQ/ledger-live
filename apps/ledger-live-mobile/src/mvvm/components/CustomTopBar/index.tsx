import React, { useCallback } from "react";
import { Box, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";
import { getDeviceIcon, IconComponent } from "LLM/utils/getDeviceIcon";

export type TopBarActionIcon = {
  id: string;
  icon: IconComponent;
  callback: () => void;
  testID: string;
  accessibilityLabel: string;
  loading?: boolean;
};

type CustomTopBarProps = {
  onMyLedgerPress: () => void;
  customIcons: readonly TopBarActionIcon[];
};

export function CustomTopBar({ onMyLedgerPress, customIcons }: Readonly<CustomTopBarProps>) {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const deviceIcon: IconComponent = useCallback(
    ({ size, style }) => getDeviceIcon(lastConnectedDevice, size, style),
    [lastConnectedDevice],
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
            loading={item.loading}
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
