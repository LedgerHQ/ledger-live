import React from "react";
import { StyleSheet } from "react-native";
import BaseModal, { BaseModalProps } from "../BaseModal";

const modalStyleOverrides = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: "flex-end",
    margin: 0,
    marginTop: 32,
  },
  safeContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  container: {
    minHeight: 0,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 16,
    maxHeight: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
      safeContainerStyle={modalStyleOverrides.safeContainer}
      containerStyle={modalStyleOverrides.container}
      propagateSwipe={true}
    >
      {children}
    </BaseModal>
  );
}
