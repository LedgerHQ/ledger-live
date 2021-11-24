import React from "react";
import styled from "styled-components/native";
import Text from "../../../Text";
import { TouchableOpacity } from "react-native";
import Button from "../../../cta/Button";
import TemplateToggleGroup, {
  BaseToggleGroupProps,
  ItemToggleGroupProps,
} from "../TemplateToggleGroup";

export const ToggleBox = styled(TouchableOpacity)`
  text-align: center;
  margin: auto;
  flex: 1;
`;

export const StyledToggleGroup = styled(TemplateToggleGroup)`
  border: ${(p) => `1px solid ${p.theme.colors.palette.neutral.c40}`};
  border-radius: 35px;
  padding: 4px;
`;

const ButtonToggle = ({
  onPress,
  isActive,
  label,
}: ItemToggleGroupProps): React.ReactElement => {
  return (
    <ToggleBox onPress={onPress}>
      {isActive ? (
        <Button type="main">{label}</Button>
      ) : (
        <Text lineHeight={36} textAlign={"center"}>
          {label}
        </Text>
      )}
    </ToggleBox>
  );
};

const ButtonToggleGroup = (props: BaseToggleGroupProps): React.ReactElement => (
  <StyledToggleGroup {...props} Item={ButtonToggle} />
);

export default ButtonToggleGroup;
