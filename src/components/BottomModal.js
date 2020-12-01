// @flow

import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import ReactNativeModal from "react-native-modal";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import TrackScreen from "../analytics/TrackScreen";
import StyledStatusBar from "./StyledStatusBar";
import colors from "../colors";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import getWindowDimensions from "../logic/getWindowDimensions";
import DebugRejectSwitch from "./DebugRejectSwitch";

export type Props = {
  id?: string,
  isOpened?: boolean,
  onClose?: () => void,
  onModalHide?: () => void,
  children?: *,
  style?: ViewStyleProp,
  preventBackdropClick?: boolean,
  containerStyle?: ViewStyleProp,
  styles?: ViewStyleProp,
};

// Add some extra padding at the bottom of the modal
// and make it overflow the bottom of the screen
// so that the underlying UI doesn't show up
// when it gets the position wrong and display too high
// See Jira LL-451 and GitHub #617
const EXTRA_PADDING_SAMSUNG_FIX = 100;

const { width, height } = getWindowDimensions();

const BottomModal = ({
  isOpened,
  onClose = () => {},
  children,
  style,
  preventBackdropClick,
  id,
  containerStyle,
  styles: propStyles,
  ...rest
}: Props) => {
  const backDropProps = preventBackdropClick
    ? {}
    : {
        onBackdropPress: onClose,
        onBackButtonPress: onClose,
      };

  return (
    <ButtonUseTouchable.Provider value={true}>
      <ReactNativeModal
        {...rest}
        {...backDropProps}
        isVisible={isOpened}
        deviceWidth={width}
        deviceHeight={height}
        useNativeDriver
        hideModalContentWhileAnimating
        style={[styles.root, propStyles || {}]}
      >
        <View style={[styles.modal, containerStyle]}>
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
};

const styles = StyleSheet.create({
  root: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 8,
    paddingBottom: EXTRA_PADDING_SAMSUNG_FIX + 24,
    marginBottom: EXTRA_PADDING_SAMSUNG_FIX * -1,
  },
  swipeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 24,
    alignItems: "center",
    alignContent: "center",
    justifyContent: "center",
  },
  swipeIndicatorBar: {
    width: 100,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.lightFog,
  },
});

export default BottomModal;
