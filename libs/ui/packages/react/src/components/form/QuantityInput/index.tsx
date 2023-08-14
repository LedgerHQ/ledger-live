import React from "react";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../layout/Flex";
import Text from "../../asorted/Text";
import styled from "styled-components";

const MaxButton = styled.button`
  color: ${p => p.theme.colors.neutral.c00};
  background-color: ${p => p.theme.colors.neutral.c100};
  border-radius: 100px;
  border-width: 0;
  padding-left: 14px;
  padding-right: 14px;
  height: 100%;
  cursor: pointer;

  &:disabled {
    background-color: ${p => p.theme.colors.neutral.c30};
    color: ${p => p.theme.colors.neutral.c50};
    cursor: unset;
  }
`;

const Legend = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};

  &[data-disabled="true"] {
    color: ${p => p.theme.colors.neutral.c50};
  }
`;

function QuantityInput(
  {
    onMaxClick,
    price,
    ...inputProps
  }: InputProps & {
    onMaxClick?: (e: React.FormEvent<HTMLButtonElement>) => void;
    price?: string;
  },
  ref?: React.ForwardedRef<HTMLInputElement>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      {...inputProps}
      type={"number"}
      renderRight={
        <FlexBox alignItems={"center"} justifyContent={"center"} pr={"3px"} py={"3px"}>
          {price && (
            <Legend variant="body" pr={"12px"} data-disabled={inputProps.disabled}>
              {price}
            </Legend>
          )}
          <MaxButton onClick={onMaxClick} disabled={inputProps.disabled}>
            <Text variant="tiny" color="currentColor">
              Max
            </Text>
          </MaxButton>
        </FlexBox>
      }
    />
  );
}

export default React.forwardRef(QuantityInput);
