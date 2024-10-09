import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import { TouchableOpacity } from "react-native";
import TemplateTabs, { BaseTabsProps, TabItemProps } from "../TemplateTabs";

const TabBox = styled(TouchableOpacity)<
  Pick<TabItemProps, "isActive" | "size" | "activeBg" | "inactiveBg" | "stretchItems">
>`
  text-align: center;
  flex-grow: ${(p) => (p.stretchItems ? "1" : "0")};
  margin: auto;
  padding: ${(p) => p.theme.space[p.size === "small" ? 3 : 5]}px;
  border-radius: 8px;
  background-color: ${(p) =>
    p.isActive ? p.activeBg ?? p.theme.colors.primary.c20 : p.inactiveBg ?? "transparent"};
`;

export const ChipTab = ({
  onPress,
  isActive,
  label,
  disabled,
  activeBg,
  activeColor,
  inactiveBg,
  inactiveColor,
  stretchItems,
  size = "medium",
}: TabItemProps): React.ReactElement => (
  <TabBox
    activeBg={activeBg}
    disabled={disabled}
    inactiveBg={inactiveBg}
    isActive={isActive}
    stretchItems={stretchItems}
    onPress={onPress}
    size={size}
  >
    <Text
      variant="small"
      fontWeight="semiBold"
      color={
        isActive ? activeColor ?? "palette.neutral.c100" : inactiveColor ?? "palette.neutral.c80"
      }
      textAlign="center"
    >
      {label}
    </Text>
  </TabBox>
);

const ChipTabs = (props: BaseTabsProps): React.ReactElement => (
  <TemplateTabs {...props} Item={ChipTab} />
);

export default ChipTabs;
