// @flow

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import ReactNativeModal from "react-native-modal";

import { useTheme } from "@react-navigation/native";
import type { BaseButtonProps } from "./Button";

import getWindowDimensions from "../logic/getWindowDimensions";

import Close from "../icons/Close";
import LText from "./LText";
import Button from "./Button";

const { width, height } = getWindowDimensions();

export type Props = {
  id?: string,
  isOpened: boolean,
  type: "default" | "primary" | "error",
  title: string,
  primaryAction: BaseButtonProps,
  secondaryAction: ?BaseButtonProps,
  onClose: () => *,
  children?: *,
  style?: *,
  preventBackdropClick?: boolean,
  containerStyle?: *,
  ...
};

function ToastBar({
  isOpened,
  onClose = () => {},
  containerStyle,
  type = "default",
  title,
  primaryAction,
  secondaryAction,
}: Props) {
  const { colors } = useTheme();
  let backgroundColor = colors.white;
  let color = colors.live;

  switch (type) {
    case "primary":
      backgroundColor = colors.live;
      color = "#FFF";
      break;
    case "error":
      backgroundColor = colors.alert;
      color = colors.white;
      break;
    default:
      break;
  }

  return (
    <ReactNativeModal
      isVisible={isOpened}
      onClose={onClose}
      hasBackdrop={false}
      coverScreen={false}
      deviceWidth={width}
      deviceHeight={height}
      useNativeDriver
      hideModalContentWhileAnimating
      style={[styles.root, { backgroundColor: colors.white }]}
    >
      <View
        style={[
          styles.toast,
          containerStyle,
          { borderColor: colors.lightFog, backgroundColor },
        ]}
      >
        <TouchableOpacity
          style={[styles.closeButton]}
          onPress={onClose}
          activeOpacity={0.5}
        >
          <Close size={16} color={color} />
        </TouchableOpacity>
        <View style={styles.storageRow}>
          <LText style={[styles.title, { color }]} semiBold>
            {title}
          </LText>
        </View>
        {(primaryAction || secondaryAction) && (
          <View style={styles.buttonRow}>
            {secondaryAction ? (
              <Button
                containerStyle={[
                  styles.button,
                  { color: colors.white, borderColor: color },
                ]}
                titleStyle={{ color, fontSize: 12 }}
                {...secondaryAction}
              />
            ) : (
              <View style={styles.button} />
            )}
            {primaryAction && (
              <Button
                containerStyle={[
                  styles.button,
                  styles.buttonMargin,
                  {
                    color: colors.white,
                    backgroundColor: color,
                    borderColor: color,
                  },
                ]}
                titleStyle={{ color: backgroundColor, fontSize: 12 }}
                {...primaryAction}
              />
            )}
          </View>
        )}
      </View>
    </ReactNativeModal>
  );
}

const styles = StyleSheet.create({
  root: {
    width,
    left: 0,
    bottom: 0,
    margin: 0,
    padding: 0,
    position: "absolute",
    zIndex: 100,
    overflow: "hidden",
  },
  toast: {
    width,
    paddingTop: 16,
    paddingBottom: 16,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      height: -4,
    },
    borderTopWidth: 1,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    height: 40,
    width: 40,
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  title: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 16,
    paddingHorizontal: 32,
    paddingVertical: 8,
  },
  storageRow: {
    paddingHorizontal: 16,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    marginTop: 16,
    height: 38,
  },
  button: {
    height: "100%",
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 4,
    borderColor: "transparent",
  },
  buttonMargin: {
    marginLeft: 16,
  },
});

export default ToastBar;
