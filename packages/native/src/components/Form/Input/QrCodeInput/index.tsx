import React from "react";
import { GestureResponderEvent, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Input, { InputProps } from "../BaseInput";
import FlexBox from "../../../Layout/Flex";
import QrCodeMedium from "../../../../assets/icons/QrCodeMedium";

const QrCodeButton = styled(TouchableOpacity)`
  background-color: ${(p) => p.theme.colors.palette.neutral.c100};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 40px;
  border-width: 0;
`;

const Icon = styled(QrCodeMedium).attrs((p) => ({
  color: p.theme.colors.palette.neutral.c00,
}))``;

export default function QrCodeInput({
  onQrCodeClick,
  ...inputProps
}: InputProps & {
  onQrCodeClick?: (event: GestureResponderEvent) => void;
}): JSX.Element {
  return (
    <Input
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
