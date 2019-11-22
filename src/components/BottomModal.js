// @flow

import React, { Component } from "react";
import { View, StyleSheet, Platform } from "react-native";
import ReactNativeModal from "react-native-modal";

import TrackScreen from "../analytics/TrackScreen";
import StyledStatusBar from "./StyledStatusBar";
import colors from "../colors";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import getWindowDimensions from "../logic/getWindowDimensions";
import DebugRejectSwitch from "./DebugRejectSwitch";

export type Props = {
  id?: string,
  isOpened: boolean,
  onClose: () => *,
  children?: *,
  style?: *,
  preventBackdropClick?: boolean,
};

// Add some extra padding at the bottom of the modal
// and make it overflow the bottom of the screen
// so that the underlying UI doesn't show up
// when it gets the position wrong and display too high
// See Jira LL-451 and GitHub #617
const EXTRA_PADDING_SAMSUNG_FIX = 100;

class BottomModal extends Component<Props> {
  static defaultProps = {
    onClose: () => {},
  };
  render() {
    const {
      isOpened,
      onClose,
      children,
      style,
      preventBackdropClick,
      id,
      ...rest
    } = this.props;
    const { width, height } = getWindowDimensions();

    return (
      <ButtonUseTouchable.Provider value={true}>
        <ReactNativeModal
          isVisible={isOpened}
          onBackdropPress={preventBackdropClick ? () => {} : onClose}
          onBackButtonPress={preventBackdropClick ? () => {} : onClose}
          deviceWidth={width}
          deviceHeight={height}
          useNativeDriver
          style={{
            justifyContent: "flex-end",
            margin: 0,
          }}
          {...rest}
        >
          <View style={styles.modal}>
            <View style={style}>
              {isOpened && id ? <TrackScreen category={id} /> : null}
              <StyledStatusBar
                backgroundColor={
                  Platform.OS === "android" ? "rgba(0,0,0,0.7)" : "transparent"
                }
                barStyle="light-content"
              />
              {children}
            </View>
          </View>
          <DebugRejectSwitch />
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
    paddingBottom: EXTRA_PADDING_SAMSUNG_FIX + 24,
    marginBottom: EXTRA_PADDING_SAMSUNG_FIX * -1,
  },
});

export default BottomModal;
