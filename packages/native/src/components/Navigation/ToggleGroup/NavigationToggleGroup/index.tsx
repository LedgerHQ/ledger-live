import React from "react";
import styled from "styled-components/native";
import Text from "../../../Text";
import { TouchableOpacity } from "react-native";
import TemplateToggleGroup, {
  BaseToggleGroupProps,
  ItemToggleGroupProps,
} from "../TemplateToggleGroup";

export const ToggleBox = styled(TouchableOpacity)<{ isActive: boolean }>`
  text-align: center;
  margin: auto;
  flex: 1;
  padding: ${(p) => p.theme.space[5]}px 0;
  border-radius: 8px;
  ${(p) =>
    p.isActive &&
    `
    background-color: ${p.theme.colors.palette.primary.c20};
  `}
`;

export const StyledToggleGroup = styled(TemplateToggleGroup)``;

export const NavigationToggle = ({
  onPress,
  isActive,
  label,
}: ItemToggleGroupProps): React.ReactElement => {
  return (
    <ToggleBox isActive={isActive} onPress={onPress}>
      <Text
        variant={"small"}
        fontWeight={"semiBold"}
        color={isActive ? "palette.neutral.c100" : "palette.neutral.c80"}
        textAlign={"center"}
      >
        {label}
      </Text>
    </ToggleBox>
  );
};

const NavigationToggleGroup = (
  props: BaseToggleGroupProps
): React.ReactElement => (
  <StyledToggleGroup {...props} Item={NavigationToggle} />
);

export default NavigationToggleGroup;
