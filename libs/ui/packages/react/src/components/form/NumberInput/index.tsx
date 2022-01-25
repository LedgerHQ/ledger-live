import React from "react";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import styled from "styled-components";

// TODO: Replace me with a real button as soon as they are designed
const MaxButton = styled.button<{ active?: boolean }>`
  color: ${(p) => (p.active ? p.theme.colors.neutral.c00 : p.theme.colors.neutral.c70)};
  background-color: ${(p) => (p.active ? p.theme.colors.neutral.c100 : p.theme.colors.neutral.c00)};
  border-radius: 100px;
  border-width: 0;
  height: 31px;
  padding-left: 13px;
  padding-right: 13px;
  cursor: pointer;

  &:disabled {
    color: ${(p) => p.theme.colors.neutral.c50};
    background-color: ${(p) => (p.active ? p.theme.colors.neutral.c30 : "transparent")};
    cursor: unset;
  }
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
    value,
    onPercentClick,
    max,
    disabled,
    ...inputProps
  }: InputProps<number | undefined> & {
    onPercentClick: (percent: number) => void;
  },
  ref?: React.ForwardedRef<HTMLInputElement>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      serialize={serialize}
      deserialize={deserialize}
      {...inputProps}
      type={"number"}
      value={value}
      max={max}
      disabled={disabled}
      renderRight={
        <FlexBox alignItems={"center"} justifyContent={"center"} py={"3px"} mr={"8px"}>
          {[0.25, 0.5, 0.75, 1].map((percent) => (
            <MaxButton
              key={percent}
              onClick={() => onPercentClick(percent)}
              active={!!value && !!max && Number(value) === percent * Number(max)}
              disabled={disabled}
            >
              <Text variant={"tiny"} color={"inherit"}>
                {percent * 100}%
              </Text>
            </MaxButton>
          ))}
        </FlexBox>
      }
    />
  );
}

export default React.forwardRef(NumberInput);
