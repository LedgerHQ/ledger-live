// @flow

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import ReactNativeModal from "react-native-modal";

import colors from "../colors";

export type Props = {
  isOpened: boolean,
  onClose: () => *,
  children?: *,
  style?: *,
};

class BottomModal extends Component<Props> {
  render() {
    const { isOpened, onClose, children, style } = this.props;
    return (
      <ReactNativeModal
        isVisible={isOpened}
        onBackdropPress={onClose}
        useNativeDriver
        style={{
          justifyContent: "flex-end",
          margin: 0,
        }}
      >
        <View style={[styles.modal, style]}>{children}</View>
      </ReactNativeModal>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
});

export default BottomModal;
