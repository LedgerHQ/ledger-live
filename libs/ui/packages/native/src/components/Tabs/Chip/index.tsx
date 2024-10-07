import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import { TouchableOpacity } from "react-native";
import TemplateTabs, { BaseTabsProps, TabItemProps } from "../TemplateTabs";

const TabBox = styled(TouchableOpacity)<Pick<TabItemProps, "isActive" | "size">>`
  text-align: center;
  margin: auto;
  flex: 1;
  padding: ${(p) => p.theme.space[p.size === "small" ? 3 : 5]}px 0;
  border-radius: 8px;
  background-color: ${(p) => (p.isActive ? p.theme.colors.palette.primary.c20 : "transparent")};
`;

const StyledTabs = styled(TemplateTabs)``;

export const ChipTab = ({
  onPress,
  isActive,
  label,
  disabled,
  size = "medium",
}: TabItemProps): React.ReactElement => {
  return (
    <TabBox isActive={isActive} onPress={onPress} disabled={disabled} size={size}>
      <Text
        variant="small"
        fontWeight="semiBold"
        color={isActive ? "palette.neutral.c100" : "palette.neutral.c80"}
        textAlign="center"
      >
        {label}
      </Text>
    </TabBox>
  );
};

const ChipTabs = (props: BaseTabsProps): React.ReactElement => (
  <StyledTabs {...props} Item={ChipTab} />
);

export default ChipTabs;
