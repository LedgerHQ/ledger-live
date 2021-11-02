import React from "react";
import Input, { InputProps, InputRenderRightContainer } from "../BaseInput";
import Text from "../../asorted/Text";
import styled from "styled-components";

export type Props = InputProps & { legend: string };

const Legend = styled(Text)`
  color: ${(props) => props.theme.colors.palette.neutral.c70};

  &[data-disabled="true"] {
    color: ${(props) => props.theme.colors.palette.neutral.c50};
  }
`;

export default function LegendInput({ legend, ...inputProps }: Props): JSX.Element {
  return (
    <Input
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
