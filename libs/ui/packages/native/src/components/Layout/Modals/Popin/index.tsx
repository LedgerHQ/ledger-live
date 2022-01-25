import React from "react";
import { StyleSheet } from "react-native";
import styled from "styled-components/native";

import BaseModal, { BaseModalProps } from "../BaseModal";
import Text from "../../../Text";
import Button, { ButtonProps } from "../../../cta/Button";

const FooterButtonsContainer = styled.View`
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  margin-top: auto;
  padding-top: 32px;
`;

const modalStyleOverrides = StyleSheet.create({
  container: {
    borderRadius: 4,
  },
});

export default function Popin({
  children,
  leftButtonText = "Cancel",
  rightButtonText = "Delete",
  onLeftButtonPress,
  onRightButtonPress,
  ...restProps
}: BaseModalProps & {
  leftButtonText?: string;
  rightButtonText?: string;
  onLeftButtonPress?: ButtonProps["onPress"];
  onRightButtonPress?: ButtonProps["onPress"];
}): React.ReactElement {
  return (
    <BaseModal {...restProps} containerStyle={modalStyleOverrides.container}>
      {children}
      <FooterButtonsContainer>
        <Button
          onPress={onLeftButtonPress}
          outline
          type={"shade"}
          style={{ flex: 1, marginRight: 8 }}
        >
          <Text>{leftButtonText}</Text>
        </Button>
        <Button onPress={onRightButtonPress} style={{ flex: 1 }}>
          <Text>{rightButtonText}</Text>
        </Button>
      </FooterButtonsContainer>
    </BaseModal>
  );
}
