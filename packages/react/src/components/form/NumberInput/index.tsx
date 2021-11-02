import React from "react";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import styled from "styled-components";

// TODO: Replace me with a real button as soon as they are designed
const MaxButton = styled.button<{ active?: boolean }>`
  color: ${(p) =>
    p.active ? p.theme.colors.palette.neutral.c00 : p.theme.colors.palette.neutral.c70};
  background-color: ${(p) =>
    p.active ? p.theme.colors.palette.neutral.c100 : p.theme.colors.palette.neutral.c00};
  border-radius: 100px;
  border-width: 0;
  height: 31px;
  padding-left: 13px;
  padding-right: 13px;
  cursor: pointer;

  &:disabled {
    color: ${(p) => p.theme.colors.palette.neutral.c50};
    background-color: ${(p) => (p.active ? p.theme.colors.palette.neutral.c30 : "transparent")};
    cursor: unset;
  }
`;

export default function NumberInput({
  onPercentClick,
  max,
  value,
  disabled,
  ...inputProps
}: InputProps & {
  onPercentClick: (percent: number) => void;
}): JSX.Element {
  return (
    <Input
      {...inputProps}
      value={value}
      max={max}
      disabled={disabled}
      type={"number"}
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
