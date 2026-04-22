import React from "react";
import { Platform } from "react-native";
import { Box, IconButton, type IconButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { TopBarActionIcon } from "./useMyLedgerTopBarAction";

export type { TopBarActionIcon } from "./useMyLedgerTopBarAction";
export { useMyLedgerTopBarAction } from "./useMyLedgerTopBarAction";

type CustomTopBarProps = {
  leadingIcons: readonly TopBarActionIcon[];
  trailingIcons: readonly TopBarActionIcon[];
};

export function CustomTopBar({ leadingIcons, trailingIcons }: Readonly<CustomTopBarProps>) {
  const isAndroid = Platform.OS === "android";
  const appearance: IconButtonProps["appearance"] = isAndroid ? "gray" : "transparent";
  return (
    <Box lx={rowLx}>
      <Box lx={iconsGroupLayout}>
        {leadingIcons.map(item => (
          <IconButton
            key={item.id}
            onPress={item.callback}
            testID={item.testID}
            accessibilityLabel={item.accessibilityLabel}
            appearance={appearance}
            icon={item.icon}
            size="md"
            loading={item.loading}
          />
        ))}
      </Box>

      <Box lx={iconsGroupLayout}>
        {trailingIcons.map(item => (
          <IconButton
            key={item.id}
            onPress={item.callback}
            testID={item.testID}
            accessibilityLabel={item.accessibilityLabel}
            appearance={appearance}
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

const iconsGroupLayout: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
};
