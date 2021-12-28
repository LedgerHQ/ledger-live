import React from "react";
import styled from "styled-components/native";
import Text from "../../Text";
import { TouchableOpacity } from "react-native";
import Button from "../../cta/Button";
import TemplateTabs, { BaseTabsProps, TabItemProps } from "../TemplateTabs";

const TabBbx = styled(TouchableOpacity)`
  text-align: center;
  margin: auto;
  flex: 1;
`;

const StyledTabs = styled(TemplateTabs)`
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 35px;
  padding: 4px;
`;

export const GraphTab = ({ onPress, isActive, label }: TabItemProps): React.ReactElement => {
  return (
    <TabBbx onPress={onPress}>
      {isActive ? (
        <Button type="main">{label}</Button>
      ) : (
        <Text lineHeight={36} textAlign={"center"}>
          {label}
        </Text>
      )}
    </TabBbx>
  );
};

const GraphTabs = (props: BaseTabsProps): React.ReactElement => (
  <StyledTabs {...props} Item={GraphTab} />
);

export default GraphTabs;
