/* @flow */
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";

import { useTheme } from "@react-navigation/native";
import Touchable from "./Touchable";
import Close from "../icons/Close";
import BottomModal from "./BottomModal";
import type { Props as BottomModalProps } from "./BottomModal";
import GenericErrorView from "./GenericErrorView";

type Props = BottomModalProps & {
  error: ?Error,
  onClose?: () => void,
  footerButtons?: React$Node,
};

function GenericErrorBottomModal({
  error,
  onClose,
  footerButtons,
  ...otherProps
}: Props) {
  const { colors } = useTheme();
  return (
    <BottomModal
      {...otherProps}
      id="ErrorModal"
      isOpened={!!error}
      onClose={onClose}
    >
      {error ? (
        <View style={styles.root}>
          <GenericErrorView error={error} />
          {footerButtons ? (
            <View style={styles.buttonsContainer}>{footerButtons}</View>
          ) : null}
          {onClose ? (
            <Touchable
              event="BottomModalErrorClose"
              style={styles.close}
              onPress={onClose}
            >
              <Close color={colors.fog} size={20} />
            </Touchable>
          ) : null}
        </View>
      ) : null}
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    minHeight: 280,
    paddingHorizontal: 20,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexGrow: 1,
    paddingTop: 16,
  },
});

export default memo<Props>(GenericErrorBottomModal);
