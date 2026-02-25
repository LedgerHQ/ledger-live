import React from "react";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../layout/Flex";
import QrCodeMedium from "@ledgerhq/icons-ui/reactLegacy/QrCodeMedium";
import styled from "styled-components";

const QrCodeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border-width: 0;
  color: ${p => p.theme.colors.neutral.c00};
  background-color: ${p => p.theme.colors.neutral.c100};
  cursor: pointer;

  &:disabled {
    background-color: ${p => p.theme.colors.neutral.c30};
    color: ${p => p.theme.colors.neutral.c50};
    cursor: unset;
  }
`;

function QrCodeInput(
  {
    onQrCodeClick,
    ...inputProps
  }: InputProps & { onQrCodeClick?: (e: React.FormEvent<HTMLButtonElement>) => void },
  ref?: React.ForwardedRef<HTMLInputElement>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      {...inputProps}
      renderRight={
        <FlexBox alignItems={"center"} justifyContent={"center"} pr={"8px"}>
          <QrCodeButton onClick={onQrCodeClick} disabled={inputProps.disabled}>
            <QrCodeMedium size="20px" />
          </QrCodeButton>
        </FlexBox>
      }
    />
  );
}

export default React.forwardRef(QrCodeInput);
