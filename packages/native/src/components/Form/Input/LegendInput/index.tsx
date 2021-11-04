import React from "react";
import Input, { InputProps, InputRenderRightContainer } from "../BaseInput";
import Text from "../../../Text";

export default function LegendInput({
  legend,
  ...inputProps
}: InputProps & { legend: string }): JSX.Element {
  return (
    <Input
      {...inputProps}
      renderRight={
        <InputRenderRightContainer>
          <Text color={"palette.neutral.c70"} variant="body">
            {legend}
          </Text>
        </InputRenderRightContainer>
      }
    />
  );
}
