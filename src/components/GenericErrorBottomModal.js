/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";
import LText from "./LText";
import ErrorIcon from "./ErrorIcon";
import Touchable from "./Touchable";
import Close from "../icons/Close";
import BottomModal from "./BottomModal";
import TranslatedError from "./TranslatedError";

class GenericErrorButtonModal extends PureComponent<{
  error: ?Error,
  onClose?: () => void,
  footerButtons?: React$Node,
}> {
  render() {
    const { error, onClose, footerButtons } = this.props;
    return (
      <BottomModal isOpened={!!error} onClose={onClose}>
        {error ? (
          <View style={styles.root}>
            <View style={styles.body}>
              <View style={styles.headIcon}>
                <ErrorIcon error={error} />
              </View>
              <LText secondary semiBold style={styles.title}>
                <TranslatedError error={error} />
              </LText>
              <LText style={styles.description}>
                <TranslatedError error={error} field="description" />
              </LText>
            </View>
            {footerButtons ? (
              <View style={styles.buttonsContainer}>{footerButtons}</View>
            ) : null}
            {onClose ? (
              <Touchable style={styles.close} onPress={onClose}>
                <Close color={colors.fog} size={20} />
              </Touchable>
            ) : null}
          </View>
        ) : null}
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    minHeight: 280,
    paddingHorizontal: 20,
  },
  body: {
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  headIcon: {
    padding: 10,
  },
  title: {
    paddingVertical: 20,
    fontSize: 16,
    color: colors.darkBlue,
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    alignItems: "flex-end",
    flexGrow: 1,
  },
});

export default GenericErrorButtonModal;
