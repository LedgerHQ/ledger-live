import React from "react";
import { TextInput } from "react-native";
import Input, { InputProps, InputRenderRightContainer } from "../BaseInput";
import Text from "../../../Text";

function LegendInput(
  { legend, ...inputProps }: InputProps & { legend: string },
  ref?: React.ForwardedRef<TextInput>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      {...inputProps}
      renderRight={
        <InputRenderRightContainer>
          <Text color={"neutral.c70"} variant="body">
            {legend}
          </Text>
        </InputRenderRightContainer>
      }
    />
  );
}

export default React.forwardRef(LegendInput);
