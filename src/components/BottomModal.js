// @flow

import React, { Component } from "react";
import { View, StyleSheet, Platform } from "react-native";
import ReactNativeModal from "react-native-modal";

import TrackScreen from "../analytics/TrackScreen";
import StyledStatusBar from "./StyledStatusBar";
import colors from "../colors";
import ButtonUseTouchable from "../context/ButtonUseTouchable";

export type Props = {
  id: string,
  isOpened: boolean,
  onClose: () => *,
  children?: *,
  style?: *,
};

class BottomModal extends Component<Props> {
  static defaultProps = {
    onClose: () => {},
  };
  render() {
    const { isOpened, onClose, children, style, id, ...rest } = this.props;
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
          {...rest}
        >
          <View style={[styles.modal, style]}>
            {isOpened ? <TrackScreen category={id} /> : null}
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
    paddingTop: 8,
    paddingBottom: 24,
  },
});

export default BottomModal;
