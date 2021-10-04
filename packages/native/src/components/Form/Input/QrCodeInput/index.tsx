import React from "react";
import Input, { InputProps } from "@components/Form/Input/BaseInput";
import FlexBox from "@ui/components/Layout/Flex";
import QrCodeMedium from "@ui/assets/icons/QrCodeMedium";
import styled from "styled-components/native";
import { GestureResponderEvent, TouchableOpacity } from "react-native";

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
