import React from "react";

import BaseModal, { BaseModalProps } from "@components/Layout/Modal/BaseModal";
import { StyleSheet } from "react-native";

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
      swipeDirection={["down"]}
      propagateSwipe={true}
    >
      {children}
    </BaseModal>
  );
}
