// @flow

import React, { Component } from "react";
import { View, StyleSheet, Platform } from "react-native";
import ReactNativeModal from "react-native-modal";

import StyledStatusBar from "./StyledStatusBar";
import colors from "../colors";
import ButtonUseTouchable from "../context/ButtonUseTouchable";

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
      <ButtonUseTouchable.Provider value={true}>
        <ReactNativeModal
          isVisible={isOpened}
          onBackdropPress={onClose}
          onBackButtonPress={onClose}
          useNativeDriver
          style={{
            justifyContent: "flex-end",
            margin: 0,
          }}
        >
          <View style={[styles.modal, style]}>
            <StyledStatusBar
              backgroundColor={
                Platform.OS === "android" ? "rgba(0,0,0,0.7)" : "transparent"
              }
              barStyle="light-content"
            />
            {children}
          </View>
        </ReactNativeModal>
      </ButtonUseTouchable.Provider>
    );
  }
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 34,
  },
});

export default BottomModal;
