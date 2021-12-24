import React from "react";
import { TextInput } from "react-native";
import { GestureResponderEvent, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../../Layout/Flex";
import QrCodeMedium from "@ledgerhq/icons-ui/native/QrCodeMedium";

const QrCodeButton = styled(TouchableOpacity)`
  background-color: ${(p) => p.theme.colors.neutral.c100};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 40px;
  border-width: 0;
`;

const Icon = styled(QrCodeMedium).attrs((p) => ({
  color: p.theme.colors.neutral.c00,
}))``;

function QrCodeInput(
  {
    onQrCodeClick,
    ...inputProps
  }: InputProps & {
    onQrCodeClick?: (event: GestureResponderEvent) => void;
  },
  ref?: React.ForwardedRef<TextInput>,
): JSX.Element {
  return (
    <Input
      ref={ref}
      {...inputProps}
      renderRight={
        <FlexBox alignItems={"center"} justifyContent={"center"} pr={"8px"}>
          <QrCodeButton onPress={onQrCodeClick}>
            <Icon size={"20px"} />
          </QrCodeButton>
        </FlexBox>
      }
    />
  );
}

export default React.forwardRef(QrCodeInput);
