// @flow

import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSelector } from "react-redux";
import ReactNativeModal from "react-native-modal";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import { useTheme } from "@react-navigation/native";
import TrackScreen from "../analytics/TrackScreen";
import { isModalLockedSelector } from "../reducers/appstate";
import StyledStatusBar from "./StyledStatusBar";
import ButtonUseTouchable from "../context/ButtonUseTouchable";
import getWindowDimensions from "../logic/getWindowDimensions";

let isModalOpenedref = false;

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
  const { colors } = useTheme();
  const [open, setIsOpen] = useState(false);
  const isModalLocked = useSelector(isModalLockedSelector);
  const backDropProps = preventBackdropClick
    ? {}
    : {
        onBackdropPress: !isModalLocked ? onClose : undefined,
        onBackButtonPress: !isModalLocked ? onClose : undefined,
      };

  // workaround to make sure no double modal can be opened at same time
  useEffect(
    () => () => {
      isModalOpenedref = false;
    },
    [],
  );

  useEffect(() => {
    if (!!isModalOpenedref && isOpened) {
      onClose();
    } else {
      setIsOpen(isOpened);
    }
    isModalOpenedref = isOpened;
  }, [isOpened]); // do not add onClose it might cause some issues on modals ie: filter manager modal

  return (
    <ButtonUseTouchable.Provider value={true}>
      <ReactNativeModal
        {...rest}
        {...backDropProps}
        isVisible={open}
        deviceWidth={width}
        deviceHeight={height}
        useNativeDriver
        hideModalContentWhileAnimating
        style={[styles.root, propStyles || {}]}
      >
        <View
          style={[
            styles.modal,
            { backgroundColor: colors.card },
            containerStyle,
          ]}
        >
          <View style={style}>
            {open && id ? <TrackScreen category={id} /> : null}
            <StyledStatusBar
              backgroundColor={
                Platform.OS === "android" ? "rgba(0,0,0,0.7)" : "transparent"
              }
              barStyle="light-content"
            />
            {children}
          </View>
        </View>
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
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 8,
    paddingBottom: EXTRA_PADDING_SAMSUNG_FIX + 24,
    marginBottom: EXTRA_PADDING_SAMSUNG_FIX * -1,
  },
});

export default BottomModal;
