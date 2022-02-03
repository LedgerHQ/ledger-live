import React from "react";
import { StyleSheet } from "react-native";
import BaseModal, { BaseModalProps } from "../BaseModal";

const modalStyleOverrides = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    minHeight: 0,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 24,
    paddingBottom: 24,
    maxHeight: "100%",
  },
});

export default function BottomDrawer({
  children,
  ...restProps
}: BaseModalProps): React.ReactElement {
  return (
    <BaseModal
      {...restProps}
      modalStyle={modalStyleOverrides.modal}
      containerStyle={modalStyleOverrides.container}
      propagateSwipe={true}
    >
      {children}
    </BaseModal>
  );
}
