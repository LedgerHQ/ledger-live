// @flow

import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import ReactNativeModal from "react-native-modal";

import Animated from "react-native-reanimated";
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
  containerStyle?: *,
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
  ...rest
}: Props) => {
  const [top] = useState(new Animated.Value(0));

  const onSwipeMove = a => top.setValue((1 - a) * 100);
  const onSwipeCancel = () => top.setValue(0);
  const onSwipeComplete = useCallback(() => {
    onClose();
  }, [onClose, top]);

  const gesturesCloseProps = preventBackdropClick
    ? {}
    : {
        onBackdropPress: onClose,
        onBackButtonPress: onClose,
        onSwipeComplete,
        onSwipeMove,
        onSwipeCancel,
        swipeDirection: "down",
        onModalHide: onSwipeCancel,
      };

  return (
    <ButtonUseTouchable.Provider value={true}>
      <ReactNativeModal
        isVisible={isOpened}
        deviceWidth={width}
        deviceHeight={height}
        useNativeDriver
        hideModalContentWhileAnimating
        style={{
          justifyContent: "flex-end",
          margin: 0,
        }}
        {...gesturesCloseProps}
        {...rest}
      >
        <Animated.View
          style={[
            styles.modal,
            containerStyle,
            !preventBackdropClick ? { transform: [{ translateY: top }] } : {},
          ]}
        >
          {!preventBackdropClick && (
            <View style={styles.swipeIndicator}>
              <View style={styles.swipeIndicatorBar} />
            </View>
          )}
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
        </Animated.View>
        <DebugRejectSwitch />
      </ReactNativeModal>
    </ButtonUseTouchable.Provider>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 32,
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
    width: "50%",
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.lightFog,
  },
});

export default BottomModal;
