import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import { TouchableOpacity } from "react-native";
import TemplateTabs, { BaseTabsProps, TabItemProps } from "../TemplateTabs";

const TabBbx = styled(TouchableOpacity)`
  text-align: center;
  margin: auto;
  flex: 1;
`;

const TabText = styled(Text).attrs({
  lineHeight: "48px",
  textAlign: "center",
  borderRadius: 48,
  px: 24,
  height: 48,
})``;

const StyledTabs = styled(TemplateTabs)`
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 35px;
  padding: 4px;
`;

export const GraphTab = ({
  onPress,
  isActive,
  label,
  activeColor = "neutral.c100",
  activeBg = "primary.c20",
}: TabItemProps): React.ReactElement => {
  return (
    <TabBbx onPress={onPress}>
      {isActive ? (
        <TabText variant="body" bg={activeBg} color={activeColor} fontWeight="semiBold">
          {label}
        </TabText>
      ) : (
        <TabText variant="body">{label}</TabText>
      )}
    </TabBbx>
  );
};

const GraphTabs = (props: BaseTabsProps): React.ReactElement => (
  <StyledTabs {...props} Item={GraphTab} />
);

export default GraphTabs;
