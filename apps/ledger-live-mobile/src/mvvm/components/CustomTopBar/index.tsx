import React from "react";
import { Platform } from "react-native";
import { Box, IconButton, type IconButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { TopBarActionIcon } from "./useMyLedgerTopBarAction";

export type { TopBarActionIcon } from "./useMyLedgerTopBarAction";
export { useMyLedgerTopBarAction } from "./useMyLedgerTopBarAction";

function renderIconButton(item: TopBarActionIcon, appearance: IconButtonProps["appearance"]) {
  const button = (
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
  );
  return item.wrapper ? (
    <React.Fragment key={item.id}>{item.wrapper(button)}</React.Fragment>
  ) : (
    button
  );
}

type CustomTopBarProps = {
  leadingElement?: React.ReactNode;
  leadingIcons: readonly TopBarActionIcon[];
  trailingIcons: readonly TopBarActionIcon[];
};

export function CustomTopBar({
  leadingElement,
  leadingIcons,
  trailingIcons,
}: Readonly<CustomTopBarProps>) {
  const isAndroid = Platform.OS === "android";
  const appearance: IconButtonProps["appearance"] = isAndroid ? "gray" : "transparent";
  return (
    <Box lx={rowLx}>
      <Box lx={iconsGroupLayout}>
        {leadingElement}
        {leadingIcons.map(item => renderIconButton(item, appearance))}
      </Box>

      <Box lx={iconsGroupLayout}>
        {trailingIcons.map(item => renderIconButton(item, appearance))}
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
