import React from "react";
import Input, { InputProps, InputRenderRightContainer } from "../BaseInput";
import Text from "../../asorted/Text";
import styled from "styled-components";

export type Props = InputProps & { legend: string };

const Legend = styled(Text)`
  color: ${(props) => props.theme.colors.neutral.c70};

  &[data-disabled="true"] {
    color: ${(props) => props.theme.colors.neutral.c50};
  }
`;

function LegendInput(
  { legend, ...inputProps }: Props,
  ref?: React.ForwardedRef<HTMLInputElement>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      {...inputProps}
      renderRight={
        <InputRenderRightContainer>
          <Legend variant="body" data-disabled={inputProps.disabled}>
            {legend}
          </Legend>
        </InputRenderRightContainer>
      }
    />
  );
}

export default React.forwardRef(LegendInput);
