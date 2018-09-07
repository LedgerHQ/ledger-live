// @flow

import React, { Component } from "react";
import { View } from "react-native";
import ReactNativeModal from "react-native-modal";

import colors from "../colors";

export type Props = {
  isOpened: boolean,
  onClose: () => *,
  children?: *,
};

class BottomModal extends Component<Props> {
  render() {
    const { isOpened, onClose, children } = this.props;
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
        <View
          style={{
            backgroundColor: colors.white,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
          }}
        >
          {children}
        </View>
      </ReactNativeModal>
    );
  }
}

export default BottomModal;
