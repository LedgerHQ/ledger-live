import React from "react";
import { TextInput } from "react-native";
import { TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../../Layout/Flex";
import Text from "../../../Text";

const PercentButton = styled(TouchableOpacity)<{ active?: boolean }>`
  color: ${(p) => (p.active ? p.theme.colors.neutral.c00 : p.theme.colors.neutral.c70)};
  background-color: ${(p) => (p.active ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c00)};
  border-radius: 100px;
  border-width: 0;
  height: 31px;
  padding-left: 13px;
  padding-right: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function serialize(value?: number) {
  return value ? "" + value : "";
}
function deserialize(value: string) {
  try {
    return parseFloat(value);
  } catch (error) {
    return undefined;
  }
}

function NumberInput(
  {
    onPercentClick,
    max,
    value,
    disabled,
    ...inputProps
  }: InputProps<number | undefined> & {
    onPercentClick: (percent: number) => void;
    min?: number;
    max?: number;
  },
  ref?: React.ForwardedRef<TextInput>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      serialize={serialize}
      deserialize={deserialize}
      {...inputProps}
      value={value}
      disabled={disabled}
      keyboardType={"numeric"}
      renderRight={
        <FlexBox
          alignItems={"center"}
          justifyContent={"center"}
          py={"3px"}
          mr={"8px"}
          flexDirection={"row"}
        >
          {[0.25, 0.5, 0.75, 1].map((percent) => {
            const active = !!value && !!max && Number(value) === percent * Number(max);
            return (
              <PercentButton
                key={percent}
                onPress={() => onPercentClick(percent)}
                active={active}
                disabled={disabled}
              >
                <Text variant={"small"} color={active ? "neutral.c00" : "neutral.c70"}>
                  {percent * 100}%
                </Text>
              </PercentButton>
            );
          })}
        </FlexBox>
      }
    />
  );
}

export default React.forwardRef(NumberInput);
