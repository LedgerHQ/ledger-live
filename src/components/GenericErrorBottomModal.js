/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";
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

class GenericErrorBottomModal extends PureComponent<Props> {
  render() {
    const { error, onClose, footerButtons, ...otherProps } = this.props;
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

export default GenericErrorBottomModal;
